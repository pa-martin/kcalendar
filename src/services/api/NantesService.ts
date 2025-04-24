import Pool from "../../models/Nantes/Pool";
import ScheduleEntity from "../../models/Nantes/ScheduleEntity";
import ApiReturn from "../../models/Nantes/ApiReturn";
import Schedule from "../../models/Nantes/Schedule";

const BASE_URL = 'https://data.nantesmetropole.fr';
const POOLS_URL = '/api/explore/v2.1/catalog/datasets/244400404_piscines-nantes-metropole/records'
const SCHEDULE_URL = '/api/explore/v2.1/catalog/datasets/244400404_horaires-equipements-publics-nantes-metropole/records'
const options = {
     method: 'GET',
     headers: {
         accept: 'application/json',
     }
 };

const currentDate = new Date();

export class NantesService {
     private pools: Pool[] = [];
     private schedules: Record<number, Schedule> = {};

     async fetchPools(city: string): Promise<Pool[]> {
            if (this.pools.length > 0) return this.pools;

            const query = `where=commune="${city}"`
            const response = await fetch(`${BASE_URL}${POOLS_URL}?${query}`, options);
            const data: ApiReturn<Pool> = await response.json();
            this.pools = data.results.map((pool: Pool) => new Pool(pool));

            console.log(`Found ${this.pools.length} pools in ${city}`);
            return this.pools;
     }

    async fetchSchedules(pool: Pool): Promise<Schedule> {
        if (this.schedules[pool.idobj]) return this.schedules[pool.idobj];

        const query = `where=type="Piscine"\
            and datefin>date'${currentDate.toISOString()}'\
            and jour="${currentDate.toLocaleString('fr-FR', { weekday: 'long' })}"\
            and nom="${pool.nom_usuel}"`
        const response = await fetch(`${BASE_URL}${SCHEDULE_URL}?${query}`, options);
        const data: ApiReturn<ScheduleEntity> = await response.json();
        const schedules = data.results.map((schedule: ScheduleEntity) => new ScheduleEntity(schedule));

        if (schedules.length === 0) {
            console.log(`No schedules found for pool ${pool.nom_usuel}`);
            return null;
        }

        schedules.sort((a, b) => {
            const startA = new Date(`1970-01-01T${a.heuredebut}:00`);
            const startB = new Date(`1970-01-01T${b.heuredebut}:00`);
            return startA.getTime() - startB.getTime();
        });
        const is_open = schedules.some((schedule: ScheduleEntity) => {
            return currentDate.getHours() >= parseInt(schedule.heuredebut.split(':')[0]) &&
                currentDate.getHours() < parseInt(schedule.heurefin.split(':')[0]) ||
                (currentDate.getHours() === parseInt(schedule.heurefin.split(':')[0]) &&
                    currentDate.getMinutes() < parseInt(schedule.heurefin.split(':')[1]));
        })

        this.schedules[pool.idobj] = {
            nom_complet: schedules[0].nom_complet,
            nom: schedules[0].nom,
            jour: schedules[0].jour,
            // state open if current time is between start and end time
            state: is_open ? 'open' : 'closed',
            schedule: schedules.map((schedule: ScheduleEntity) =>
                schedule.heuredebut + '-' + schedule.heurefin).join(' | '),
            schedules: schedules.map((schedule: ScheduleEntity) => ({
                heuredebut: schedule.heuredebut,
                heurefin: schedule.heurefin,
            })),
            lat: schedules[0].wgs_y,
            long: schedules[0].wgs_x
        }

        console.log(`Found ${this.schedules[pool.idobj].schedules.length} schedules for pool ${pool.nom_usuel}`);
        return this.schedules[pool.idobj];
    }
 }
