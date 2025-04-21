import dotenv from "dotenv";

import Match from "../models/Match";
import Team from "../models/Team";

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

export class ApiService {
    private teams: Team[] = [];
    private matches: Record<number, Match[]> = {};

    async getTeams(teamName: string): Promise<Team[]> {
        for (let i = 1; i <= 5; i++) {
            this.teams = await fetch(`${BASE_URL}/teams?search[name]=${teamName}`, options)
                .then(response => response.json())
                .then(data => data)
                .catch(err => console.error((err as TypeError).message));
            if (this.teams?.length){
                console.log(`Found ${this.teams.length} teams after ${i} attempts.`);
                // On sort de la boucle si on a trouvé des équipes
                break;
            } else if (i < 5) {
                // sleep 5 seconds
                await new Promise(resolve => setTimeout(resolve, 5000));
            } else {
                console.log('No teams found');
            }
        }
        return this.teams;
    }

    private async fetchMatches(team: Team): Promise<void> {
        for (let i = 1; i <= 5; i++) {
            this.matches[team.id] = await fetch(`${BASE_URL}/matches?filter[opponent_id]=${team.id}&range[scheduled_at]=${startDate},${endDate}`, options)
                .then(response => response.json())
                .then(data => data)
                .catch(err => console.error((err as TypeError).message));
            if (this.matches[team.id]?.length){
                console.log(`Found ${this.matches[team.id]?.length} matches for team ${team.slug} after ${i} attempts.`);
                // On sort de la boucle si on a trouvé des matchs
                break;
            } else if (i < 5) {
                // sleep 5 seconds
                await new Promise(resolve => setTimeout(resolve, 5000));
            } else {
                console.log(`No matches found for team ${team.slug}`);
            }
        }
    }

    async getAllMatches(team: Team): Promise<Match[]> {
        if (this.matches[team.id]?.length > 0) {
            return this.matches[team.id];
        } else {
            await this.fetchMatches(team);
        }
    }

    async getNextMatch(team: Team): Promise<Match> {
        if (this.matches[team.id].length > 0) {
            this.matches[team.id]
                .sort((a, b) =>
                    Date.parse(a.scheduled_at ?? a.begin_at) - Date.parse(b.scheduled_at ?? b.begin_at)
                );
            return this.matches[team.id].find(match => match.scheduled_at > new Date().toISOString());
        } else {
            await this.fetchMatches(team);
        }
    }
}
