import { getRedisClientInstance } from "@/data/db/redis.js";
import log from "@/utils/logger.js";

const CACHE_TYPE_KEY = "__cacheType" as const;
const CACHE_SET_MARKER = "set" as const;
const CACHE_MAP_MARKER = "map" as const;

type CacheOptions = {
  /**
   * Optional transformer that runs whenever a cached value is read or written.
   * Useful when the underlying method returns complex types (e.g. classes or
   * Dates) that need custom serialization/deserialization beyond what our
   * Set/Map helpers provide. This lets callers supply the logic to turn the
   * plain JSON payload back into whatever shape the consumer expects.
   */
  hydrate?: (value: unknown) => unknown;
};

/**
 * Converts JavaScript objects (including Sets and Maps) into plain JSON-friendly
 * structures so they can be stored in Redis. Marker keys let us restore the
 * correct instance type on reads.
 */
function serializeCacheValue(value: unknown): unknown {
  if (value instanceof Set) {
    return {
      [CACHE_TYPE_KEY]: CACHE_SET_MARKER,
      values: Array.from(value),
    };
  }

  if (value instanceof Map) {
    return {
      [CACHE_TYPE_KEY]: CACHE_MAP_MARKER,
      entries: Array.from(value.entries()),
    };
  }

  return value;
}

/**
 * Recreates Sets or Maps that were previously serialized via serializeCacheValue.
 * Non-tagged payloads are returned as-is so regular primitives/objects still work.
 */
function deserializeCacheValue(value: unknown): unknown {
  if (!value || typeof value !== "object") {
    return value;
  }

  const payload = value as Record<string, unknown>;
  if (!(CACHE_TYPE_KEY in payload)) {
    return value;
  }

  const marker = payload[CACHE_TYPE_KEY];
  if (marker === CACHE_SET_MARKER) {
    const values = Array.isArray(payload.values) ? payload.values : [];
    return new Set(values);
  }

  if (marker === CACHE_MAP_MARKER) {
    const entries = Array.isArray(payload.entries)
      ? payload.entries
      : ([] as unknown[]);
    const normalized = entries.map((entry) =>
      Array.isArray(entry) && entry.length === 2 ? entry : [undefined, entry],
    );
    return new Map(normalized as [unknown, unknown][]);
  }

  return value;
}

export { serializeCacheValue, deserializeCacheValue };

export function Cache<T extends unknown[]>(
  keyBuilder: (...args: T) => string,
  ttlSeconds: number = 3600,
  options?: CacheOptions,
): MethodDecorator {
  const isTestEnv = process.env.VITEST || process.env.NODE_ENV === "test";
  // hydrate runs on both cache hits (to rebuild shapes) and misses (to prep data before storing)
  const hydrate = options?.hydrate ?? ((value: unknown) => value);

  return (
    _target,
    _propertyKey,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor => {
    if (!descriptor || typeof descriptor.value !== "function") {
      return descriptor;
    }

    const original = descriptor.value as (...args: T) => Promise<unknown>;

    descriptor.value = async function (...args: T) {
      if (isTestEnv) {
        return await original.apply(this, args);
      }

      const key = keyBuilder(...args);
      const cached = await getRedisClientInstance().GET(key);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed != null) {
            log.debug(`[Cache HIT] ${String(_propertyKey)} -> ${key}`);
            return hydrate(deserializeCacheValue(parsed));
          }
        } catch (_e) {
          // invalid json, treat as miss
        }
      }

      log.debug(`[Cache MISS] ${String(_propertyKey)} -> ${key}`);
      const result = hydrate(await original.apply(this, args));

      if (result != null) {
        const cachePayload = serializeCacheValue(result);
        await getRedisClientInstance().SET(key, JSON.stringify(cachePayload));
        if (ttlSeconds > 0) {
          await getRedisClientInstance().EXPIRE(key, ttlSeconds);
        }
      }

      return result;
    };
    return descriptor;
  };
}
