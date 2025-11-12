import { describe, expect, it } from "vitest";
import { AsyncLock } from "./AsyncLock";

const nextTick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

describe("AsyncLock", () => {
  it("blocks subsequent acquire calls until release", async () => {
    const lock = new AsyncLock();

    const release = await lock.acquire();

    let secondAcquired = false;
    const secondTask = (async () => {
      const releaseSecond = await lock.acquire();
      secondAcquired = true;
      releaseSecond();
    })();

    await nextTick();
    expect(secondAcquired).toBe(false);
    release();

    await secondTask;
    expect(secondAcquired).toBe(true);
  });

  it("ensures queued tasks run sequentially", async () => {
    const lock = new AsyncLock();
    const order: string[] = [];

    const runTask = (label: string, delay: number) =>
      (async () => {
        const release = await lock.acquire();
        order.push(`${label}-start`);
        try {
          // Wait helps ensure other tasks queue while this task holds the lock.
          await wait(delay);
          order.push(`${label}-end`);
        } finally {
          release();
        }
      })();

    await Promise.all([runTask("task-1", 5), runTask("task-2", 0), runTask("task-3", 0)]);

    expect(order).toEqual(["task-1-start", "task-1-end", "task-2-start", "task-2-end", "task-3-start", "task-3-end"]);
  });

  it("ensures no 2 acquire calls overlap", async () => {
    const lock = new AsyncLock();
    let activeCount = 0;
    const order: string[] = [];

    const runTask = (label: string, delay: number) =>
      (async () => {
        const release = await lock.acquire();
        activeCount++;
        order.push(`${label}-start`);
        try {
          expect(activeCount).toBe(1); // Ensure only one task is active
          await wait(delay);
          order.push(`${label}-end`);
        } finally {
          activeCount--;
          release();
        }
      })();

    await Promise.all([runTask("task-1", 5), runTask("task-2", 0), runTask("task-3", 0)]);

    expect(order).toEqual(["task-1-start", "task-1-end", "task-2-start", "task-2-end", "task-3-start", "task-3-end"]);
  });
});
