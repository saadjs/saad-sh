import { describe, expect, it } from "vitest";
import { readingMinutes } from "#/lib/reading-time";

const words = (count: number) => Array.from({ length: count }, () => "word").join(" ");

describe("readingMinutes", () => {
  it("rounds to whole minutes at 220 words a minute", () => {
    expect(readingMinutes(words(440))).toBe(2);
    expect(readingMinutes(words(1000))).toBe(5);
  });

  it("never reports less than a minute", () => {
    expect(readingMinutes("")).toBe(1);
    expect(readingMinutes("Short note.")).toBe(1);
  });

  it("keeps prose that sits between a less-than and a greater-than sign", () => {
    expect(readingMinutes(`if a < b then ${words(440)} and so a -> c`)).toBe(2);
  });

  it("does not count markup or bare punctuation as words", () => {
    const body = `${words(220)} <post-demo name="${words(400)}"></post-demo> --- | ** ##`;
    expect(readingMinutes(body)).toBe(1);
  });
});
