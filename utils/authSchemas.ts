/**
 * Zod validation schemas for auth forms.
 *
 * Single source of truth for form validation rules.
 * Types are inferred from schemas — no manual interface duplication.
 */
import { z } from 'zod';

const phoneRegex = /^[6-9]\d{9}$/; // Indian mobile numbers

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
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name is too long'),
    phone: z
      .string()
      .min(10, 'Enter 10-digit number')
      .max(10, 'Enter 10-digit number')
      .regex(phoneRegex, 'Invalid Indian mobile number'),
    email: z
      .string()
      .email('Invalid email address')
      .optional()
      .or(z.literal('')),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;

