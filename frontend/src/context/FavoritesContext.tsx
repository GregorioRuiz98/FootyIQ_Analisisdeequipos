import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  addFavorite,
  getFavorites,
  removeFavorite,
  type Favorite,
  type FavoriteType,
} from "../services/api";

interface FavoritesContextValue {
  favorites: Favorite[];
  loading: boolean;
  isFavorite: (type: FavoriteType, externalId: number) => boolean;
  toggle: (payload: {
    type: FavoriteType;
    externalId: number;
    name?: string;
    metadata?: Record<string, string>;
  }) => Promise<void>;
  refresh: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function makeKey(type: FavoriteType, externalId: number): string {
  return `${type}:${externalId}`;
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFavorites();
      setFavorites(data);
    } catch {
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const keys = useMemo(() => {
    const s = new Set<string>();
    for (const f of favorites) {
      s.add(makeKey(f.type, f.externalId));
    }
    return s;
  }, [favorites]);

  const isFavorite = useCallback(
    (type: FavoriteType, externalId: number) => keys.has(makeKey(type, externalId)),
    [keys],
  );

  const toggle = useCallback(
    async (payload: {
      type: FavoriteType;
      externalId: number;
      name?: string;
      metadata?: Record<string, string>;
    }) => {
      const key = makeKey(payload.type, payload.externalId);
      const already = keys.has(key);
      try {
        if (already) {
          await removeFavorite(payload.type, payload.externalId);
          setFavorites((prev) =>
            prev.filter(
              (f) =>
                !(f.type === payload.type && f.externalId === payload.externalId),
            ),
          );
        } else {
          const created = await addFavorite(payload);
          setFavorites((prev) => {
            if (
              prev.some(
                (f) =>
                  f.type === created.type && f.externalId === created.externalId,
              )
            ) {
              return prev;
            }
            return [created, ...prev];
          });
        }
      } catch (e) {
        console.error("toggle favorite", e);
      }
    },
    [keys],
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({ favorites, loading, isFavorite, toggle, refresh }),
    [favorites, loading, isFavorite, toggle, refresh],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites debe usarse dentro de FavoritesProvider");
  }
  return ctx;
}
