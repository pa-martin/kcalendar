import fetch from 'node-fetch';
import ical from 'ical';
import fs from 'fs/promises';
import { Client } from 'basic-ftp';
import dotenv from 'dotenv';

// Charger les variables d'environnement depuis le fichier .env
dotenv.config();

// Configuration du serveur FTP depuis les variables d'environnement
const ftpConfig = {
    host: process.env.FTP_HOST,
    port: process.env.FTP_PORT || 21,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASS
};

// URLs des fichiers ical
const urls = [
    'https://zlypher.github.io/lol-events/cal/league-of-legends-lfl.ical',
    'https://zlypher.github.io/lol-events/cal/league-of-legends-lec.ical'
];

// Fonction pour formater les dates au format iCalendar
function formatICalDate(date) {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

// Fonction pour récupérer et filtrer les événements
async function fetchAndFilterEvents() {
    let filteredEvents = [];
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    for (const url of urls) {
        const response = await fetch(url);
        const icalData = await response.text();

        const events = ical.parseICS(icalData);
        for (let k in events) {
            if (events.hasOwnProperty(k)) {
                const event = events[k];
                if (event.type === 'VEVENT') {
                    if (event.summary.includes('KC') && new Date(event.start) >= sevenDaysAgo) {
                        if (event.summary.includes('KCB')) {
                            event.summary = '[LFL] ' + event.summary;
                        } else {
                            event.summary = '[LEC] ' + event.summary;
                        }
                        event.location = 'https://www.twitch.tv/otplol_';
                        filteredEvents.push(event);
                    }
                }
            }
        }
    }

    // Générer un nouveau fichier ical avec les événements filtrés
    const newIcalData = generateICal(filteredEvents);
    const filePath = 'ical/filtered_events';
    await fs.writeFile(`${filePath}.ics`, newIcalData);
    await fs.writeFile(`${filePath}.ical`, newIcalData);

    // Télécharger le fichier sur le serveur FTP
    await uploadToFTP(filePath);
}

// Fonction pour générer un fichier ical à partir d'une liste d'événements
function generateICal(events) {
    let icalData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//PAM//KCORP Events//EN
NAME:KCORP
X-WR-CALNAME:KCORP
TIMEZONE-ID:UTC
X-WR-TIMEZONE:UTC
`;

    events.forEach(event => {
        icalData += `BEGIN:VEVENT
UID:${event.uid}
SEQUENCE:${event.sequence}
DTSTAMP:${formatICalDate(event.dtstamp)}
DTSTART:${formatICalDate(event.start)}
DTEND:${formatICalDate(event.end)}
SUMMARY:${event.summary}
END:VEVENT
`;
    });

    icalData += `X-WR-CALDESC:KCORP
END:VCALENDAR`;
    return icalData;
}

// Fonction pour télécharger un fichier sur le serveur FTP
async function uploadToFTP(filePath) {
    const client = new Client();
    try {
        await client.access(ftpConfig);
        await client.uploadFrom(`${filePath}.ics`, `/www/${filePath}.ics`);
        await client.uploadFrom(`${filePath}.ical`, `/www/${filePath}.ical`);
        console.log('File uploaded successfully');
    } catch (error) {
        console.error('Error uploading file:', error);
    } finally {
        client.close();
    }
}

fetchAndFilterEvents()
.then(() => console.log('Filtered events saved to filtered_events.ical'))
.catch(error => console.error('Error fetching and filtering events:', error));
