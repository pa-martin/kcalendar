import dotenv from "dotenv";

import Match from "../../models/Panda/Match";
import Team from "../../models/Panda/Team";

dotenv.config();

const TOKEN = process.env.PANDASCORE_TOKEN || '';

const BASE_URL = 'https://api.pandascore.co';
const options = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        authorization: `Bearer ${TOKEN}`,
    }
};

const currentDate = new Date();
const startDate = `${currentDate.getFullYear()}-01-01`;
const endDate = `${currentDate.getFullYear()}-12-31`;

export class PandaService {
    private teams: Team[] = [];
    private matches: Record<number, Match[]> = {};

    async getTeams(teamName: string): Promise<Team[]> {
        await fetch(`${BASE_URL}/teams?search[name]=${teamName}`, options)
            .then(response => response.json())
            .then(data => data?.error ? [] : data)
            .then(data => this.teams = data)
            .catch(err => console.error((err as TypeError).message));
        
        if (this.teams?.length) {
            console.log(`Found ${this.teams.length} teams.`);
        } else {
            console.log('No teams found');
        }
        return this.teams;
    }

    private async fetchMatches(team: Team): Promise<void> {
        await fetch(`${BASE_URL}/matches?filter[opponent_id]=${team.id}&range[scheduled_at]=${startDate},${endDate}`, options)
            .then(response => response.json())
            .then(data => data?.error ? [] : data)
            .then(data => this.matches[team.id] = data)
            .catch(err => console.error((err as TypeError).message));

        if (this.matches[team.id]?.length) {
            console.log(`Found ${this.matches[team.id]?.length} matches for team ${team.slug}.`);
        } else {
            console.log(`No matches found for team ${team.slug}`);
        }
    }

    async getAllMatches(team: Team): Promise<Match[]> {
        if (this.matches[team.id]?.length > 0) {
            return this.matches[team.id];
        } else {
            await this.fetchMatches(team);
            return this.matches[team.id];
        }
    }

    async getNextMatch(team: Team): Promise<Match> {
        if (this.matches[team.id]?.length > 0) {
            this.matches[team.id]
                .sort((a, b) =>
                    Date.parse(a.scheduled_at ?? a.begin_at) - Date.parse(b.scheduled_at ?? b.begin_at)
                );
            return this.matches[team.id].find(match => match.scheduled_at > new Date().toISOString());
        } else {
            await this.fetchMatches(team);
            return this.matches[team.id].find(match => match.scheduled_at > new Date().toISOString());
        }
    }
}
