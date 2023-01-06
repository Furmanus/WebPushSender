FROM node:18.12.1-alpine as builder

WORKDIR /app

COPY app.js package.json package-lock.json ./
COPY server/ ./server
COPY public/ ./public

RUN npm install

ENV PORT=5000

EXPOSE ${PORT}

CMD npm run start:prod