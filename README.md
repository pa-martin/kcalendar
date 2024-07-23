# Build and run
## Environment
Create a `.env` file with the following content and fill in the values.
```dotenv
PANDASCORE_TOKEN=<token>

FTP_HOST=<host>
FTP_PORT=21
FTP_USER=<username>
FTP_PASS=<password>
FTP_PATH=ical/<as-you-want>.ics

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
