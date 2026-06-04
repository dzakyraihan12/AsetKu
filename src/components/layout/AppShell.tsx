'use client';

import { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, Wallet, Target, BarChart3, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { useStore } from '@/store';
import { seedDefaultCategories, seedDemoData } from '@/db';
import { DashboardPage } from '@/components/pages/DashboardPage';
import { AssetsPage } from '@/components/pages/AssetsPage';
import { GoalsPage } from '@/components/pages/GoalsPage';
import { StatisticsPage } from '@/components/pages/StatisticsPage';
import { SettingsPage } from '@/components/pages/SettingsPage';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { SplashScreen } from '@/components/shared/SplashScreen';
import { Onboarding } from '@/components/shared/Onboarding';
import type { TabId } from '@/hooks/useNavigation';

const tabs = [
  { id: 'overview', label: 'Home', icon: LayoutDashboard },
  { id: 'assets', label: 'Aset', icon: Wallet },
  { id: 'goals', label: 'Target', icon: Target },
  { id: 'analytics', label: 'Insight', icon: BarChart3 },
  { id: 'settings', label: 'Lainnya', icon: Settings },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showSplash, setShowSplash] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false);
  const { loadAll, isLoading } = useStore();

  useEffect(() => {
    const storedName = localStorage.getItem('asetku_user_name');
    if (storedName) {
      setUserName(storedName);
    } else {
      setShowOnboarding(true);
    }

    async function init() {
      await seedDefaultCategories();
      await seedDemoData();
      await loadAll();
    }
    init();

    const timer = setTimeout(() => setShowSplash(false), 1800);
    return () => clearTimeout(timer);
  }, [loadAll]);

  const handleOnboardingComplete = (name: string) => {
    localStorage.setItem('asetku_user_name', name);
    setUserName(name);
    setShowOnboarding(false);
  };

  useEffect(() => {
    const handler = (e: Event) => {
      const tab = (e as CustomEvent).detail as TabId;
      setActiveTab(tab);
    };
    window.addEventListener('navigate-tab', handler);
    return () => window.removeEventListener('navigate-tab', handler);
  }, []);

  // Blur when app goes to background (app switcher) & show splash on return
  // iOS captures screenshot before React re-renders, so we manipulate DOM directly
  useEffect(() => {
    const blurOverlay = document.getElementById('privacy-blur-overlay');

    const handleBlur = () => {
      // Synchronously show blur before iOS captures screenshot
      if (blurOverlay) {
        blurOverlay.style.display = 'block';
      }
      // Also update React state for splash on return
      setIsBlurred(true);
    };

    const handleFocus = () => {
      // Show splash on return
      setShowSplash(true);
      setIsBlurred(false);
      if (blurOverlay) {
        blurOverlay.style.display = 'none';
      }
      const timer = setTimeout(() => setShowSplash(false), 1400);
      return () => clearTimeout(timer);
    };

    // visibilitychange for general case
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        handleBlur();
      } else if (document.visibilityState === 'visible') {
        handleFocus();
      }
    };

    // pagehide/pageshow are more reliable on iOS Safari/PWA
    const handlePageHide = () => handleBlur();
    const handlePageShow = () => handleFocus();

    // blur/focus on window — fires when entering app switcher on iOS
    const handleWindowBlur = () => handleBlur();
    const handleWindowFocus = () => handleFocus();

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  const handleTabChange = useCallback((id: TabId) => {
    haptic('light');
    setActiveTab(id);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex flex-col overflow-hidden bg-background">
        <DashboardSkeleton />
      </div>
    );
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'overview': return <DashboardPage userName={userName} />;
      case 'assets': return <AssetsPage />;
      case 'goals': return <GoalsPage />;
      case 'analytics': return <StatisticsPage />;
      case 'settings': return <SettingsPage />;
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background" style={{ height: '100dvh' }}>
      <main className="flex-1 overflow-y-auto no-scrollbar relative" style={{ paddingBottom: '64px' }}>
        {/* Bottom fade indicator */}
        <div className="pointer-events-none fixed left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent z-10" style={{ bottom: '58px' }} />
        {renderPage()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom" style={{ bottom: '-4px' }}>
        <div className="mx-auto max-w-lg px-4 pb-1">
          <div className="relative flex items-center justify-around h-[62px] rounded-[22px] bg-surface border border-border/50 shadow-float">
            {tabs.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => handleTabChange(id)}
                  className="relative flex flex-col items-center justify-center w-[56px] h-full z-10 press-scale"
                >
                  {isActive && (
                    <motion.div
                      layoutId="tab-bg"
                      className="absolute inset-x-[4px] inset-y-[6px] rounded-[14px] bg-primary/[0.08]"
                      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    />
                  )}
                  <Icon
                    className={cn(
                      'relative z-10 h-[20px] w-[20px] transition-colors duration-200',
                      isActive ? 'text-primary' : 'text-muted-foreground/35'
                    )}
                    strokeWidth={isActive ? 2.2 : 1.5}
                  />
                  <span className={cn(
                    'relative z-10 text-[9px] mt-[3px] transition-colors duration-200',
                    isActive ? 'font-bold text-primary' : 'font-medium text-muted-foreground/35'
                  )}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Privacy blur overlay — always in DOM, toggled via display for instant iOS response */}
      <div
        id="privacy-blur-overlay"
        className="fixed inset-0 z-[9998] backdrop-blur-xl bg-background/80"
        style={{ display: isBlurred ? 'block' : 'none' }}
      />
    </div>
  );
}
