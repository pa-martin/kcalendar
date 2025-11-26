import * as ics from 'ics';
import fs from 'fs-extra';

import Event from '../models/Panda/Event';
import Match from '../models/Panda/Match';
import VideoGame from '../models/Panda/VideoGame';

/**
 * A service for handling file operations, including generating ICS files from match data.
 */
export class FileService {

    /**
     * Create an ICS event from a Match object.
     * @param match - The {@link Match} object to convert.
     * @returns The ICS {@link Event} object.
     */
    createIcsEvent = (match: Match): Event => {
        return {
            uid: `${match.id}@pa-martin.github.io`,
            sequence: 0,
            created: Date.now(),
            lastModified: Date.now(),
            start: Date.parse(match.scheduled_at ?? match.begin_at),
            end: match.end_at
                ? Date.parse(match.end_at)
                : Date.parse(match.scheduled_at) + this.getGameLength(match.videogame) * match.number_of_games,
            title: match.status === 'finished'
                ? `[${match.league.name}] ${match.name.replace('vs', match.results.map(r => r.score).join(' - '))}`
                : `[${match.league.name}] ${match.name}`,
            location: match.streams_list[0]?.raw_url || '',
        };
    };

    /**
     * Generate an ICS file from a list of events and save it to the specified path.
     * @param {Event[]} events - The list of {@link Event} objects to include in the ICS file.
     * @param {string} teamName - The name of the team for calendar metadata.
     @param {string} path - The file path where the ICS file will be saved.
     * @returns {Promise<string | Error>} A promise that resolves to the file path if successful, or an Error if failed.
     */
    async generateIcsFile(events: Event[], teamName: string, path: string): Promise<string | Error> {
        const result = ics.createEvents(events);
        if (result.error) {
            return result.error;
        }
        const calendarSettings = [
            `PRODID:pa-martin.github.io/kcalendar/ical/${path}`,
            `NAME:${teamName}`,
            `X-WR-CALNAME:${teamName}`,
            `X-WR-CALDESC:Calendar with all matches of ${teamName}`,
            'TIMEZONE-ID:UTC',
            'X-WR-TIMEZONE:UTC',
        ];
        const value = result.value.replace('PRODID:adamgibbons/ics', calendarSettings.join('\n'));
        this.writeFile(path, value).then(() => {
            console.log('ICS file created');
            return value;
        }).catch(e => console.error(e));
    }

    /**
     * Write data to a file at the specified path.
     * @param {string} path - The file path where the data will be written.
     * @param {string} data - The data to write to the file.
     * @returns {Promise<string>} A promise that resolves to a success message when the file is created.
     */
    async writeFile(path: string, data: string): Promise<string> {
        if (path.includes('/'))
            await fs.ensureDir(path.split('/').slice(0, -1).join('/'));
        await fs.writeFile(path, data, 'utf8');
        return `${path} file created`;
    }

    /**
     * Get the typical length of a game based on its video game ID.
     * @param {VideoGame} game - The {@link VideoGame} object.
     * @returns {number} The length of the game in milliseconds.
     * @private
     */
    private getGameLength(game: VideoGame): number {
        switch (game?.id) {
            case 1:
                return 60 * 60 * 1000; // League of Legends - 1 hour
            case 3:
                return 50 * 60 * 1000; // CS:GO - 50 minutes
            case 22:
                return 10 * 60 * 1000; // Rocket League - 10 minutes
            case 23:
                return 30 * 60 * 1000; // Call of Duty - 30 minutes
            case 26:
                return 50 * 60 * 1000; // Valorant - 50 minutes
            default:
                return 60 * 60 * 1000; // Default - 1 hour
        }
    }

}
