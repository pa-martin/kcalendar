# Accéder aux calendriers

Karmine Corp : https://pa-martin.github.io/kcalendar/ical/karmine.ics<br>
Gentle Mates : https://pa-martin.github.io/kcalendar/ical/mates.ics<br>
Vitality : https://pa-martin.github.io/kcalendar/ical/vitality.ics<br>
Solary : https://pa-martin.github.io/kcalendar/ical/solary.ics

# Build and run

## Environment

Create a `.env` file with the following content and fill in the values.<br>
The token from pandascore can be find here : https://app.pandascore.co/dashboard/main

```dotenv
PANDASCORE_TOKEN=<token>

ICAL_PATH=ical/<as-you-want>.ics, folder/<as-you-want>.<extension>

TEAM_NAME=<team_name>, <team_name>
```

## Manually

```shell
npm install
npx tsc && node ./dist/main.js
```

## Docker

```shell
docker build -t kcalendar .
docker run --env-file .env kcalendar
```
