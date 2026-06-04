'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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

const BACKGROUND_THRESHOLD_MS = 30_000; // 30 seconds

export function AppShell({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showSplash, setShowSplash] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false);
  const backgroundTimestamp = useRef<number>(0);
  const { loadAll, isLoading, transactions, goals, getTotalValue } = useStore();

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

  // Privacy blur & splash on return from background
  useEffect(() => {
    const blurOverlay = document.getElementById('privacy-blur-overlay');

    const handleBlur = () => {
      backgroundTimestamp.current = Date.now();
      if (blurOverlay) blurOverlay.style.display = 'block';
      setIsBlurred(true);
    };

    const handleFocus = () => {
      if (blurOverlay) blurOverlay.style.display = 'none';
      setIsBlurred(false);

      // Only show splash if background duration > threshold
      const elapsed = Date.now() - backgroundTimestamp.current;
      if (backgroundTimestamp.current > 0 && elapsed > BACKGROUND_THRESHOLD_MS) {
        setShowSplash(true);
        setTimeout(() => setShowSplash(false), 1400);
      }
      backgroundTimestamp.current = 0;
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') handleBlur();
      else if (document.visibilityState === 'visible') handleFocus();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handleBlur);
    window.addEventListener('pageshow', () => handleFocus());
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handleBlur);
      window.removeEventListener('pageshow', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleTabChange = useCallback((id: TabId) => {
    haptic('light');
    setActiveTab(id);
  }, []);

  // Badge indicators
  const hasNewTransactions = (() => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return transactions.some(t => t.date === today);
  })();

  const hasGoalNearComplete = (() => {
    const totalValue = getTotalValue();
    return goals.some(g => {
      const progress = g.targetAmount > 0 ? (totalValue / g.targetAmount) * 100 : 0;
      return progress >= 80 && progress < 100;
    });
  })();

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

  const getBadge = (tabId: string) => {
    if (tabId === 'assets' && hasNewTransactions) return true;
    if (tabId === 'goals' && hasGoalNearComplete) return true;
    return false;
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
              const hasBadge = getBadge(id);
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
                  <div className="relative">
                    <Icon
                      className={cn(
                        'relative z-10 h-[20px] w-[20px] transition-colors duration-200',
                        isActive ? 'text-primary' : 'text-muted-foreground/35'
                      )}
                      strokeWidth={isActive ? 2.2 : 1.5}
                    />
                    {hasBadge && (
                      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-400 border border-surface" />
                    )}
                  </div>
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
        className="fixed inset-0 z-[9998] backdrop-blur-3xl bg-background/90"
        style={{ display: isBlurred ? 'block' : 'none' }}
      />
    </div>
  );
}
