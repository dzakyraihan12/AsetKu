'use client';

import { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, Wallet, Target, BarChart3, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { useStore } from '@/store';
import { useViewport } from '@/hooks/useViewport';
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

/**
 * Bottom nav bar height calculation:
 * - Nav pill height: 62px
 * - Padding around pill: 12px top + safe-area-bottom (or min 8px)
 * - Total reserve for main content padding-bottom
 */
const NAV_HEIGHT = 62;
const NAV_PADDING_TOP = 8;
const NAV_PADDING_BOTTOM_MIN = 8;

export function AppShell({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showSplash, setShowSplash] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { loadAll, isLoading } = useStore();

  // Initialize iOS viewport handler
  useViewport();

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
      <div className="app-shell-root flex flex-col overflow-hidden bg-background">
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
    <div className="app-shell-root flex flex-col overflow-hidden bg-background">
      {/* Main scrollable content area */}
      <main
        className="flex-1 overflow-y-auto no-scrollbar relative"
        style={{
          paddingBottom: `calc(${NAV_HEIGHT + NAV_PADDING_TOP + NAV_PADDING_BOTTOM_MIN}px + var(--safe-bottom))`,
        }}
      >
        {/* Bottom fade indicator above nav */}
        <div
          className="pointer-events-none fixed left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent z-10"
          style={{
            bottom: `calc(${NAV_HEIGHT + NAV_PADDING_TOP}px + var(--safe-bottom))`,
          }}
        />
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation — Floating Pill */}
      <nav
        className="fixed left-0 right-0 z-50"
        style={{
          bottom: `calc(${NAV_PADDING_BOTTOM_MIN}px + var(--safe-bottom))`,
        }}
      >
        <div className="mx-auto max-w-lg px-4">
          <div className="relative flex items-center justify-around h-[62px] rounded-[22px] bg-surface/95 backdrop-blur-xl border border-border/40 shadow-float">
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
    </div>
  );
}
