export const styleCookie = "style";
export const styleCookieMaxAge = 60 * 60 * 24 * 365;

export interface StyleChoice {
  id: string;
  /** True when the id was just picked at random and should be saved for next time. */
  persist: boolean;
}

interface ResolveOptions {
  /** Enabled style ids, in menu order. Never empty. */
  ids: readonly string[];
  /** Style for new visitors, or "random". */
  fallback: string;
  /** False locks every visitor to `fallback`. */
  picker: boolean;
  /** The visitor's saved choice, if any. */
  saved?: string;
  random?: () => number;
}

/** Decides which style a request gets. Pure, so it is easy to test. */
export function resolveStyle({
  ids,
  fallback,
  picker,
  saved,
  random = Math.random,
}: ResolveOptions): StyleChoice {
  const pickRandom = () => ids[Math.floor(random() * ids.length)] ?? ids[0];
  const known = (id: string | undefined): id is string => id !== undefined && ids.includes(id);

  // A fixed style ignores saved choices; a random default still has to stick.
  if (!picker && fallback !== "random")
    return { id: known(fallback) ? fallback : ids[0], persist: false };
  if (known(saved)) return { id: saved, persist: false };
  if (fallback === "random") return { id: pickRandom(), persist: true };
  return { id: known(fallback) ? fallback : ids[0], persist: false };
}

/** A different style from the current one, for the menu's Random item. */
export function randomOther(ids: readonly string[], current: string, random = Math.random): string {
  const others = ids.filter((id) => id !== current);
  return others[Math.floor(random() * others.length)] ?? current;
}
