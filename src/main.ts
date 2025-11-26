import dotenv from 'dotenv';

import Match from './models/Panda/Match';
import NextMatch from "./models/Panda/NextMatch";
import {PandaService} from "./services/api/PandaService";
import {FTPService} from "./services/FTPService";

dotenv.config();

const TEAM_NAME = process.env.TEAM_NAME || 'Karmine';
const FTP_ICAL_PATH = process.env.FTP_ICAL_PATH || 'ical/karmine.ics';
const FTP_JSON_PATH = process.env.FTP_JSON_PATH || 'json/karmine.json';

const pandaService = new PandaService();
const ftpService = new FTPService();

async function generateIcsFile(teamName: string): Promise<void> {
    const teams = await pandaService.getTeams(teamName);
    if (!teams) return;


    const matches: Match[] = [];
    const nextMatches: Record<string, NextMatch> = {};
    for (const team of teams) {
        const matchesTmp = await pandaService.getAllMatches(team);
        if (matchesTmp) matches.push(...matchesTmp);
        const nextMatchTmp = await pandaService.getNextMatch(team)
        nextMatches[team.slug] = ftpService.createNextMatch(nextMatchTmp, team);
    }

    await ftpService.generateIcsFile(matches.map(ftpService.createIcsEvent), FTP_ICAL_PATH);
    // console.log(await ftpService.uploadToFTP(FTP_ICAL_PATH));
    // console.log(await ftpService.writeFile(FTP_JSON_PATH, JSON.stringify(nextMatches)));
    // console.log(await ftpService.uploadToFTP(FTP_JSON_PATH));
}

async function main(): Promise<void> {
    generateIcsFile(TEAM_NAME).then()
}

main().then();
