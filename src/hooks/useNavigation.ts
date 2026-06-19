'use client';

import { useCallback } from 'react';

export type TabId = 'overview' | 'assets' | 'debts' | 'goals' | 'settings';

export function useNavigate() {
  const navigate = useCallback((tab: TabId) => {
    window.dispatchEvent(new CustomEvent('navigate-tab', { detail: tab }));
  }, []);
  return navigate;
}
