import { z } from 'zod';

const phoneRegex = /^[6-9]\d{9}$/; // Indian mobile numbers starting 6-9

// Requires a domain with a dot and a TLD of 2+ chars — Zod's built-in
// .email() accepts dotless local domains like "abc@gmail".
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ─── OTP flow schemas (primary auth) ─────────────────────────────────────────

export const phoneSchema = z.object({
  phone: z
    .string()
    .min(10, 'Enter 10-digit number')
    .max(10, 'Enter 10-digit number')
    .regex(phoneRegex, 'Invalid Indian mobile number'),
});

export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, 'Enter 6-digit OTP')
    .regex(/^\d{6}$/, 'OTP must contain digits only'),
});

export const completeProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().regex(emailRegex, 'Invalid email address').optional().or(z.literal('')),
});

// Google-created accounts sign in without a phone — complete-profile must
// collect one. OTP users keep the phone-less schema above.
export const completeProfileWithPhoneSchema = completeProfileSchema.extend({
  phone: z
    .string()
    .min(10, 'Enter 10-digit number')
    .max(10, 'Enter 10-digit number')
    .regex(phoneRegex, 'Invalid Indian mobile number'),
});

// ─── Password flow schemas (kept, used by admin/legacy screens) ───────────────

export const loginSchema = z.object({
  phone: z
    .string()
    .min(10, 'Enter 10-digit number')
    .max(10, 'Enter 10-digit number')
    .regex(phoneRegex, 'Invalid Indian mobile number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
    phone: z
      .string()
      .min(10, 'Enter 10-digit number')
      .max(10, 'Enter 10-digit number')
      .regex(phoneRegex, 'Invalid Indian mobile number'),
    email: z.string().regex(emailRegex, 'Invalid email address').optional().or(z.literal('')),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// ─── Inferred types ───────────────────────────────────────────────────────────

export type PhoneFormValues = z.infer<typeof phoneSchema>;
export type OtpFormValues = z.infer<typeof otpSchema>;
export type CompleteProfileFormValues = z.infer<typeof completeProfileSchema>;
export type CompleteProfileWithPhoneFormValues = z.infer<typeof completeProfileWithPhoneSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
