FROM node:18.12.1-alpine as builder

WORKDIR /app

COPY app.js package.json package-lock.json ./
COPY public/ ./public

RUN npm install -g nodemon
RUN npm install

ENV PORT=5000

EXPOSE ${PORT}

CMD npm start