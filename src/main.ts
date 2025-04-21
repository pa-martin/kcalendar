import dotenv from 'dotenv';

import Match from './models/Match';
import NextMatch from "./models/NextMatch";
import {ApiService} from "./services/ApiService";
import {FTPService} from "./services/FTPService";

dotenv.config();

const TEAM_NAME = process.env.TEAM_NAME || 'Karmine';
const FTP_ICAL_PATH = process.env.FTP_ICAL_PATH || 'ical/karmine.ics';
const FTP_JSON_PATH = process.env.FTP_JSON_PATH || 'json/karmine.json';

const apiService = new ApiService();
const ftpService = new FTPService();

async function generateIcsFile(teamName: string): Promise<void> {
    const teams = await apiService.getTeams(teamName);
    if (!teams) return;


    const matches: Match[] = [];
    const nextMatches: NextMatch[] = [];
    for (const team of teams) {
        const matchesTmp = await apiService.getAllMatches(team);
        if (matchesTmp) matches.push(...matchesTmp);
        const nextMatchTmp = await apiService.getNextMatch(team)
        nextMatches.push(ftpService.createNextMatch(nextMatchTmp, team));
    }

    await ftpService.generateIcsFile(matches.map(ftpService.createIcsEvent), FTP_ICAL_PATH);
    console.log(await ftpService.uploadToFTP(FTP_ICAL_PATH));
    console.log(await ftpService.writeFile(FTP_JSON_PATH, JSON.stringify(nextMatches)));
    console.log(await ftpService.uploadToFTP(FTP_JSON_PATH));
}

async function main(): Promise<void> {
    generateIcsFile(TEAM_NAME).then()
}

main().then();
