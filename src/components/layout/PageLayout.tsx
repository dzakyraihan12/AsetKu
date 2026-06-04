'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageLayoutProps {
  /** Unique key for the current page (used for animation) */
  pageKey: string;
  /** Content rendered inside the sticky gradient header */
  headerContent: ReactNode;
  /** Scrollable body content below the header */
  children: ReactNode;
}

export function PageLayout({ pageKey, headerContent, children }: PageLayoutProps) {
  return (
    <div className="max-w-lg mx-auto">
      {/* Sticky gradient header — gradient is always visible, header content fades */}
      <div className="sticky top-0 z-20">
        <div className="hero-gradient rounded-b-[24px] wealth-card overflow-hidden">
          <motion.div
            key={`header-${pageKey}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="px-4 pt-5 pb-5 relative z-10"
          >
            {headerContent}
          </motion.div>
        </div>
      </div>

      {/* Content area with slide-up entrance */}
      <motion.div
        key={`content-${pageKey}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1], delay: 0.05 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
