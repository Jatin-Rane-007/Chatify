import { z } from 'zod';

export const AuthEmailSchema = z.object({
  email: z.string().email('Invalid email address format').min(3).max(255).toLowerCase().trim(),
});

export const SignupSchema = z.object({
  email: z.string().email('Invalid email address format').min(3).max(255).toLowerCase().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address format').min(3).max(255).toLowerCase().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export type AuthEmailDto = z.infer<typeof AuthEmailSchema>;

