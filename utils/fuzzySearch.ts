import type { DoctorListItem } from '@services/doctorService';
import type { HospitalListItem } from '@services/hospitalService';
import type { IFuseOptions } from 'fuse.js';
import Fuse from 'fuse.js';

const COMMON: IFuseOptions<unknown> = {
  threshold: 0.4,
  ignoreLocation: true,
  minMatchCharLength: 2,
  includeScore: true,
};

const DOCTOR_OPTS: IFuseOptions<DoctorListItem> = {
  ...COMMON,
  keys: [
    { name: 'name', weight: 0.5 },
    { name: 'specialization', weight: 0.3 },
    { name: 'hospitalName', weight: 0.2 },
    { name: 'diseases', weight: 0.2 },
  ],
};

const HOSPITAL_OPTS: IFuseOptions<HospitalListItem> = {
  ...COMMON,
  keys: [
    { name: 'name', weight: 0.7 },
    { name: 'address', weight: 0.2 },
    { name: 'departments', weight: 0.1 },
  ],
};

const DISEASE_OPTS: IFuseOptions<string> = {
  ...COMMON,
  threshold: 0.35,
};

// Cache Fuse instances keyed by the input array reference so we don't rebuild
// the index on every keystroke. TanStack Query returns stable references when
// nothing changed, so this WeakMap stays warm across renders.
const doctorIndex = new WeakMap<DoctorListItem[], Fuse<DoctorListItem>>();
const hospitalIndex = new WeakMap<HospitalListItem[], Fuse<HospitalListItem>>();
const diseaseIndex = new WeakMap<string[], Fuse<string>>();

function doctorFuse(list: DoctorListItem[]): Fuse<DoctorListItem> {
  let f = doctorIndex.get(list);
  if (!f) {
    f = new Fuse(list, DOCTOR_OPTS);
    doctorIndex.set(list, f);
  }
  return f;
}

function hospitalFuse(list: HospitalListItem[]): Fuse<HospitalListItem> {
  let f = hospitalIndex.get(list);
  if (!f) {
    f = new Fuse(list, HOSPITAL_OPTS);
    hospitalIndex.set(list, f);
  }
  return f;
}

function diseaseFuse(keys: string[]): Fuse<string> {
  let f = diseaseIndex.get(keys);
  if (!f) {
    f = new Fuse(keys, DISEASE_OPTS);
    diseaseIndex.set(keys, f);
  }
  return f;
}

/** Fuzzy-match doctors by name, specialization, affiliated hospital, or
 * disease tag. Results are ordered by Fuse score (best first). */
export function matchDoctors(query: string, doctors: DoctorListItem[]): DoctorListItem[] {
  const q = query.trim();
  if (q.length < 2 || doctors.length === 0) return doctors;
  return doctorFuse(doctors)
    .search(q)
    .map((r) => r.item);
}

/** Fuzzy-match hospitals by name (primary), address, and departments.
 * Returns ordered by Fuse score. */
export function matchHospitals(query: string, hospitals: HospitalListItem[]): HospitalListItem[] {
  const q = query.trim();
  if (q.length < 2 || hospitals.length === 0) return [];
  return hospitalFuse(hospitals)
    .search(q)
    .map((r) => r.item);
}

/** Given a `diseaseMapping` (disease name → specialization keys), fuzzy-match
 * the query against disease names and return the union of specializations. */
export function matchedSpecializations(
  query: string,
  mapping: Record<string, string[]>,
): Set<string> {
  const q = query.trim();
  const out = new Set<string>();
  if (q.length < 2) return out;
  const keys = Object.keys(mapping);
  for (const hit of diseaseFuse(keys).search(q)) {
    for (const spec of mapping[hit.item] || []) out.add(spec.toLowerCase());
  }
  return out;
}
