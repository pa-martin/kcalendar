# Build and run
## Environment
Create a `.env` file with the following content and fill in the values.
```dotenv
PANDASCORE_TOKEN=<token>

FTP_HOST=<host>
FTP_PORT=21
FTP_USER=<username>
FTP_PASS=<password>
FTP_ICAL_PATH=ical/<as-you-want>.ics
FTP_JSON_KC_PATH=json/<as-you-want>.json
FTP_JSON_POOLS_PATH=json/<as-you-want>.json

TEAM_NAME=<team_name>
CITY_NAME=<city_name>
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
