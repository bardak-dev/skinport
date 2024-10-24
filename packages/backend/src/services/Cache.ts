import {Injectable} from '@nestjs/common';
import type {Redis as RedisType} from 'ioredis';
import {Redis} from 'ioredis';
import {InjectRedisClient} from 'nestjs-ioredis-tags';

@Injectable()
export class CacheService {
  // this is for sending only 1 req no matter how many Node.js processes and pods we have
  constructor(
    @InjectRedisClient('skinport.com') private readonly client: RedisType
  ) {
  }

  private getRedisInstance() {
    return new Redis(this.client.options);
  }

  private async get(key: string): Promise<any | null> {
    const data = await this.client.get(key);
    if(data) {
      return JSON.parse(data);
    }
    return null;
  }

  private async set(key: string, data: any, seconds: number): Promise<void> {
    await this.client.set(key, JSON.stringify(data), 'EX', seconds);
  }

  private async acquireLock(resourceKey: string): Promise<boolean> {
    const lockKey = `lock:${resourceKey}`;
    const lockValue = Date.now() + 5_000;
    const acquired = await this.client.set(lockKey, lockValue, 'EX', 5 * 60, 'NX');
    return acquired === 'OK';
  }

  private async releaseLock(resourceKey: string) {
    const lockKey = `lock:${resourceKey}`;
    await this.client.del(lockKey);
  }

  private async subscribeToChannel(channelName: string | Buffer) {
    const redisSub = this.getRedisInstance();
    redisSub.subscribe(channelName, () => {
    });
    return await new Promise((resolve) => {
      redisSub.on('message', (channel, message) => {
        resolve(JSON.parse(message));
        redisSub.unsubscribe();
        redisSub.quit();
      });
    });
  }

  private publishToChannel(channelName, data) {
    const pub = this.getRedisInstance();
    pub.publish(channelName, JSON.stringify(data));
    pub.quit();
  }

  async process(redisKey: string, asyncTask: () => Promise<(any | any[])>, seconds = 5 * 60): Promise<any> {
    const redisValue = await this.get(redisKey);
    if(!redisValue) {
      const channelName = `notif:${redisKey}`;
      const isLockedAcquired = await this.acquireLock(redisKey);
      if(!isLockedAcquired) {
        return await this.subscribeToChannel(channelName);
      } else {
        try {
          console.log('d');
          const data = await asyncTask();
          console.log('dt', typeof data);
          await this.set(redisKey, data, seconds);
          await this.releaseLock(redisKey);
          this.publishToChannel(channelName, data);
          return data;
        } catch(err) {
          await this.releaseLock(redisKey);
        } finally {
          await this.releaseLock(redisKey);
        }
      }
    } else {
      return await redisValue;
    }
  }
}