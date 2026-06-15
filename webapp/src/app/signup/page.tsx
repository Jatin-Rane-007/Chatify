'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, AlertCircle, ArrowLeft, Sparkles, UserPlus, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup, user, loading } = useAuth();
  const router = useRouter();

  // Redirect if already logged in (but not during submission)
  useEffect(() => {
    if (!loading && user && !isSubmitting) {
      router.push('/');
    }
  }, [user, loading, router, isSubmitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setLocalError('Email address is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setLocalError('Please enter a valid email address');
      return;
    }

    if (!password) {
      setLocalError('Password is required');
      return;
    }

    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);
    try {
      await signup(trimmedEmail, password);
      router.push('/welcome');
    } catch (err: any) {
      setLocalError(err.message || 'Failed to sign up. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Full page loading state
  if (loading || (user && !isSubmitting)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="relative flex flex-col items-center justify-center gap-4">
          <div className="relative flex items-center justify-center">
            <div className="h-12 w-12 rounded-full border-t-2 border-r-2 border-primary animate-spin" />
            <div className="absolute h-8 w-8 rounded-full border-b-2 border-l-2 border-violet-500 animate-spin duration-700" />
          </div>
          <span className="text-xs font-semibold text-muted-foreground animate-pulse">Setting up your space...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-background p-4 overflow-hidden font-sans text-foreground transition-colors duration-300">
      {/* Background soft glowing lights */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/10 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-violet-600/10 blur-[120px] pointer-events-none -z-10" />

      {/* Floating Header Actions */}
      <header className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
        <Button variant="ghost" className="h-9 px-3 flex items-center gap-2 hover:bg-accent text-muted-foreground hover:text-foreground" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Home</span>
          </Link>
        </Button>
        <ThemeToggle />
      </header>

      {/* Signup Box */}
      <div className="w-full max-w-md z-10">
        <Card className="border-border bg-card/40 backdrop-blur-xl shadow-2xl hover:border-border/80 transition-all duration-300">
          <CardHeader className="text-center pt-8 pb-4">
            <div className="mx-auto h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-violet-500 flex items-center justify-center font-bold text-white shadow-md shadow-primary/20 mb-4 select-none animate-pulse-subtle">
              C
            </div>
            <CardTitle className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
              Create Account
            </CardTitle>
            <CardDescription className="text-sm">
              Get started instantly with email & password
            </CardDescription>
          </CardHeader>

          <CardContent className="pb-4">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-muted-foreground text-xs font-semibold uppercase tracking-wider"
                >
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  error={!!localError}
                  leftIcon={<Mail className="h-4 w-4" />}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-muted-foreground text-xs font-semibold uppercase tracking-wider"
                >
                  Password (Min. 8 characters)
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  error={!!localError}
                  leftIcon={<Lock className="h-4 w-4" />}
                />
              </div>

              {localError ? (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-destructive text-xs flex items-start gap-2.5 animate-in fade-in-0 duration-200">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="font-semibold">{localError}</span>
                </div>
              ) : null}

              <Button type="submit" loading={isSubmitting} className="w-full h-11 text-sm font-semibold flex gap-2">
                <UserPlus className="h-4 w-4" />
                <span>Sign Up Free</span>
              </Button>
            </form>
          </CardContent>

          <CardFooter className="pt-2 pb-6 border-t border-border/10 mt-2 flex justify-center">
            <p className="text-muted-foreground text-xs text-center">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:text-primary-hover font-semibold transition-colors">
                Log in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
