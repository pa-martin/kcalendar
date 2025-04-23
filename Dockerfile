# Utiliser une image de base avec Node.js
FROM node:18-alpine

# Définir le répertoire de travail
WORKDIR /app

# Installer TypeScript globalement
RUN npm install -g typescript

# Copier les fichiers package.json et package-lock.json (si disponible)
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste de l'application
COPY . .

ARG PANDASCORE_TOKEN
ARG FTP_HOST
ENV FTP_PORT=21
ARG FTP_USER
ARG FTP_PASS
ENV FTP_ICAL_PATH=ical/karmine.ics
ENV FTP_JSON_KC_PATH=json/karmine.json
ENV FTP_JSON_POOLS_PATH=json/pools.json
ENV TEAM_NAME=Karmine
ENV CITY_NAME=Nantes

# Compiler les fichiers TypeScript
RUN npx tsc

# Définir la commande par défaut pour exécuter le script
CMD ["node", "dist/main.js"]
