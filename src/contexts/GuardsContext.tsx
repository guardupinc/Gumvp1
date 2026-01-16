import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Guard, GUARDS_MASTER_LIST } from '../utils/guardsData';

interface GuardsContextType {
  guards: Guard[];
  addGuard: (guard: Guard) => void;
  updateGuard: (guard: Guard) => void;
  deleteGuard: (guardId: number) => void;
  getGuardById: (id: number) => Guard | undefined;
  getAllGuards: () => Guard[];
}

const GuardsContext = createContext<GuardsContextType | undefined>(undefined);

export function GuardsProvider({ children }: { children: ReactNode }) {
  const [guards, setGuards] = useState<Guard[]>(GUARDS_MASTER_LIST);

  const addGuard = (guard: Guard) => {
    setGuards(prev => [...prev, guard]);
  };

  const updateGuard = (updatedGuard: Guard) => {
    setGuards(prev => prev.map(g => g.id === updatedGuard.id ? updatedGuard : g));
  };

  const deleteGuard = (guardId: number) => {
    setGuards(prev => prev.filter(g => g.id !== guardId));
  };

  const getGuardById = (id: number): Guard | undefined => {
    return guards.find(guard => guard.id === id);
  };

  const getAllGuards = (): Guard[] => {
    return guards;
  };

  return (
    <GuardsContext.Provider value={{ 
      guards, 
      addGuard, 
      updateGuard, 
      deleteGuard,
      getGuardById,
      getAllGuards
    }}>
      {children}
    </GuardsContext.Provider>
  );
}

export function useGuards() {
  const context = useContext(GuardsContext);
  if (!context) {
    throw new Error('useGuards must be used within a GuardsProvider');
  }
  return context;
}
