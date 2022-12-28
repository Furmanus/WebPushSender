const express = require('express');
const http = require('http');
const cookieParser = require('cookie-parser')
const uuid = require('uuid');
const app = express();
const fs = require('node:fs');
const path = require('node:path');
const webpush = require('web-push');
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server);
const UUID_COOKIE = 'pushUuid';

const PORT = 6363;

let publicKey = 'BM38ulVqPJNVKDkjBt8I2day56bbEQIR804ofwSDuYNJeAEw8YDneTGLjRcw3IFGow3TnVWQoo5B6m1NM9wcdNE';
let privateKey = 'OcMJY5ZfwlDUtlgqwupB4yFRBqAEzzBQfThgcjiVnUQ';

app.use(cookieParser());
app.use((req, res, next) => {
  if (req.url === '/' && !req.cookies[UUID_COOKIE]) {
    res.cookie(UUID_COOKIE, uuid.v4(), {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    })
  }

  next();
});
app.use(express.static('public'));
app.use(express.json());

webpush.setVapidDetails('mailto:mietek76@gmail.com', publicKey, privateKey);

app.post('/send', async (req, res) => {
  const { notificationData } = req.body;
  const { payload = 'test', title = 'hello', actions, image, icon } = notificationData;

  let requestDetails;

  try {
    requestDetails = webpush.generateRequestDetails(req.body.sub, 'test');

    const pushRes = await webpush.sendNotification({
      ...req.body.sub,
    }, JSON.stringify({
      title,
      options: {
        body: payload,
        actions,
        image,
        icon,
      },
    }));

    res.set('Content-Type', 'application/json').status(201).send({
      request: requestDetails,
      response: pushRes,
      error: null,
    });
  } catch (e) {
    console.log(e);
    res.set('Content-Type', 'application/json').status(403).send({
      request: requestDetails,
      response: null,
      error: e,
    });
  }
});

app.get('/vapidKey', (req, res) => {
  res.set('Content-Type', 'text/plain').status(200).send(publicKey);
});

app.put('/regenerateVapid', (req, res) => {
  try {
    regenerateVapidKeys(req.body?.privateKey, req.body?.publicKey);

    res.sendStatus(202);
  } catch (e) {
    res.status(400).end(String(e));
  }
});

io.on('connection', socket => {
  io.emit('vapidChange', { privateKey, publicKey });
});

function regenerateVapidKeys(newPrvK, newPbK) {
  const { privateKey: newPrivateKey, publicKey: newPublicKey } = webpush.generateVAPIDKeys();
  const tempPrivKey = newPrvK ?? newPrivateKey;
  const tempPubKey = newPbK ?? newPublicKey;

  try {
    webpush.setVapidDetails('mailto:mietek76@gmail.com', tempPubKey, tempPrivKey);

    privateKey = tempPrivKey;
    publicKey = tempPubKey;

    io.emit('vapidChange', { privateKey, publicKey });
  } catch (e) {
    throw e;
  }
}

server.listen(PORT, () => {
  console.log(`Application is listening on port ${PORT}`);
});

process.on('uncaughtException', e => {
  console.error('unhandled exception', e);
});

process.on('unhandledRejection', e => {
  console.error('unhandled rejection', e);
});
