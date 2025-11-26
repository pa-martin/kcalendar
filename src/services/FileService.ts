import * as ics from 'ics';
import dotenv from 'dotenv';
import fs from 'fs-extra';

import Event from '../models/Panda/Event';
import Match from '../models/Panda/Match';
import VideoGame from "../models/Panda/VideoGame";

dotenv.config();

export class FileService {
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
    }

    async generateIcsFile(events: Event[], path: string): Promise<string | Error> {
        const result = ics.createEvents(events);
        if (result.error) {
            return result.error;
        }
        const calendarSettings = [
            'PRODID:pa-martin.github.io/kcalendar/ical/karmine.ics',
            'NAME:KCORP',
            'X-WR-CALNAME:KCORP',
            'X-WR-CALDESC:Calendar with all matches of KCorp',
            'TIMEZONE-ID:UTC',
            'X-WR-TIMEZONE:UTC',
        ];
        const value = result.value.replace('PRODID:adamgibbons/ics', calendarSettings.join('\n'));
        this.writeFile(path, value).then(() => {
            console.log('ICS file created');
            return value;
        }).catch(e => console.error(e));
    }

    async writeFile(path: string, data: string): Promise<string> {
        await fs.ensureDir(path.split('/').slice(0, -1).join('/'));
        await fs.writeFile(path, data, 'utf8');
        return `${path} file created`;
    }

    private getGameLength(game: VideoGame): number {
        switch (game?.id) {
            case 1:
                return 60 * 60 * 1000; // League of Legends - 1 hour
            case 3:
                return 50 * 60 * 1000; // CS:GO - 50 minute
            case 22:
                return 10 * 60 * 1000; // Rocket League - 10 minutes
            case 23:
                return 30 * 60 * 1000; // Call of Duty - 30 minutes
            case 26:
                return 50 * 60 * 1000; // Valorant - 50 minutes
            default:
                return 10 * 60 * 1000; // Default - 1 hour
        }
    }

}
