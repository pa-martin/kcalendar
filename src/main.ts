import dotenv from 'dotenv';
import fs from 'fs-extra';
import * as ics from 'ics';
import * as ftp from 'basic-ftp';

import Event from './models/Event';
import Match from './models/Match';
import Team from './models/Team';

dotenv.config();

const TOKEN = process.env.PANDASCORE_TOKEN!;
const FTP_HOST = process.env.FTP_HOST!;
const FTP_PORT = process.env.FTP_PORT || '21';
const FTP_USER = process.env.FTP_USER!;
const FTP_PASS = process.env.FTP_PASS!;
const FTP_PATH = process.env.FTP_PATH!;
const TEAM_NAME = process.env.TEAM_NAME!;

const BASE_URL = 'https://api.pandascore.co';
const options = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        authorization: `Bearer ${TOKEN}`,
    }
};

async function getTeams(teamName: string): Promise<Team[]> {
    return fetch(`${BASE_URL}/teams?search[name]=${teamName}`, options)
    .then(response => response.json())
    .then(data => {
        console.log(`Found ${data.length} teams`);
        return data;
    })
    .catch(err => console.error(err));
}

async function getUpcomingMatches(team: Team): Promise<Match[]> {
    return fetch(`${BASE_URL}/matches/upcoming?filter[opponent_id]=${team.id}`, options)
    .then(response => response.json())
    .then(data => {
        console.log(`Found ${data.length} upcoming matches for team ${team.slug}`);
        return data;
    })
    .catch(err => console.error(err));
}

async function getPastMatches(team: Team, startDate: string, endDate: string): Promise<Match[]> {
    return fetch(`${BASE_URL}/matches/past?filter[opponent_id]=${team.id}&range[scheduled_at]=${startDate},${endDate}`, options)
    .then(response => response.json())
    .then(data => {
        console.log(`Found ${data.length} past matches for team ${team.slug}`);
        return data;
    })
    .catch(err => console.error(err));
}

function createIcsEvent(match: Match): Event {
    return {
        uid: `${match.id}@pa-martin.github.io`,
        sequence: 0,
        created: Date.now(),
        lastModified: Date.now(),
        start: Date.parse(match.scheduled_at ?? match.begin_at),
        end: match.end_at
            ? Date.parse(match.end_at)
            : Date.parse(match.scheduled_at) + 3600000 * match.number_of_games,
        title: match.status !== 'finished'
            ? `[${match.league.name}] ${match.name}`
            : `[${match.league.name}] ${match.name.replace('vs', match.results.map(r => r.score).join(' - '))}`,
        url: match.streams_list[0]?.raw_url || '',
        location: match.streams_list[0]?.raw_url || '',
    };
}

async function generateIcsFile(events: Event[]): Promise<string | Error> {
    let { error, value } = ics.createEvents(events);
    if (error) {
        return error;
    }
    const calendarSettings = [
        'PRODID:pa-martin.github.io/ics',
        'NAME:KCORP',
        'X-WR-CALNAME:KCORP',
        'X-WR-CALDESC:Calendar with all matches of KCorp',
        'TIMEZONE-ID:UTC',
        'X-WR-TIMEZONE:UTC',
    ];
    value = value.replace('PRODID:adamgibbons/ics', calendarSettings.join('\n'));
    await fs.ensureDir('ical');
    await fs.writeFile(FTP_PATH, value, 'utf8');
    return 'ICS file created';
}

async function uploadToFTP(): Promise<string> {
    const client = new ftp.Client();
    client.ftp.verbose = false;
    try {
        await client.access({
            host: FTP_HOST,
            port: parseInt(FTP_PORT),
            user: FTP_USER,
            password: FTP_PASS,
        });
        await client.uploadFrom(FTP_PATH, `/www/${FTP_PATH}`);
    } catch (err) {
        console.error(err);
    }
    client.close();
    return 'ICS file uploaded to FTP';
}

async function main(teamName: string): Promise<void> {
    const teams: Team[] = await getTeams(teamName);
    const currentDate = new Date();
    const startDate = `${currentDate.getFullYear()}-01-01`;
    const endDate = `${currentDate.getFullYear()}-12-31`;

    const matches: Match[] = [];
    for (const team of teams) {
        getUpcomingMatches(team).then(data => matches.push(...data));
        await getPastMatches(team, startDate, endDate).then(data => matches.push(...data));
    }

    console.log(await generateIcsFile(matches.map(createIcsEvent)));
    console.log(await uploadToFTP());
}

main(TEAM_NAME);
