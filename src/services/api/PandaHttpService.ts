import dotenv from 'dotenv';
import log4js from 'log4js';

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
    private readonly logger = log4js.getLogger(PandaHttpService.name);

    constructor() {
        this.logger.level = process.env.LOG_LEVEL || 'info';
    }

    /**
     * Get teams by name.
     * @param {string} teamName - The name of the team to search for.
     * @returns {Promise<Team[]>} A promise that resolves to an array of {@link Team} objects.
     */
    async getTeams(teamName: string): Promise<Team[]> {
        await fetch(`${BASE_URL}/teams?search[name]=${teamName}`, options)
        .then(async response => {
            this.logger.trace(await response.clone().text());
            return response.json();
        })
        .then(data => {
            if (data?.error) {
                this.logger.warn(data.error);
                return [];
            }
            return data;
        })
        .then(data => this.teams = data)
        .catch((err: Error) => {
            this.logger.trace(err);
            this.logger.warn(`[${err.name}] ${err.message}`);
        });

        if (this.teams?.length) {
            this.logger.info(`Found ${this.teams.length} teams.`);
        } else {
            this.logger.info('No teams found');
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
        .then(async response => {
            this.logger.trace(await response.clone().text());
            return response.json();
        })
        .then(data => {
            if (data?.error) {
                this.logger.warn(data.error);
                return [];
            }
            return data;
        })
        .then(data => this.matches[team.id] = data)
        .catch((err: Error) => {
            this.logger.trace(err);
            this.logger.warn(`[${err.name}] ${err.message}`);
        });

        if (this.matches[team.id]?.length) {
            this.logger.info(`Found ${this.matches[team.id]?.length} matches for team ${team.slug}.`);
        } else {
            this.logger.info(`No matches found for team ${team.slug}`);
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
