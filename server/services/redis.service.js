import Redis from 'ioredis';

const EXPIRATION_TIME = 1000 * 60 * 15;

class RedisService {
    #redisConnection = new Redis({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        username: process.env.REDIS_USER ?? 'default',
        db: process.env.REDIS_DB ?? 0,
    });

    saveVapids(uuid, vapidObj) {
        return this.#saveVapidsToRedis(uuid, vapidObj);
    }

    async getVapids(uuid) {
        const data = await this.#redisConnection.get(this.#prepareRedisKey(uuid));

        return JSON.parse(data);
    }

    async #saveVapidsToRedis(uuid, vapidObj) {
        const { privateKey, publicKey } = vapidObj;

        if (!privateKey || !publicKey) {
            throw new Error('Lack of required key');
        }

        const redisKey = this.#prepareRedisKey(uuid);

        await this.#redisConnection.set(redisKey, JSON.stringify({
            privateKey,
            publicKey,
        }));
        return this.#redisConnection.expire(redisKey, EXPIRATION_TIME);
    }

    #prepareRedisKey(uuid) {
        return `vapidKey:${uuid}`;
    }
}

export const redisService = new RedisService();