import dotenv from 'dotenv';

import Match from './models/Panda/Match';
import NextMatch from './models/Panda/NextMatch';
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
    const nextMatches: Record<string, NextMatch> = {};
    for (const team of teams) {
        const matchesTmp = await pandaService.getAllMatches(team);
        if (matchesTmp) matches.push(...matchesTmp);
        const nextMatchTmp = await pandaService.getNextMatch(team)
        nextMatches[team.slug] = fileService.createNextMatch(nextMatchTmp, team);
    }

    await fileService.generateIcsFile(matches.map(fileService.createIcsEvent), ICAL_PATH);
}

function main(): void {
    generateIcsFile(TEAM_NAME).then();
}

main();
