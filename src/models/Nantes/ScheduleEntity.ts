export default class ScheduleEntity {
    id_lieu: string;
    id_obj: number;
    nom_complet: string;
    nom: string;
    type: string;
    jour: string;
    datedebut: string; // YYYY-MM-DD
    datefin: string;
    heuredebut: string; // HH:MM
    heurefin: string;
    wgs_x: number;
    wgs_y: number;

    constructor(schedule: ScheduleEntity) {
        this.id_lieu = schedule.id_lieu;
        this.id_obj = schedule.id_obj;
        this.nom_complet = schedule.nom_complet;
        this.nom = schedule.nom;
        this.type = schedule.type;
        this.jour = schedule.jour;
        this.datedebut = schedule.datedebut;
        this.datefin = schedule.datefin;
        this.heuredebut = schedule.heuredebut;
        this.heurefin = schedule.heurefin;
        this.wgs_x = schedule.wgs_x;
        this.wgs_y = schedule.wgs_y;
    }
}