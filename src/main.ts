import dotenv from 'dotenv';

import Match from './models/Panda/Match';
import {PandaService} from './services/api/PandaService';
import {FileService} from './services/FileService';

dotenv.config();

const TEAM_NAME = process.env.TEAM_NAME || 'Karmine';
const ICAL_PATH = process.env.ICAL_PATH || 'ical/karmine.ics';

const pandaService = new PandaService();
const fileService = new FileService();

async function generateIcsFile(teamName: string): Promise<void> {
    const teams = await pandaService.getTeams(teamName);
    if (!teams) return;


    const matches: Match[] = [];
    for (const team of teams) {
        matches.push(...await pandaService.getAllMatches(team));
    }

    await fileService.generateIcsFile(matches.map(fileService.createIcsEvent), ICAL_PATH);
}

function main(): void {
    generateIcsFile(TEAM_NAME).then();
}

main();
