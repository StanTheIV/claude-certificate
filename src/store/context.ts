import { createContext, type Dispatch } from 'react';
import type { Action } from './reducer';
import type { ProgressState } from './types';

export interface ProgressContextValue {
  state: ProgressState;
  dispatch: Dispatch<Action>;
}

export const ProgressContext = createContext<ProgressContextValue | null>(null);
