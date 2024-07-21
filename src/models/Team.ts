import VideoGame from './VideoGame';
import Player from './Player';

export default class Team {
    acronym: string;
    id: number;
    location: string;
    modified_at: string;
    name: string;
    slug: string;
    image_url: string;
    current_videogame?: VideoGame;
    players?: Player[];
}
