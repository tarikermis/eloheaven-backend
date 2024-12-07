import Logger from '@core/Logger';
import { createClient } from 'redis';
import { redisUrl } from './config';

const redisClient = createClient({
  url: redisUrl === 'docker' ? 'redis://redis:6379' : 'redis://127.0.0.1:6379',
});

(async () => {
  redisClient.on('error', (err) => console.log('Redis Client Error', err));

  redisClient.connect();

  Logger.info(`✅ Redis client created!`);
})();

export default redisClient;
