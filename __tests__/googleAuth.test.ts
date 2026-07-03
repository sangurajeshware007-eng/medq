/**
 * Unit tests for the Google sign-in additions:
 *  - googleAuthService result mapping (success / cancelled / error)
 *  - completeProfileWithPhoneSchema phone validation
 *  - displayPhone sentinel handling
 */
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

import { displayPhone } from '../services/authService';
import { nativeGoogleSignIn } from '../services/googleAuthService';
import { completeProfileSchema, completeProfileWithPhoneSchema } from '../utils/authSchemas';

describe('nativeGoogleSignIn', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns the idToken on successful sign-in', async () => {
    jest.spyOn(GoogleSignin, 'signIn').mockResolvedValueOnce({
      type: 'success',
      data: { idToken: 'fake-id-token' },
    } as Awaited<ReturnType<typeof GoogleSignin.signIn>>);

    const result = await nativeGoogleSignIn();
    expect(result).toEqual({ status: 'success', idToken: 'fake-id-token' });
  });

  it('returns cancelled when the success payload has no idToken', async () => {
    jest.spyOn(GoogleSignin, 'signIn').mockResolvedValueOnce({
      type: 'success',
      data: { idToken: null },
    } as Awaited<ReturnType<typeof GoogleSignin.signIn>>);

    const result = await nativeGoogleSignIn();
    expect(result).toEqual({ status: 'cancelled' });
  });

  it('returns cancelled when the user dismisses the sheet', async () => {
    const err = Object.assign(new Error('cancelled'), { code: statusCodes.SIGN_IN_CANCELLED });
    jest.spyOn(GoogleSignin, 'signIn').mockRejectedValueOnce(err);

    const result = await nativeGoogleSignIn();
    expect(result).toEqual({ status: 'cancelled' });
  });

  it('returns an error for unexpected failures', async () => {
    jest.spyOn(GoogleSignin, 'signIn').mockRejectedValueOnce(new Error('boom'));

    const result = await nativeGoogleSignIn();
    expect(result.status).toBe('error');
  });
});

describe('completeProfileWithPhoneSchema', () => {
  it('requires a valid 10-digit Indian mobile number', () => {
    expect(
      completeProfileWithPhoneSchema.safeParse({ name: 'Ravi Kumar', phone: '9876543210' }).success,
    ).toBe(true);
    expect(
      completeProfileWithPhoneSchema.safeParse({ name: 'Ravi Kumar', phone: '123' }).success,
    ).toBe(false);
    expect(completeProfileWithPhoneSchema.safeParse({ name: 'Ravi Kumar' }).success).toBe(false);
  });

  it('keeps the OTP schema phone-less', () => {
    expect(completeProfileSchema.safeParse({ name: 'Ravi Kumar' }).success).toBe(true);
  });
});

describe('displayPhone', () => {
  it('hides sentinel phones and passes real ones through', () => {
    expect(displayPhone('PENDING-123e4567')).toBeNull();
    expect(displayPhone('DELETED-123e4567')).toBeNull();
    expect(displayPhone(undefined)).toBeNull();
    expect(displayPhone('+919876543210')).toBe('+919876543210');
  });
});
