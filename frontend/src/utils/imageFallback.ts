import type { SyntheticEvent } from "react";

function initials(label?: string): string {
  const text = (label || "").trim();
  if (!text) return "?";
  return (
    text
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "?"
  );
}

function avatarDataUrl(label?: string): string {
  const chars = initials(label);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" rx="16" fill="#223b57"/><text x="64" y="74" text-anchor="middle" font-size="44" font-family="Segoe UI,Arial,sans-serif" fill="#ffffff">${chars}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function fallbackImageToInitials(
  event: SyntheticEvent<HTMLImageElement>,
  label?: string,
): void {
  const img = event.currentTarget;
  img.onerror = null;
  img.src = avatarDataUrl(label);
}
