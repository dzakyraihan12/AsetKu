'use client';

import { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, Wallet, Target, BarChart3, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const { loadAll, isLoading } = useStore();

  useEffect(() => {
    async function init() {
      await seedDefaultCategories();
      await seedDemoData();
      await loadAll();
    }
    init();
  }, [loadAll]);

  // Listen for navigation events from child components
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

  if (isLoading) {
    return (
      <div className="flex flex-col fixed inset-0 overflow-hidden bg-background">
        <DashboardSkeleton />
      </div>
    );
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'overview': return <DashboardPage />;
      case 'assets': return <AssetsPage />;
      case 'goals': return <GoalsPage />;
      case 'analytics': return <StatisticsPage />;
      case 'settings': return <SettingsPage />;
    }
  };

  return (
    <div className="flex flex-col fixed inset-0 overflow-hidden bg-background">
      <main className="flex-1 overflow-y-auto no-scrollbar pb-20 relative">
        {/* Bottom fade indicator */}
        <div className="pointer-events-none fixed bottom-[70px] left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent z-10" />
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

      {/* Bottom Navigation — Elevated Floating Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50">
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
    </div>
  );
}
