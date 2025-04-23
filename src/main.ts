import dotenv from 'dotenv';

import Match from './models/Panda/Match';
import NextMatch from "./models/Panda/NextMatch";
import {PandaService} from "./services/api/PandaService";
import {NantesService} from "./services/api/NantesService";
import {FTPService} from "./services/FTPService";
import Schedule from "./models/Nantes/Schedule";

dotenv.config();

const TEAM_NAME = process.env.TEAM_NAME || 'Karmine';
const CITY_NAME = process.env.CITY_NAME || 'Nantes';

const FTP_ICAL_PATH = process.env.FTP_ICAL_PATH || 'ical/karmine.ics';
const FTP_JSON_KC_PATH = process.env.FTP_JSON_KC_PATH || 'json/karmine.json';
const FTP_JSON_POOLS_PATH = process.env.FTP_JSON_POOLS_PATH || 'json/pools.json';

const pandaService = new PandaService();
const nantesService = new NantesService();
const ftpService = new FTPService();

async function generateTeamFiles(teamName: string): Promise<void> {
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
    await ftpService.uploadToFTP(FTP_ICAL_PATH);

    await ftpService.writeFile(FTP_JSON_KC_PATH, JSON.stringify(nextMatches));
    await ftpService.uploadToFTP(FTP_JSON_KC_PATH);
}

async function generatePoolSchedules(city: string): Promise<void> {
    const pools = await nantesService.fetchPools(city);

    if (!pools) return;
    const schedules: Record<string, Schedule> = {};
    for (const pool of pools) {
        schedules[pool.nom_usuel] = await nantesService.fetchSchedules(pool);
    }

    await ftpService.writeFile(FTP_JSON_POOLS_PATH, JSON.stringify(schedules))
    await ftpService.uploadToFTP(FTP_JSON_POOLS_PATH);
}

function main(): void {
    generateTeamFiles(TEAM_NAME).then()
    generatePoolSchedules(CITY_NAME).then();
}

main();
