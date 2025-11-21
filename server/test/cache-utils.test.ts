import { describe, expect, it } from "vitest";
import { deserializeCacheValue, serializeCacheValue } from "@/utils/cache.js";

const roundTrip = (value: unknown) =>
  deserializeCacheValue(JSON.parse(JSON.stringify(serializeCacheValue(value))));

describe("cache utils", () => {
  it("round-trips Set instances", () => {
    const source = new Set(["a", "b"]);
    const restored = roundTrip(source);
    expect(restored).toBeInstanceOf(Set);
    expect(Array.from(restored as Set<unknown>)).toEqual(["a", "b"]);
  });

  it("round-trips Map instances", () => {
    const source = new Map<string, string | number>([
      ["key", "value"],
      ["id", 42],
    ]);
    const restored = roundTrip(source);
    expect(restored).toBeInstanceOf(Map);
    expect(Array.from((restored as Map<unknown, unknown>).entries())).toEqual([
      ["key", "value"],
      ["id", 42],
    ]);
  });

  it("leaves plain objects untouched", () => {
    const source = { id: "user-1", roles: ["reporting:read"] };
    const restored = roundTrip(source);
    expect(restored).toEqual(source);
  });
});
