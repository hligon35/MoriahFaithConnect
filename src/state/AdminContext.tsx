import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { loadAdminEnabled, loadAdminViewOnly, saveAdminEnabled, saveAdminViewOnly } from '../storage/adminPrefs';
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

  adminViewOnly: boolean;
  setAdminViewOnly: (viewOnly: boolean) => Promise<void>;

  collectionEntries: CollectionEntry[];
  collectionTotals: CollectionTotals;
  refreshCollections: () => Promise<void>;
  recordCollection: (input: { kind: CollectionKind; amountCents: number; userId?: string }) => Promise<void>;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [adminEnabled, setAdminEnabledState] = useState(false);
  const [adminViewOnly, setAdminViewOnlyState] = useState(false);

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

      const viewOnly = await loadAdminViewOnly();
      setAdminViewOnlyState(viewOnly);

      await refreshCollections();
    })();
  }, []);

  const setAdminEnabled = async (enabled: boolean) => {
    setAdminEnabledState(enabled);
    await saveAdminEnabled(enabled);

    // If admin is turned off, also exit admin-only view.
    if (!enabled) {
      setAdminViewOnlyState(false);
      await saveAdminViewOnly(false);
    }
  };

  const setAdminViewOnly = async (viewOnly: boolean) => {
    setAdminViewOnlyState(viewOnly);
    await saveAdminViewOnly(viewOnly);
  };

  const recordCollection = async (input: { kind: CollectionKind; amountCents: number; userId?: string }) => {
    const updated = await addCollectionEntry(input);
    setCollectionEntries(updated);
  };

  const value: AdminContextValue = {
    adminEnabled,
    setAdminEnabled,

    adminViewOnly,
    setAdminViewOnly,

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
