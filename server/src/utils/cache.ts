import { redisClient } from "../data/db/redis.js";
import log from "../utils/logger.js";

export function Cache<T extends unknown[]>(
  keyBuilder: (...args: T) => string,
  ttlSeconds: number = 3600,
): MethodDecorator {
  const isTestEnv = process.env.VITEST || process.env.NODE_ENV === "test";

  return (
    _target,
    _propertyKey,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor => {
    if (!descriptor || typeof descriptor.value !== 'function') {
      return descriptor;
    }

    const original = descriptor.value as (...args: T) => Promise<unknown>;

    descriptor.value = async function (...args: T) {
      if (isTestEnv) {
        return await original.apply(this, args);
      }

      const key = keyBuilder(...args);
      const cached = await redisClient.GET(key);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed != null) {
            log.debug(`[Cache HIT] ${String(_propertyKey)} -> ${key}`);
            return parsed;
          }
        } catch (_e) {
          // invalid json, treat as miss
        }
      }

      log.debug(`[Cache MISS] ${String(_propertyKey)} -> ${key}`);
      const result = await original.apply(this, args);

      if (result != null) {
        await redisClient.SET(key, JSON.stringify(result));
        if (ttlSeconds > 0) {
          await redisClient.EXPIRE(key, ttlSeconds);
        }
      }

      return result;
    };
    return descriptor;
  };
}
