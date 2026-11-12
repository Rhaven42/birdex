import { especesDeZone } from '../data/species';
import { ZONES } from '../data/zones';
import type { ZoneId } from '../data/types';

export function progressionZones(decouvertes: Set<string>): Record<ZoneId, { n: number; total: number }> {
  return Object.fromEntries(
    ZONES.map((z) => {
      const liste = especesDeZone(z.id);
      return [z.id, { n: liste.filter((e) => decouvertes.has(e.id)).length, total: liste.length }];
    }),
  ) as Record<ZoneId, { n: number; total: number }>;
}
