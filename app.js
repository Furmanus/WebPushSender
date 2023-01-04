import 'dotenv/config.js';
import express from 'express';
import http from 'node:http';
import cookieParser from 'cookie-parser';
import { v4 as uuidV4 } from 'uuid';
import { webPushRouter } from './server/routing/webpush.router.js';
import { vapidRouter } from './server/routing/vapid.router.js';
import { UUID_COOKIE } from './server/constants.js';

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT;

app.use(cookieParser());
app.use((req, res, next) => {
  if (req.url === '/' && !req.cookies[UUID_COOKIE]) {
    res.cookie(UUID_COOKIE, uuidV4(), {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    })
  }

  next();
});
app.use(express.static('public'));
app.use(express.json());

app.use(webPushRouter);
app.use(vapidRouter);

server.listen(PORT, () => {
  console.log(`Application is listening on port ${PORT}`);
});

process.on('uncaughtException', e => {
  console.error('Unhandled exception', e);
});

process.on('unhandledRejection', e => {
  console.error('Unhandled rejection', e);
});
