import api from 'api';
const developersPandascore = api('@developers-pandascore/v2#1lcfevlxltohmi');
import dotenv from 'dotenv';
import fs from 'fs';
import * as ics from 'ics';
import * as ftp from 'basic-ftp';
import {v4 as uuidv4} from 'uuid';

import Match from './models/Match';
import Team from './models/Team';

dotenv.config();

const TOKEN = process.env.PANDASCORE_TOKEN!;
const FTP_HOST = process.env.FTP_HOST!;
const FTP_USER = process.env.FTP_USER!;
const FTP_PASS = process.env.FTP_PASS!;
const FTP_PATH = process.env.FTP_PATH!;

const BASE_URL = 'https://api.pandascore.co';
const options = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        authorization: `Bearer ${TOKEN}`,
    }
};

developersPandascore.auth(TOKEN);

let teams: Team[] = [];
let upcomingMatches: Match[] = [];
let pastMatches: Match[] = [];

async function getTeams(teamName: string) {
    await fetch(`${BASE_URL}/teams?search[name]=${teamName}`, options)
    .then(response => response.json())
    .then(data => {
        teams = data;
        console.log(`Found ${teams.length} teams`);
    })
    .catch(err => console.error(err));
}

async function getUpcomingMatches(teamId: number) {
    await fetch(`${BASE_URL}/matches/upcoming?filter[opponent_id]=${teamId}`, options)
    .then(response => response.json())
    .then(data => {
        upcomingMatches.push(...data);
        console.log(`Found ${data.length} upcoming matches for team ${teams.find(t => t.id === teamId)?.slug}`);
    })
    .catch(err => console.error(err));
}

async function getPastMatches(teamId: number, startDate: string, endDate: string) {
    await fetch(`${BASE_URL}/matches/past?filter[opponent_id]=${teamId}&range[scheduled_at]=${startDate},${endDate}`, options)
    .then(response => response.json())
    .then(data => {
        pastMatches.push(...data);
        console.log(`Found ${data.length} past matches for team ${teams.find(t => t.id === teamId)?.name}`);
    })
    .catch(err => console.error(err));
}

function updateEventSummary(event: any, match: Match) {
    const result = match.results.map(r => `${r.team_id} ${r.score}`).join(' - ');
    return `${event.SUMMARY}: ${result}`;
}

function createIcsEvent(match: Match) {
    return {
        uid: `${uuidv4()}@pa-martin.github.io`,
        sequence: match.id,
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        start: match.scheduled_at ?? match.begin_at,
        end: match.end_at || match.scheduled_at + 3600000 * (match.match_type === 'best_of' ? 3 : 1),
        title: match.status !== 'finished' ?
            `[${match.league.name}] ${match.name}` :
            `[${match.league.name}] ${match.name.replace('vs', match.results.map(r => r.score).join(' - '))}`,
        url: match.streams_list[0]?.raw_url || '',
    };
}

async function generateIcsFile(events: any[]) {
    let { error, value } = ics.createEvents(events);
    if (error) {
        console.error(error);
        return;
    }
    const calendarSettings = [
        'PRODID:pa-martin.github.io/ics',
        'NAME:KCORP',
        'X-WR-CALNAME:KCORP',
        'X-WR-CALDESC:Calendar with all matches of KCorp',
        'TIMEZONE-ID:UTC',
        'X-WR-TIMEZONE:UTC',
    ]
    value = value.replace('PRODID:adamgibbons/ics', calendarSettings.join('\n'));
    fs.writeFile(FTP_PATH, value, 'utf8', (err) => {
        if (err) {
            console.error(err);
            return;
        }
    });
    console.log('ICS file created');
    if (value) await uploadToFTP(value);
}

async function uploadToFTP(content: string) {
    const client = new ftp.Client();
    client.ftp.verbose = false;
    try {
        await client.access({
            host: FTP_HOST,
            user: FTP_USER,
            password: FTP_PASS,
            // secure: true,
        });
        await client.uploadFrom(FTP_PATH, `/www/${FTP_PATH}`);
        console.log('ICS file uploaded to FTP');
    } catch (err) {
        console.error(err);
    }
    client.close();
}

async function main() {
    await getTeams('Karmine');

    const currentDate = new Date();
    const startDate = `${currentDate.getFullYear()}-01-01`;
    const endDate = `${currentDate.getFullYear()}-12-31`;

    for (const team of teams) {
        await getUpcomingMatches(team.id);
        await getPastMatches(team.id, startDate, endDate);
    }

    const icsEvents = [...upcomingMatches, ...pastMatches].map(createIcsEvent);
    await generateIcsFile(icsEvents);
}

main();
