import dotenv from 'dotenv';

import Match from '../../models/Panda/Match';
import Team from '../../models/Panda/Team';

dotenv.config();

const TOKEN = process.env.PANDASCORE_TOKEN || '';

const BASE_URL = 'https://api.pandascore.co';
const options = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        authorization: `Bearer ${TOKEN}`,
    },
};

const currentDate = new Date();
const startDate = `${currentDate.getFullYear()}-01-01`;
const endDate = `${currentDate.getFullYear()}-12-31`;

/**
 * A service for interacting with the PandaScore API to fetch teams and matches.
 */
export class PandaHttpService {
    private teams: Team[] = [];
    private matches: Record<number, Match[]> = {};

    /**
     * Get teams by name.
     * @param {string} teamName - The name of the team to search for.
     * @returns {Promise<Team[]>} A promise that resolves to an array of {@link Team} objects.
     */
    async getTeams(teamName: string): Promise<Team[]> {
        await fetch(`${BASE_URL}/teams?search[name]=${teamName}`, options)
        .then(response => response.json())
        .then(data => {
            if (data?.error) {
                console.error(data.error);
                return [];
            }
            return data;
        })
        .then(data => this.teams = data)
        .catch(err => console.error((err as TypeError).message));

        if (this.teams?.length) {
            console.log(`Found ${this.teams.length} teams.`);
        } else {
            console.log('No teams found');
        }
        return this.teams;
    }

    /**
     * Fetch matches for a given team within the current year.
     * @param {Team} team - The {@link Team} object.
     * @returns {Promise<void>} A promise that resolves when matches are fetched.
     * @private
     */
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

    /**
     * Get all matches for a given team.
     * @param {Team} team - The {@link Team} object.
     * @returns {Promise<Match[]>} A promise that resolves to an array of {@link Match} objects.
     */
    async getAllMatches(team: Team): Promise<Match[]> {
        if (this.matches[team.id]?.length > 0) {
            return this.matches[team.id];
        } else {
            await this.fetchMatches(team);
            return this.matches[team.id];
        }
    }
}
