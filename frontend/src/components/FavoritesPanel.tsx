"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, MapPin, Trash2 } from "lucide-react";
import clsx from "clsx";
import {
  createFavorite,
  deleteFavorite,
  listFavorites,
} from "@/lib/intelligence-api";
import { useAuth } from "@/context/AuthContext";
import type { FavoriteLocation } from "@/types/intelligence";
import type { LocationSelection } from "@/types/environment";

export default function FavoritesPanel({
  currentSelection,
  onSelectFavorite,
  compact = false,
}: {
  currentSelection: LocationSelection | null;
  onSelectFavorite: (loc: LocationSelection) => void;
  compact?: boolean;
}) {
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveName, setSaveName] = useState("");
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const isLoggedIn = isAuthenticated;

  const load = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    setError(null);
    try {
      setFavorites(await listFavorites());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load favorites");
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    if (!currentSelection || !saveName.trim()) return;
    try {
      await createFavorite({
        location_name: saveName.trim(),
        latitude: currentSelection.latitude,
        longitude: currentSelection.longitude,
      });
      setSaveName("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteFavorite(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    }
  }

  return (
    <aside className={clsx("glass-panel space-y-4", compact ? "p-3" : "p-4")}>
      <div className="flex items-center gap-2">
        <Bookmark className="w-5 h-5 text-eco-primary" />
        <h3 className="font-semibold">Favorite Locations</h3>
      </div>

      {authLoading && (
        <p className="text-xs text-eco-muted animate-pulse">Checking session…</p>
      )}

      {!authLoading && !isLoggedIn && (
        <p className="text-sm text-eco-muted">
          <Link href="/login" className="text-eco-primary hover:underline">
            Sign in
          </Link>{" "}
          to save and monitor favorite places.
        </p>
      )}

      {!authLoading && isLoggedIn && currentSelection && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. Home, Office…"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-white border border-eco-border text-sm focus:outline-none focus:border-eco-primary/50"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={!saveName.trim()}
            className="px-3 py-2 rounded-lg bg-eco-primary text-white text-sm font-medium disabled:opacity-50"
          >
            Save
          </button>
        </div>
      )}

      {error && <p className="text-xs text-eco-danger">{error}</p>}
      {loading && <p className="text-xs text-eco-muted animate-pulse">Loading…</p>}

      <ul className={clsx("space-y-2 overflow-y-auto", compact ? "max-h-40" : "max-h-80")}>
        {favorites.map((fav) => (
          <li
            key={fav.id}
            className="p-3 rounded-lg border border-eco-border bg-eco-surface hover:border-eco-primary/40 transition-colors"
          >
            <div className="flex justify-between gap-2">
              <button
                type="button"
                className="text-left flex-1"
                onClick={() =>
                  onSelectFavorite({
                    latitude: fav.latitude,
                    longitude: fav.longitude,
                    name: fav.location_name,
                  })
                }
              >
                <p className="font-medium text-sm flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-eco-primary" />
                  {fav.location_name}
                </p>
                {fav.summary ? (
                  <p className="text-xs text-eco-muted mt-1">
                    AQI {fav.summary.aqi ?? "—"} · {fav.summary.temperature ?? "—"}°C ·
                    Risk {fav.summary.risk_level ?? "—"}
                  </p>
                ) : (
                  <p className="text-xs text-eco-muted mt-1">No recent snapshot</p>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(fav.id)}
                className="text-eco-muted hover:text-eco-danger p-1"
                aria-label="Remove favorite"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {!authLoading && isLoggedIn && !loading && favorites.length === 0 && (
        <p className="text-xs text-eco-muted">No saved locations yet.</p>
      )}
    </aside>
  );
}
