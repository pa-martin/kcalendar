import * as ics from 'ics';
import dotenv from 'dotenv';
import fs from 'fs-extra';

import Event from '../models/Panda/Event';
import Match from '../models/Panda/Match';
import NextMatch from '../models/Panda/NextMatch';
import Team from '../models/Panda/Team';

dotenv.config();

export class FileService {
    createIcsEvent(match: Match): Event {
        return {
            uid: `${match.id}@pa-martin.github.io`,
            sequence: 0,
            created: Date.now(),
            lastModified: Date.now(),
            start: Date.parse(match.scheduled_at ?? match.begin_at),
            end: match.end_at
                ? Date.parse(match.end_at)
                : Date.parse(match.scheduled_at) + 3600000 * match.number_of_games,
            title: match.status === 'finished'
                ? `[${match.league.name}] ${match.name.replace('vs', match.results.map(r => r.score).join(' - '))}`
                : `[${match.league.name}] ${match.name}`,
            location: match.streams_list[0]?.raw_url || '',
        };
    }

    createNextMatch(match: Match, team: Team): NextMatch {
        return {
            league_name: match?.league.name ?? '',
            video_game_name: match?.videogame.name ?? team.current_videogame.name,
            team_name: team.name,
            team_slug: team.slug,
            team_acronym: team.acronym,
            opponent_name: match?.opponents
                    .find(opponent => opponent.opponent.id !== team.id)?.opponent.name
                ?? '',
            start: Date.parse(match?.scheduled_at ?? match?.begin_at),
            end: Date.parse(match?.scheduled_at) + 3600000 * match?.number_of_games,
            match_name: match?.name ?? 'No more matches',
        }
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
}
