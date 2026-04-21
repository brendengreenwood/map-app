import { createContext, useContext, useState, useCallback, useEffect, useSyncExternalStore, type ReactNode } from 'react';
import type { UserType } from '@/lib/api';
import { fetchUsers, createUser as apiCreateUser, updateUser as apiUpdateUser, deleteUserApi } from '@/lib/api';

export type { UserType } from '@/lib/api';

export type Theme = 'light' | 'dark' | 'system';

export interface UserPreferences {
  theme: Theme;
}

export interface User {
  id: string;
  name: string;
  types: UserType[];
  preferences: UserPreferences;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
};

const ACTIVE_KEY = 'map-app-active-user';

export type ResolvedTheme = 'light' | 'dark';

interface UserContextValue {
  users: User[];
  activeUser: User;
  resolvedTheme: ResolvedTheme;
  loading: boolean;
  switchUser: (id: string) => void;
  addUser: (name: string, types?: UserType[]) => void;
  deleteUser: (id: string) => void;
  editUser: (id: string, updates: { name?: string; types?: UserType[] }) => void;
  updateTypes: (types: UserType[]) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
}

const UserContext = createContext<UserContextValue | null>(null);

// Fallback while loading or if API is down
const FALLBACK_USER: User = { id: 'local', name: 'Default', types: [], preferences: DEFAULT_PREFERENCES };

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([FALLBACK_USER]);
  const [activeId, setActiveId] = useState<string>(() => localStorage.getItem(ACTIVE_KEY) ?? 'local');
  const [loading, setLoading] = useState(true);

  // Load users from API on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { users: dbUsers } = await fetchUsers();
        if (cancelled) return;

        if (dbUsers.length === 0) {
          // Seed a default user
          const id = crypto.randomUUID();
          const created = await apiCreateUser({ id, name: 'Default', types: [], preferences: DEFAULT_PREFERENCES });
          if (cancelled) return;
          const user: User = {
            id: created.id,
            name: created.name,
            types: created.types ?? [],
            preferences: { ...DEFAULT_PREFERENCES, ...created.preferences as Partial<UserPreferences> },
          };
          setUsers([user]);
          setActiveId(user.id);
          localStorage.setItem(ACTIVE_KEY, user.id);
        } else {
          const mapped: User[] = dbUsers.map((u) => ({
            id: u.id,
            name: u.name,
            types: (u.types as UserType[]) ?? [],
            preferences: { ...DEFAULT_PREFERENCES, ...(u.preferences as Partial<UserPreferences>) },
          }));
          if (cancelled) return;
          setUsers(mapped);
          // Validate stored active ID
          const storedId = localStorage.getItem(ACTIVE_KEY);
          if (!storedId || !mapped.some((u) => u.id === storedId)) {
            setActiveId(mapped[0].id);
            localStorage.setItem(ACTIVE_KEY, mapped[0].id);
          }
        }
      } catch {
        // API unreachable — keep fallback user
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Persist active ID to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(ACTIVE_KEY, activeId);
  }, [activeId]);

  const activeUser = users.find((u) => u.id === activeId) ?? users[0];

  // Track OS dark-mode preference reactively
  const prefersDarkQuery = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;

  const osDark = useSyncExternalStore(
    (cb) => {
      prefersDarkQuery?.addEventListener('change', cb);
      return () => prefersDarkQuery?.removeEventListener('change', cb);
    },
    () => prefersDarkQuery?.matches ?? false,
    () => false,
  );

  const themePref = activeUser.preferences.theme ?? 'system';
  const resolvedTheme: ResolvedTheme =
    themePref === 'system' ? (osDark ? 'dark' : 'light') : themePref;

  // Apply theme to <html> element
  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  }, [resolvedTheme]);

  const switchUser = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const addUser = useCallback((name: string, types: UserType[] = []) => {
    const id = crypto.randomUUID();
    const user: User = { id, name, types, preferences: { ...DEFAULT_PREFERENCES } };
    setUsers((prev) => [...prev, user]);
    setActiveId(id);
    apiCreateUser({ id, name, types, preferences: user.preferences }).catch(() => {});
  }, []);

  const deleteUser = useCallback((id: string) => {
    setUsers((prev) => {
      const next = prev.filter((u) => u.id !== id);
      if (next.length === 0) {
        const fallback: User = { id: crypto.randomUUID(), name: 'Default', types: [], preferences: { ...DEFAULT_PREFERENCES } };
        apiCreateUser({ id: fallback.id, name: fallback.name, types: [], preferences: fallback.preferences }).catch(() => {});
        setActiveId(fallback.id);
        return [fallback];
      }
      return next;
    });
    setActiveId((currentId) => {
      if (currentId === id) {
        const remaining = users.filter((u) => u.id !== id);
        return remaining.length > 0 ? remaining[0].id : currentId;
      }
      return currentId;
    });
    deleteUserApi(id).catch(() => {});
  }, [users]);

  const editUser = useCallback((id: string, updates: { name?: string; types?: UserType[] }) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        const updated = {
          ...u,
          ...(updates.name !== undefined && { name: updates.name }),
          ...(updates.types !== undefined && { types: updates.types }),
        };
        apiUpdateUser(id, updates).catch(() => {});
        return updated;
      })
    );
  }, []);

  const updateTypes = useCallback((types: UserType[]) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== activeId) return u;
        const updated = { ...u, types };
        apiUpdateUser(u.id, { types }).catch(() => {});
        return updated;
      })
    );
  }, [activeId]);

  const updatePreferences = useCallback((prefs: Partial<UserPreferences>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== activeId) return u;
        const updated = { ...u, preferences: { ...u.preferences, ...prefs } };
        apiUpdateUser(u.id, { preferences: updated.preferences }).catch(() => {});
        return updated;
      })
    );
  }, [activeId]);

  return (
    <UserContext value={{
      users,
      activeUser,
      resolvedTheme,
      loading,
      switchUser,
      addUser,
      deleteUser,
      editUser,
      updateTypes,
      updatePreferences,
    }}>
      {children}
    </UserContext>
  );
}

export function useUsers() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUsers must be used within UserProvider');
  return ctx;
}
