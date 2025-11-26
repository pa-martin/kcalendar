# Accéder aux calendriers

Karmine Corp : https://pa-martin.github.io/kcalendar/ical/karmine.ics
Gentle Mates : https://pa-martin.github.io/kcalendar/ical/mates.ics
Vitality : https://pa-martin.github.io/kcalendar/ical/vitality.ics
Solary : https://pa-martin.github.io/kcalendar/ical/solary.ics

# Build and run

## Environment

Create a `.env` file with the following content and fill in the values.

```dotenv
PANDASCORE_TOKEN=<token>

ICAL_PATH=ical/<as-you-want>.ics

TEAM_NAME=<team_name>
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
