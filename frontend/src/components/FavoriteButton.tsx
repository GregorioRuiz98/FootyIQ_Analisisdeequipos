import { useFavorites } from "../context/FavoritesContext";
import type { FavoriteType } from "../services/api";

interface Props {
  type: FavoriteType;
  externalId: number | null | undefined;
  name?: string;
  metadata?: Record<string, string>;
  size?: "sm" | "md";
  label?: boolean;
}

export function FavoriteButton({
  type,
  externalId,
  name,
  metadata,
  size = "md",
  label = false,
}: Props): JSX.Element | null {
  const { isFavorite, toggle } = useFavorites();
  if (externalId === null || externalId === undefined || !Number.isFinite(externalId)) {
    return null;
  }
  const active = isFavorite(type, externalId);
  return (
    <button
      type="button"
      className={`fav-btn fav-${size} ${active ? "is-active" : ""}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle({ type, externalId, name, metadata });
      }}
      aria-pressed={active}
      title={active ? "Quitar de favoritos" : "Guardar en favoritos"}
    >
      <span className="fav-icon" aria-hidden="true">
        {active ? "★" : "☆"}
      </span>
      {label ? (
        <span className="fav-label">{active ? "En favoritos" : "Favorito"}</span>
      ) : null}
    </button>
  );
}
