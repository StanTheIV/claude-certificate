import { useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { progressReducer } from './reducer';
import { loadState, saveState } from './persist';
import { ProgressContext } from './context';

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(progressReducer, undefined, loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}
