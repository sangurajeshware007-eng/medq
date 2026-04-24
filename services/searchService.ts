/**
 * Unified Search API service
 *
 * GET /api/v1/search?query=...&lang=...&lat=...&lng=...&radius_km=...
 *   → name-based search only (doctors + hospitals)
 *   → diseases[] and specializations[] always return empty []
 *
 * Translations (backend: /api/v1/translations):
 *   GET  /{locale}     → All translations for locale
 *   GET  /categories   → Specialization categories
 */
import api from './api';

// ─── Types ───────────────────────────────────────────────────────────────

export interface UnifiedSearchResult {
    doctors: Array<{
        id: string;
        name: string;
        specialization: string;
        hospitalName?: string;
        rating: number;
        consultationFee?: number;
        distanceKm?: number;
        photo?: string;
    }>;
    hospitals: Array<{
        id: string;
        name: string;
        address: string;
        distanceKm?: number;
        rating?: number;
    }>;
    /** Always empty — backend only does name-based search */
    diseases: Array<{
        name: string;
        specialization: string;
    }>;
    /** Always empty — backend only does name-based search */
    specializations: Array<string>;
}

export interface UnifiedSearchParams {
    query: string;
    lang?: string;
    lat?: number;
    lng?: number;
    radius_km?: number;
}

export interface DiseaseItem {
    name: string;
    specialization: string;
}

export interface SpecializationCategory {
    id: string;
    name: string;
    nameKey: string;
    icon: string;
}

export interface TranslationMap {
    [key: string]: string;
}

// ─── Constants ───────────────────────────────────────────────────────────
const SEARCH_BASE = '/api/v1/search';
const TRANSLATIONS_BASE = '/api/v1/translations';

// ─── Service Methods ─────────────────────────────────────────────────────

export const searchService = {
    /**
     * GET /api/v1/search?query=...&lang=...&lat=...&lng=...&radius_km=...
     * Name-based search only (doctors + hospitals).
     */
    search: (params: UnifiedSearchParams): Promise<UnifiedSearchResult> =>
        api.get<UnifiedSearchResult>(SEARCH_BASE, { params }),
};

export const translationService = {
    /** GET /api/v1/translations/{locale} */
    getByLocale: (locale: string): Promise<TranslationMap> =>
        api.get<TranslationMap>(`${TRANSLATIONS_BASE}/${locale}`),

    /** GET /api/v1/translations/categories */
    getCategories: (): Promise<SpecializationCategory[]> =>
        api.get<SpecializationCategory[]>(`${TRANSLATIONS_BASE}/categories`),
};

export default searchService;

