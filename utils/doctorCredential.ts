/**
 * Shortens a doctor's full qualification string into a compact pill label.
 * Used on list cards in place of the rating during phase 1 (reviews hidden).
 *
 *   "MBBS, MD (General Medicine)"  → "MBBS, MD"
 *   "BDS, MDS"                     → "BDS, MDS"
 *   "MBBS"                         → "MBBS"
 *   undefined / empty              → "" (caller hides the pill)
 */
export function formatShortCredential(degree: string | undefined | null): string {
  if (!degree) return '';
  const parts = degree
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    // Drop parentheticals like "(General Medicine)" — keep just the degree abbreviation.
    .map((p) => p.replace(/\s*\(.+?\)\s*/g, '').trim())
    .filter(Boolean);
  if (parts.length === 0) return '';
  return parts.slice(0, 2).join(', ');
}
