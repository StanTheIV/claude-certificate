import { useEffect } from 'react';
import type { Theme } from '../store/types';

export function useThemeEffect(theme: Theme) {
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = theme;
  }, [theme]);
}
