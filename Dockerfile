# Utiliser une image de base avec Node.js
FROM node:24-alpine

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
ENV ICAL_PATH=ical/karmine.ics
ENV TEAM_NAME=Karmine
ENV LOG_LEVEL=info

# Compiler les fichiers TypeScript
RUN npx tsc

# Définir la commande par défaut pour exécuter le script
CMD ["node", "dist/main.js"]
