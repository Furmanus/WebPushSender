import { Router } from 'express';
import { UUID_COOKIE } from '../constants.js';
import { redisService } from '../services/redis.service.js';
import webpush from 'web-push';

const vapidRouter = new Router();

vapidRouter.get('/vapidKey', getVapidKeysRouteHandler);
vapidRouter.put('/regenerateVapid', putRegenerateVapidKeysRouterHandler);

export { vapidRouter };

async function getVapidKeysRouteHandler(req, res) {
    const pushUuid = req.cookies[UUID_COOKIE];
    const pushData = await redisService.getVapids(pushUuid);
    let privateKey;
    let publicKey;

    if (!pushData) {
        const { privateKey: newPrivateKey, publicKey: newPublicKey } = webpush.generateVAPIDKeys();

        privateKey = newPrivateKey;
        publicKey = newPublicKey;

        await redisService.saveVapids(pushUuid, { privateKey: newPrivateKey, publicKey: newPublicKey });
    } else {
        privateKey = pushData.privateKey;
        publicKey = pushData.publicKey;
    }

    res.status(200).json({
        publicKey,
        privateKey,
    });
}

async function putRegenerateVapidKeysRouterHandler(req, res) {
    const { privateKey, publicKey } = req.body;
    const pushUuid = req.cookies[UUID_COOKIE];

    try {
        if (!privateKey && publicKey || privateKey && !publicKey) {
            throw new Error('You need to provide both public and private key or provide none');
        }

        const { privateKey: newPrivateKey, publicKey: newPublicKey } = await regenerateVapidKeys(pushUuid, privateKey, publicKey);

        res.json({ privateKey: newPrivateKey, publicKey: newPublicKey });
    } catch (e) {
        console.error(e);
        res.status(400).end(String(e));
    }
}

async function regenerateVapidKeys(pushUuid, newPrvK, newPbK) {
    let publicKey = newPbK;
    let privateKey = newPrvK;
  
    if (!publicKey || !privateKey) {
      const { privateKey: newPrivateKey, publicKey: newPublicKey } = webpush.generateVAPIDKeys();
  
      publicKey = newPublicKey;
      privateKey = newPrivateKey;
    }
  
    await redisService.saveVapids(pushUuid, { privateKey, publicKey });
  
    return { privateKey, publicKey };
  }