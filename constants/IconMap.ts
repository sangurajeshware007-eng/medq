/**
 * Central mapping from category/feature keys to Lucide icon components.
 * This replaces emoji usage which breaks on iOS simulators missing AppleColorEmoji font.
 */
import React from 'react';
import {
  Stethoscope,
  Baby,
  Bone,
  // Tooth-like icon not available, use Smile for dentist
  Smile,
  Eye,
  Droplets,
  Heart,
  Brain,
  Hospital,
  Search,
  ClipboardList,
  User,
  Home,
  MapPin,
  Star,
  Shield,
  Phone,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Edit,
  Globe,
  Activity,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

/** Maps category nameKeys and generic keys to Lucide icon components */
export const ICON_MAP: Record<string, LucideIcon> = {
  // Medical categories
  generalPhysician: Stethoscope,
  pediatrician: Baby,
  orthopedic: Bone,
  dentist: Smile,
  eyeSpecialist: Eye,
  skinSpecialist: Droplets,
  heartSpecialist: Heart,
  neuroSpecialist: Brain,
  gynecologist: Activity,

  // UI icons
  hospital: Hospital,
  search: Search,
  booking: ClipboardList,
  profile: User,
  home: Home,
  location: MapPin,
  star: Star,
  verified: Shield,
  phone: Phone,
  clock: Clock,
  calendar: Calendar,
  check: CheckCircle,
  alert: AlertCircle,
  back: ChevronLeft,
  forward: ChevronRight,
  logout: LogOut,
  edit: Edit,
  language: Globe,
};

/** Default color per category for icon tint */
export const CATEGORY_ICON_COLORS: Record<string, string> = {
  generalPhysician: '#0891B2',
  pediatrician: '#059669',
  orthopedic: '#D97706',
  dentist: '#E11D48',
  eyeSpecialist: '#7C3AED',
  skinSpecialist: '#0891B2',
  heartSpecialist: '#DC2626',
  neuroSpecialist: '#EA580C',
};

/**
 * Get the Lucide icon component for a given key.
 * Falls back to Stethoscope if key is not found.
 */
export function getIcon(key: string): LucideIcon {
  return ICON_MAP[key] || Stethoscope;
}

