import raw from "../../public/analytics-artifact.json?raw";

/**
 * The published analytics artifact, loaded the way the browser loads it.
 *
 * Several tests assert against the real artifact rather than a fixture, because the guarantees
 * they check — that the browser's arithmetic matches the service's, and that a manager sees no
 * money — are only meaningful against the data the product actually ships. Imported as raw text
 * so the artifact's 1.8 MB of JSON never becomes an inferred TypeScript type.
 */
export function loadArtifact<T>(): T {
  return JSON.parse(raw) as T;
}
