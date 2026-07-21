/**
 * Hospital Onboarding — Pick Location (route)
 *
 * Thin re-export so Metro's platform resolution picks the right screen:
 * HospitalPickLocationScreen.tsx (native, react-native-maps) or
 * HospitalPickLocationScreen.web.tsx (web, no native maps). Expo Router
 * bundles every route file on every platform, so the platform split must
 * live in components/, not here.
 */
export { default } from '../../../components/onboarding/HospitalPickLocationScreen';
