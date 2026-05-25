import { Link } from "react-router-dom";
import { useFavorites } from "../context/FavoritesContext";
import type { Favorite, FavoriteType } from "../services/api";

const TEAM_LOGO = (id: number | string) =>
  `https://images.fotmob.com/image_resources/logo/teamlogo/${id}.png`;
const PLAYER_PHOTO = (id: number | string) =>
  `https://images.fotmob.com/image_resources/playerimages/${id}.png`;

function hrefFor(fav: Favorite): string {
  switch (fav.type) {
    case "PLAYER":
      return `/player?id=${fav.externalId}`;
    case "TEAM":
      return fav.metadata?.leagueId
        ? `/equipos?team=${fav.externalId}&league=${fav.metadata.leagueId}`
        : `/equipos?team=${fav.externalId}`;
    case "MATCH":
      return `/match?id=${fav.externalId}`;
    default:
      return "/";
  }
}

function imageFor(fav: Favorite): string | null {
  if (fav.type === "PLAYER") return PLAYER_PHOTO(fav.externalId);
  if (fav.type === "TEAM") return TEAM_LOGO(fav.externalId);
  return null;
}

function FavoritesSection({
  title,
  type,
  items,
  onRemove,
}: {
  title: string;
  type: FavoriteType;
  items: Favorite[];
  onRemove: (fav: Favorite) => void;
}) {
  return (
    <section className="glass-panel panel">
      <div className="panel-head">
        <h3>{title.toUpperCase()}</h3>
        <span className="subtle">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="subtle">Aún no has guardado ningún {title.slice(0, -1).toLowerCase()}.</p>
      ) : (
        <ul className="fav-list">
          {items.map((fav) => {
            const img = imageFor(fav);
            return (
              <li key={`${fav.type}:${fav.externalId}`} className="fav-list-item">
                <Link to={hrefFor(fav)} className="fav-card">
                  {img ? (
                    <img
                      src={img}
                      alt={fav.name || ""}
                      className={`fav-img ${type === "PLAYER" ? "round" : ""}`}
                      onError={(e) => ((e.currentTarget.style.visibility = "hidden"))}
                    />
                  ) : (
                    <span className="fav-img fav-img-icon">⚽</span>
                  )}
                  <div className="fav-meta">
                    <strong>{fav.name || `#${fav.externalId}`}</strong>
                    {fav.metadata?.subtitle ? (
                      <span className="subtle">{fav.metadata.subtitle}</span>
                    ) : null}
                  </div>
                </Link>
                <button
                  type="button"
                  className="fav-remove"
                  onClick={() => onRemove(fav)}
                  title="Quitar de favoritos"
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function FavoritesPage(): JSX.Element {
  const { favorites, loading, toggle } = useFavorites();

  const players = favorites.filter((f) => f.type === "PLAYER");
  const teams = favorites.filter((f) => f.type === "TEAM");
  const matches = favorites.filter((f) => f.type === "MATCH");

  const onRemove = (fav: Favorite) => {
    toggle({
      type: fav.type,
      externalId: fav.externalId,
      name: fav.name,
      metadata: fav.metadata,
    });
  };

  return (
    <div className="favorites-layout">
      {loading ? (
        <p className="subtle">Cargando favoritos…</p>
      ) : favorites.length === 0 ? (
        <section className="glass-panel panel">
          <h3>FAVORITOS</h3>
          <p className="subtle">
            Marca jugadores, equipos o partidos como favoritos con el icono ☆ para que aparezcan aquí.
          </p>
        </section>
      ) : null}

      <FavoritesSection title="Jugadores" type="PLAYER" items={players} onRemove={onRemove} />
      <FavoritesSection title="Equipos" type="TEAM" items={teams} onRemove={onRemove} />
      <FavoritesSection title="Partidos" type="MATCH" items={matches} onRemove={onRemove} />
    </div>
  );
}
