const WORDS_PER_MINUTE = 220;

/** Whole minutes to read a Markdown body, never less than one. */
export function readingMinutes(markdown: string): number {
  const words = markdown
    // Tags (embeds, inline HTML) are markup, not reading.
    .replace(/<\/?[a-zA-Z][^<>]*>/g, " ")
    .split(/\s+/)
    .filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
