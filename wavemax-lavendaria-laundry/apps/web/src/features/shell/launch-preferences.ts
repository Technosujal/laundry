import type { AppRole } from "../../app/auth/session-types";

/** How wide a tile is on a wide screen: a third, a half, or the full row. */
export type TileSize = "small" | "medium" | "large";

export const TILE_SIZES: readonly TileSize[] = ["small", "medium", "large"];

export function isTileSize(value: unknown): value is TileSize {
  return typeof value === "string" && TILE_SIZES.includes(value as TileSize);
}

/**
 * Per-viewer layout of the Command Center tiles.
 *
 * This is a display preference and nothing else: it changes the order tiles appear in and
 * whether one is on screen, never what a role is permitted to open. Access is decided from the
 * session every render, so a hidden tile is still hidden work, not granted work, and a stored
 * preference can never widen what somebody sees.
 *
 * It is held in the viewer's own browser because the platform has no per-user settings store.
 * That means it does not follow them to another device, and it can be absent or unreadable in a
 * private window, so every read is written to tolerate failure and fall back to the default.
 */
export interface LaunchPreferences {
  /** Tile ids, most important first. Ids the build no longer contains are ignored on read. */
  order: string[];
  /** Tile ids the viewer has taken off their own Command Center. */
  hidden: string[];
  /**
   * Chosen widths, by tile id. A tile absent from this map keeps the automatic width that
   * makes every row fill; a tile present in it is the size the viewer asked for, even if that
   * leaves a gap. An explicit choice outranks a tidy grid.
   */
  sizes: Record<string, TileSize>;
}

export const defaultPreferences: LaunchPreferences = { order: [], hidden: [], sizes: {} };

function storageKey(role: AppRole): string {
  // Keyed by role: an owner and a manager see different tiles, so one layout cannot describe
  // both, and switching role in the preview must not inherit the other's arrangement.
  return `wavemax.launch-tiles.${role}`;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

export function loadPreferences(role: AppRole): LaunchPreferences {
  try {
    const raw = window.localStorage.getItem(storageKey(role));
    if (!raw) return defaultPreferences;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return defaultPreferences;
    const candidate = parsed as Partial<LaunchPreferences>;
    const sizes: Record<string, TileSize> = {};
    if (typeof candidate.sizes === "object" && candidate.sizes !== null) {
      for (const [id, size] of Object.entries(candidate.sizes)) {
        // A width this build does not know about is dropped rather than guessed at.
        if (isTileSize(size)) sizes[id] = size;
      }
    }
    return {
      order: isStringArray(candidate.order) ? candidate.order : [],
      hidden: isStringArray(candidate.hidden) ? candidate.hidden : [],
      sizes,
    };
  } catch {
    // Unreadable or disabled storage is not an error worth showing anybody; the default
    // arrangement is a perfectly good answer.
    return defaultPreferences;
  }
}

export function savePreferences(role: AppRole, preferences: LaunchPreferences): void {
  try {
    window.localStorage.setItem(storageKey(role), JSON.stringify(preferences));
  } catch {
    // A refused write means this viewer keeps the default next time. Nothing else breaks.
  }
}

export function clearPreferences(role: AppRole): void {
  try {
    window.localStorage.removeItem(storageKey(role));
  } catch {
    // Ignored for the same reason as a refused write.
  }
}

/**
 * Apply a stored arrangement to the tiles this role may actually see.
 *
 * Saved ids that no longer exist are dropped, and tiles the build has gained since the
 * preference was written are kept in their default position relative to each other and appended
 * after the arranged ones. A viewer therefore never loses a new area by having customised
 * before it shipped, and never sees a gap where a removed one used to be.
 */
export function arrange<T extends { id: string }>(
  available: readonly T[],
  preferences: LaunchPreferences,
): T[] {
  const byId = new Map(available.map((item) => [item.id, item]));
  const arranged: T[] = [];
  for (const id of preferences.order) {
    const item = byId.get(id);
    if (item && !arranged.includes(item)) arranged.push(item);
  }
  for (const item of available) {
    if (!arranged.includes(item)) arranged.push(item);
  }
  return arranged;
}

/** Move a tile to an exact position, which is what a drag onto another tile means. */
export function moveTo(ids: string[], id: string, index: number): string[] {
  const from = ids.indexOf(id);
  if (from === -1 || index < 0 || index >= ids.length || from === index) return ids;
  const next = [...ids];
  const [moved] = next.splice(from, 1);
  next.splice(index, 0, moved as string);
  return next;
}

/** Move one tile one place towards the front or the back, returning the new id order. */
export function reorder(ids: string[], id: string, direction: -1 | 1): string[] {
  const from = ids.indexOf(id);
  const to = from + direction;
  if (from === -1 || to < 0 || to >= ids.length) return ids;
  const next = [...ids];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved as string);
  return next;
}
