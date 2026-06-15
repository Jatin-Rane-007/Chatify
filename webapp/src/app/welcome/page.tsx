'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/styles/ThemeProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useUsernameAvailability } from '@/hooks/useUsernameAvailability';
import {
  Sparkles,
  User,
  Moon,
  Sun,
  ArrowRight,
  Check,
  CheckCircle,
  Zap,
  Shield,
  AlertCircle,
  Loader2,
  FileText,
} from 'lucide-react';

type Step = 'welcome' | 'profile' | 'theme' | 'complete';

export default function WelcomePage() {
  const { user, loading, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('primary-violet');
  
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { available: usernameAvailable, checking: usernameChecking } =
    useUsernameAvailability(username, user?.username);

  const avatars = [
    { id: 'primary-violet', name: 'Primary Violet', classes: 'from-primary to-violet-500' },
    { id: 'rose-orange', name: 'Rose Sunset', classes: 'from-rose-500 to-orange-500' },
    { id: 'emerald-cyan', name: 'Ocean Emerald', classes: 'from-emerald-400 to-cyan-500' },
    { id: 'blue-indigo', name: 'Deep Indigo', classes: 'from-blue-500 to-indigo-600' },
    { id: 'purple-pink', name: 'Neon Pink', classes: 'from-purple-500 to-pink-500' },
    { id: 'amber-yellow', name: 'Golden Glow', classes: 'from-amber-400 to-yellow-500' },
  ];

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      const emailPrefix = user.email.split('@')[0];
      setDisplayName(user.displayName || user.email.split('@')[0]);
      if (!username) {
        setUsername(user.username || emailPrefix.toLowerCase().replace(/[^a-z0-9_]/g, ''));
      }
      if (user.bio) setBio(user.bio);
      if (user.avatarUrl) setSelectedAvatar(user.avatarUrl);
    }
  }, [user, loading, router]);

  const handleNextStep = () => {
    setLocalError(null);
    if (currentStep === 'welcome') {
      setCurrentStep('profile');
    } else if (currentStep === 'profile') {
      if (!displayName.trim()) {
        setLocalError('Please enter a display name so others can recognize you.');
        return;
      }
      if (!username.trim()) {
        setLocalError('Please enter a unique username.');
        return;
      }
      if (usernameAvailable === false) {
        setLocalError('The chosen username is invalid or already taken.');
        return;
      }
      setCurrentStep('theme');
    } else if (currentStep === 'theme') {
      handleCompleteSetup();
    }
  };

  const handleBackStep = () => {
    setLocalError(null);
    if (currentStep === 'profile') {
      setCurrentStep('welcome');
    } else if (currentStep === 'theme') {
      setCurrentStep('profile');
    }
  };

  const handleCompleteSetup = async () => {
    setIsSubmitting(true);
    setLocalError(null);
    try {
      // Save full profile details directly in backend database
      await updateProfile({
        username: username.trim().toLowerCase(),
        displayName: displayName.trim(),
        bio: bio.trim(),
        avatarUrl: selectedAvatar,
      });
      setCurrentStep('complete');
    } catch (err: any) {
      setLocalError(err.message || 'Failed to complete setup. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    router.push('/');
  };

  // Full page loading state for initial hydration / auth check
  if (loading || (!user && currentStep !== 'complete')) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="relative flex flex-col items-center justify-center gap-4">
          <div className="relative flex items-center justify-center">
            <div className="h-12 w-12 rounded-full border-t-2 border-r-2 border-primary animate-spin" />
            <div className="absolute h-8 w-8 rounded-full border-b-2 border-l-2 border-violet-500 animate-spin duration-700" />
          </div>
          <span className="text-xs font-semibold text-muted-foreground animate-pulse">
            Configuring your workspace...
          </span>
        </div>
      </div>
    );
  }

  // Active step numbering for status bar
  const getStepNumber = () => {
    switch (currentStep) {
      case 'welcome': return 1;
      case 'profile': return 2;
      case 'theme': return 3;
      case 'complete': return 4;
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-background p-4 overflow-hidden font-sans text-foreground transition-colors duration-500">
      {/* Premium ambient glowing backgrounds */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/10 blur-[130px] pointer-events-none -z-10 animate-pulse-subtle" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-violet-600/10 blur-[130px] pointer-events-none -z-10 animate-pulse-subtle duration-1000" />

      {/* Floating Header */}
      <header className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-primary to-violet-500 flex items-center justify-center font-bold text-white shadow-md shadow-primary/20">
            C
          </div>
          <span className="font-bold text-base tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
            Chatify
          </span>
        </div>
        <ThemeToggle />
      </header>

      {/* Onboarding Container */}
      <div className="w-full max-w-lg z-10 my-12">
        {/* Step Progress Tracker */}
        <div className="flex items-center justify-between px-6 mb-8 max-w-sm mx-auto">
          {[1, 2, 3, 4].map((stepNum) => {
            const activeStep = getStepNumber();
            const isCompleted = stepNum < activeStep;
            const isActive = stepNum === activeStep;

            return (
              <React.Fragment key={stepNum}>
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    isCompleted
                      ? 'bg-primary text-primary-foreground scale-105 shadow-md shadow-primary/15'
                      : isActive
                      ? 'bg-gradient-to-tr from-primary to-violet-500 text-white font-extrabold scale-110 shadow-lg shadow-primary/20 ring-4 ring-primary/20'
                      : 'bg-card border border-border text-muted-foreground'
                  }`}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : stepNum}
                </div>
                {stepNum < 4 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 rounded-full transition-all duration-500 ${
                      isCompleted ? 'bg-primary' : 'bg-border'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Content Box with glass effect */}
        <Card className="border-border bg-card/45 backdrop-blur-xl shadow-2xl hover:border-border/80 transition-all duration-300 overflow-hidden">
          <CardContent className="p-5 sm:p-8">
            
            {/* STEP 1: WELCOME INTRO */}
            {currentStep === 'welcome' && (
              <div className="space-y-6 text-center animate-in fade-in-50 slide-in-from-bottom-5 duration-300">
                <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-tr from-primary to-violet-500 flex items-center justify-center shadow-lg shadow-primary/25 mb-2 animate-bounce-subtle">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
                    Welcome to Chatify!
                  </h1>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    We are absolutely thrilled to have you here. Let&apos;s get you setup to communicate privately and securely.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3 text-left">
                  <div className="flex gap-3 p-3.5 rounded-xl bg-card/30 border border-border/50">
                    <Zap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xs font-bold text-foreground">Next-Gen Realtime</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">High frequency instant states built on React 19.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3.5 rounded-xl bg-card/30 border border-border/50">
                    <Shield className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xs font-bold text-foreground">Privacy & Controls</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Approve requests before anyone can message you.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button onClick={handleNextStep} className="w-full h-11 text-sm font-semibold flex items-center justify-center gap-2">
                    <span>Let&apos;s Get Started</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: PROFILE SETUP */}
            {currentStep === 'profile' && (
              <div className="space-y-5 animate-in fade-in-50 slide-in-from-bottom-5 duration-300">
                <div className="text-center space-y-2">
                  <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-1">
                    <User className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">Customize Your Profile</h2>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Let&apos;s personalize how you appear to others. All fields can be updated later.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Avatar Picker */}
                  <div className="space-y-2">
                    <label className="block text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                      Choose Profile Avatar
                    </label>
                    <div className="flex flex-wrap justify-between gap-3 p-3 rounded-2xl bg-card/40 border border-border/60">
                      {avatars.map((av) => {
                        const isSel = av.id === selectedAvatar;
                        return (
                          <button
                            key={av.id}
                            type="button"
                            onClick={() => setSelectedAvatar(av.id)}
                            className={`h-11 w-11 rounded-full bg-gradient-to-tr ${av.classes} flex items-center justify-center cursor-pointer transition-all duration-300 shadow-sm ${
                              isSel 
                                ? 'scale-110 ring-4 ring-primary shadow-lg shadow-primary/25 border-2 border-card'
                                : 'hover:scale-105 hover:opacity-90'
                            }`}
                            title={av.name}
                          >
                            {isSel && <Check className="h-4 w-4 text-white font-extrabold" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Username Input */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label htmlFor="username" className="block text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                        Unique Username
                      </label>
                      {usernameChecking ? (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                          Checking...
                        </span>
                      ) : usernameAvailable === true ? (
                        <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
                          <Check className="h-3 w-3" /> Available
                        </span>
                      ) : usernameAvailable === false ? (
                        <span className="text-[10px] text-destructive font-bold">Taken / Invalid</span>
                      ) : null}
                    </div>
                    <div className="relative">
                      <Input
                        id="username"
                        type="text"
                        placeholder="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.trim().toLowerCase())}
                        maxLength={20}
                        leftIcon={<span className="text-sm font-bold text-muted-foreground pl-0.5">@</span>}
                        error={usernameAvailable === false}
                      />
                    </div>
                  </div>

                  {/* Display Name Input */}
                  <div className="space-y-2">
                    <label htmlFor="displayName" className="block text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                      Display Name
                    </label>
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="e.g. Alex Mercer"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      maxLength={40}
                      leftIcon={<User className="h-4 w-4 text-muted-foreground" />}
                      error={!!localError && !displayName}
                    />
                  </div>

                  {/* Bio Input */}
                  <div className="space-y-2">
                    <label htmlFor="bio" className="block text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                      Bio / Status
                    </label>
                    <Input
                      id="bio"
                      type="text"
                      placeholder="e.g. Software Engineer / Student"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      maxLength={120}
                      leftIcon={<FileText className="h-4 w-4 text-muted-foreground" />}
                    />
                  </div>

                  {localError && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-destructive text-xs flex items-start gap-2.5 animate-in fade-in-0 duration-200">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span className="font-semibold">{localError}</span>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" onClick={handleBackStep} className="flex-1 h-11 text-sm font-semibold">
                      Back
                    </Button>
                    <Button onClick={handleNextStep} className="flex-1 h-11 text-sm font-semibold flex items-center justify-center gap-1.5">
                      <span>Next</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: LIVE THEME SWITCHER */}
            {currentStep === 'theme' && (
              <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-5 duration-300">
                <div className="text-center space-y-2">
                  <div className="mx-auto h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 mb-2">
                    <Sun className="h-5 w-5 dark:hidden" />
                    <Moon className="h-5 w-5 hidden dark:block" />
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">Choose Your Style</h2>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Select a theme mode for your workspace. You can switch this at any time.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-2">
                  {/* Dark Mode Card */}
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex flex-col items-center justify-center p-5 rounded-2xl border text-center transition-all duration-300 cursor-pointer ${
                      theme === 'dark'
                        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/15 ring-2 ring-primary/20 scale-102'
                        : 'border-border/60 bg-card/20 hover:border-border hover:bg-card/45'
                    }`}
                  >
                    <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-violet-400 mb-3 border border-violet-500/10">
                      <Moon className="h-5 w-5 fill-violet-400" />
                    </div>
                    <span className="text-sm font-bold text-foreground">Dark Glow</span>
                    <span className="text-[10px] text-muted-foreground mt-1">Deep violet shadows</span>
                  </button>

                  {/* Light Mode Card */}
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex flex-col items-center justify-center p-5 rounded-2xl border text-center transition-all duration-300 cursor-pointer ${
                      theme === 'light'
                        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/15 ring-2 ring-primary/20 scale-102'
                        : 'border-border/60 bg-card/20 hover:border-border hover:bg-card/45'
                    }`}
                  >
                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-amber-500 mb-3 border border-amber-500/10">
                      <Sun className="h-5 w-5 fill-amber-500" />
                    </div>
                    <span className="text-sm font-bold text-foreground">Platinum Light</span>
                    <span className="text-[10px] text-muted-foreground mt-1">Clean and sharp lines</span>
                  </button>
                </div>

                {localError && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-destructive text-xs flex items-start gap-2.5 animate-in fade-in-0 duration-200">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="font-semibold">{localError}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={handleBackStep} disabled={isSubmitting} className="flex-1 h-11 text-sm font-semibold">
                    Back
                  </Button>
                  <Button onClick={handleNextStep} loading={isSubmitting} className="flex-1 h-11 text-sm font-semibold flex items-center justify-center gap-1.5">
                    <span>Complete Setup</span>
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 4: ONBOARDING COMPLETE */}
            {currentStep === 'complete' && (
              <div className="space-y-6 text-center animate-in scale-in duration-300">
                {/* Complete Render Avatar */}
                <div className={`mx-auto h-16 w-16 rounded-full bg-gradient-to-tr ${
                  avatars.find(a => a.id === selectedAvatar)?.classes || 'from-primary to-violet-500'
                } flex items-center justify-center text-white text-xl font-bold uppercase shadow-lg shadow-primary/25 mb-2`}>
                  {displayName ? displayName[0] : '?'}
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-extrabold tracking-tight text-foreground">You are all set!</h2>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Welcome aboard, <span className="font-semibold text-foreground">{displayName}</span> (@{username})! Your profile is ready.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 max-w-sm mx-auto text-xs text-left flex gap-3 text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Your preferences have been written directly to the MongoDB cluster. Ready to search for users and start chat requests!</span>
                </div>

                <div className="pt-2">
                  <Button onClick={handleFinish} className="w-full h-11 text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-500 border-none shadow-lg shadow-emerald-500/20 active:scale-[0.98]">
                    <span>Enter Chatify Workspace</span>
                  </Button>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      </div>

      {/* Sub-text footer */}
      <footer className="text-[10px] text-muted-foreground/60 select-none animate-pulse-subtle">
        Secure setup complete &bull; Powered by Next.js & Prisma
      </footer>
    </div>
  );
}
