/**
 * Avatar URL helpers for MedReachPlus
 *
 * Uses https://ui-avatars.com to generate letter-based placeholder avatars
 * when no photo/image URL is provided by the API.
 */

const UI_AVATARS_BASE = 'https://ui-avatars.com/api/';

/**
 * Generate a doctor avatar URL from the doctor's name.
 * Returns the provided `photo` if truthy, otherwise a generated avatar.
 */
export function getDoctorAvatar(photo: string | undefined | null, name: string, size = 200): string {
    if (photo) return photo;
    const encoded = encodeURIComponent(name || 'Dr');
    return `${UI_AVATARS_BASE}?name=${encoded}&background=0052CC&color=fff&size=${size}&bold=true&length=2`;
}

/**
 * Generate a hospital avatar/image URL from the hospital's name.
 * Returns the provided `image` if truthy, otherwise a generated avatar.
 */
export function getHospitalAvatar(image: string | undefined | null, name: string, size = 400): string {
    if (image) return image;
    const encoded = encodeURIComponent(name || 'Hospital');
    return `${UI_AVATARS_BASE}?name=${encoded}&background=0A7E8C&color=fff&size=${size}&bold=true&length=2`;
}

