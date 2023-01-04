import { Router } from 'express';
import { UUID_COOKIE } from '../constants.js';
import { redisService } from '../services/redis.service.js';
import webpush from 'web-push';

const webPushRouter = new Router();

webPushRouter.post('/send', postSendPushRouteHandler);

export { webPushRouter };

async function postSendPushRouteHandler(req, res) {
  const { notificationData, sub } = req.body;
  const pushUuid = req.cookies[UUID_COOKIE];
  const { payload = 'test', title = 'hello', actions, image, icon } = notificationData;
  const parsedNotificationPayload = JSON.stringify({
    title,
    options: {
      body: payload,
      actions,
      image,
      icon,
    },
  });

  let requestDetails = null;

  try {
    if (!pushUuid) {
      throw new Error('Lack of uuid cookie');
    }
    const { privateKey, publicKey } = await redisService.getVapids(pushUuid);

    webpush.setVapidDetails('mailto:testtestedgdsgsfd@wp.pl', publicKey, privateKey); // TODO add email in form and paste it here

    requestDetails = webpush.generateRequestDetails(req.body.sub, parsedNotificationPayload);

    const pushRes = await webpush.sendNotification(sub, parsedNotificationPayload);

    res.status(201).json({
      request: requestDetails,
      response: pushRes,
      error: null,
    });
  } catch (e) {
    console.error('Error while trying to send push notification:', e);
    res.status(403).json({
      request: requestDetails,
      response: null,
      error: e,
    });
  }
}