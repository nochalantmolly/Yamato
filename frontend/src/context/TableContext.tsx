import React, {createContext, useContext, useState} from 'react';

interface TableContextValue {
  sessionId: number | null;
  tableNumber: number | null;
  joinSession: (sessionId: number, tableNumber: number) => void;
  leaveSession: () => void;
}

const TableContext = createContext<TableContextValue | null>(null);

export function TableProvider({children}: {children: React.ReactNode}) {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [tableNumber, setTableNumber] = useState<number | null>(null);

  const joinSession = (id: number, num: number) => {
    setSessionId(id);
    setTableNumber(num);
  };

  const leaveSession = () => {
    setSessionId(null);
    setTableNumber(null);
  };

  return (
    <TableContext.Provider value={{sessionId, tableNumber, joinSession, leaveSession}}>
      {children}
    </TableContext.Provider>
  );
}

export function useTable() {
  const ctx = useContext(TableContext);
  if (!ctx) throw new Error('useTable must be used within TableProvider');
  return ctx;
}
