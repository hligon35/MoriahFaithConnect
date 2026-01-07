import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { loadAdminEnabled, saveAdminEnabled } from '../storage/adminPrefs';
import {
  addCollectionEntry,
  computeTotals,
  loadCollectionEntries,
  type CollectionEntry,
  type CollectionKind,
  type CollectionTotals,
} from '../storage/collectionStore';

type AdminContextValue = {
  adminEnabled: boolean;
  setAdminEnabled: (enabled: boolean) => Promise<void>;

  collectionEntries: CollectionEntry[];
  collectionTotals: CollectionTotals;
  refreshCollections: () => Promise<void>;
  recordCollection: (input: { kind: CollectionKind; amountCents: number; userId?: string }) => Promise<void>;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [adminEnabled, setAdminEnabledState] = useState(false);

  const [collectionEntries, setCollectionEntries] = useState<CollectionEntry[]>([]);

  const collectionTotals = useMemo(() => computeTotals(collectionEntries), [collectionEntries]);

  const refreshCollections = async () => {
    const entries = await loadCollectionEntries();
    setCollectionEntries(entries);
  };

  useEffect(() => {
    (async () => {
      const enabled = await loadAdminEnabled();
      setAdminEnabledState(enabled);
      await refreshCollections();
    })();
  }, []);

  const setAdminEnabled = async (enabled: boolean) => {
    setAdminEnabledState(enabled);
    await saveAdminEnabled(enabled);
  };

  const recordCollection = async (input: { kind: CollectionKind; amountCents: number; userId?: string }) => {
    const updated = await addCollectionEntry(input);
    setCollectionEntries(updated);
  };

  const value: AdminContextValue = {
    adminEnabled,
    setAdminEnabled,
    collectionEntries,
    collectionTotals,
    refreshCollections,
    recordCollection,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
