import { redisClient } from "../data/db/redis.js";
import log from "../utils/logger.js";

export function Cache<T extends unknown[]>(
  keyBuilder: (...args: T) => string,
  ttlSeconds: number = 3600,
): MethodDecorator {
  const isTestEnv = process.env.VITEST || process.env.NODE_ENV === "test";

  return (
    _target,
    propertyKey,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor => {
    const original = descriptor.value as (...args: T) => Promise<unknown>;

    descriptor.value = async function (...args: T) {
      if (isTestEnv) {
        return await original.apply(this, args);
      }

      const key = keyBuilder(...args);
      const cached = await redisClient.GET(key);
      if (cached) {
        log.debug(`[Cache HIT] ${String(propertyKey)} -> ${key}`);
        return JSON.parse(cached);
      }

      log.debug(`[Cache MISS] ${String(propertyKey)} -> ${key}`);
      const result = await original.apply(this, args);

      await redisClient.SET(key, JSON.stringify(result));
      await redisClient.EXPIRE(key, ttlSeconds);

      return result;
    };
    return descriptor;
  };
}
