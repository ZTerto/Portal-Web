# Etapa de desarrollo
FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
EXPOSE ${FRONTEND_PORT}
CMD ["npm", "run", "dev", "--", "--host", "--port", "${FRONTEND_PORT}"]
