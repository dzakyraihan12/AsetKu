'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageLayoutProps {
  pageKey: string;
  headerContent: ReactNode;
  children: ReactNode;
}

export function PageLayout({ pageKey, headerContent, children }: PageLayoutProps) {
  return (
    <div className="max-w-lg mx-auto">
      {/* Sticky gradient header */}
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

      {/* Content area */}
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
