// Injectable clock. Engines take `now` as an argument; screens read it from a Clock.

export interface Clock {
  /** Milliseconds since the Unix epoch. */
  now(): number;
}

export const systemClock: Clock = { now: () => Date.now() };

export interface FakeClock extends Clock {
  advance(ms: number): void;
  set(ms: number): void;
}

export function createFakeClock(start = 0): FakeClock {
  let t = start;
  return {
    now: () => t,
    advance: (ms) => {
      t += ms;
    },
    set: (ms) => {
      t = ms;
    },
  };
}
