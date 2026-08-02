/**
 * useOwnHospital — Fetches the hospital the current user has registered
 * (as owner/manager), if any.
 *
 * Used by doctor-onboarding step 3 to offer a one-tap "link your own
 * hospital" card, so hospital managers don't detour into the hospital
 * registration flow (and abandon their doctor application) just to link
 * the hospital they already own.
 */
import onboardingService, { type ApprovalStatus } from '@services/onboardingService';
import { useState, useEffect } from 'react';

export interface OwnHospital {
  id: string;
  name: string;
  address: string;
  status: ApprovalStatus;
}

export function useOwnHospital(): { ownHospital: OwnHospital | null; loading: boolean } {
  const [ownHospital, setOwnHospital] = useState<OwnHospital | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const status = await onboardingService.getHospitalOnboardingStatus();
        if (!status.hospitalId || status.approvalStatus === 'NOT_STARTED') return;
        const data = await onboardingService.getHospitalData();
        if (cancelled || !data.profile) return;
        setOwnHospital({
          id: status.hospitalId,
          name: data.profile.name,
          address: data.profile.address ?? '',
          status: status.approvalStatus,
        });
      } catch {
        // No hospital / fetch failed — the card simply doesn't render.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { ownHospital, loading };
}
