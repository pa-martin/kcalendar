import dotenv from 'dotenv';

import Match from './models/Panda/Match';
import {PandaHttpService} from './services/api/PandaHttpService';
import {FileService} from './services/FileService';
import log4js from 'log4js';

dotenv.config();

const TEAM_NAME = process.env.TEAM_NAME || 'Karmine';
const ICAL_PATH = process.env.ICAL_PATH || 'ical/karmine.ics';

const pandaHttpService = new PandaHttpService();
const fileService = new FileService();

const logger = log4js.getLogger('Main');
logger.level = process.env.LOG_LEVEL || 'info';

/**
 * Generate an ICS file for a given team and save it to the specified path.
 * @param teamName - The name of the team.
 * @param path - The file path where the ICS file will be saved.
 * @returns A promise that resolves when the ICS file has been generated.
 */
async function generateIcsFile(teamName: string, path: string): Promise<void> {
    const teams = await pandaHttpService.getTeams(teamName);
    if (!teams?.length) return;


    const matches: Match[] = [];
    for (const team of teams) {
        matches.push(...await pandaHttpService.getAllMatches(team));
    }

    await fileService.generateIcsFile(matches.map(fileService.createIcsEvent), teamName, path);
}

/**
 * Main function to generate ICS files for all specified teams.
 */
async function main(): Promise<void> {
    const teamNames = TEAM_NAME.split(',').map(name => name.trim());
    const pathNames = ICAL_PATH.split(',').map(path => path.trim());

    if (teamNames.length !== pathNames.length) {
        logger.fatal('The number of team names must match the number of ICS paths.');
        return;
    }

    for (let i = 0; i < teamNames.length; i++) {
        const name = teamNames[i];
        logger.info(`Generating ICS for team: ${name} at path: ${pathNames[i]}`);
        await generateIcsFile(name, pathNames[i]);
    }
}

main().then();
