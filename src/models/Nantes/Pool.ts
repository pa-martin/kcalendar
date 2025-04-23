export default class Pool {
    idobj: number;
    nom_usuel: string;
    nom_complet: string;
    adresse: string;
    commune: string;
    location: {
        lon: number;
        lat: number;
    }

    constructor(pool: Pool) {
        this.idobj = pool.idobj;
        this.nom_usuel = pool.nom_usuel;
        this.nom_complet = pool.nom_complet;
        this.adresse = pool.adresse;
        this.commune = pool.commune;
        this.location = {
            lon: pool.location.lon,
            lat: pool.location.lat
        };
    }
}