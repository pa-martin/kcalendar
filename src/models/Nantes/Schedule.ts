export default class Schedule {
    nom_complet: string;
    nom: string;
    jour: string;
    schedule: string;
    state: string;
    schedules: {
        heuredebut: string; // HH:MM
        heurefin: string;
    }[];
    lat: number;
    long: number;
}