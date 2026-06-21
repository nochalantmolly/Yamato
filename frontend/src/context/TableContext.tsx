import React, {createContext, useContext, useState} from 'react';
import {setSessionToken as setClientSessionToken} from 'src/api/client';

interface TableContextValue {
  sessionId: number | null;
  tableNumber: number | null;
  sessionToken: string | null;
  joinSession: (sessionId: number, tableNumber: number, sessionToken?: string) => void;
  leaveSession: () => void;
}

const TableContext = createContext<TableContextValue | null>(null);

export function TableProvider({children}: {children: React.ReactNode}) {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  const joinSession = (id: number, num: number, token?: string) => {
    setSessionId(id);
    setTableNumber(num);
    if (token) {
      setSessionToken(token);
      setClientSessionToken(token);
    }
  };

  const leaveSession = () => {
    setSessionId(null);
    setTableNumber(null);
    setSessionToken(null);
    setClientSessionToken(null);
  };

  return (
    <TableContext.Provider value={{sessionId, tableNumber, sessionToken, joinSession, leaveSession}}>
      {children}
    </TableContext.Provider>
  );
}

export function useTable() {
  const ctx = useContext(TableContext);
  if (!ctx) throw new Error('useTable must be used within TableProvider');
  return ctx;
}
