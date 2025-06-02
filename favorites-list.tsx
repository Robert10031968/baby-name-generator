"use client";

import { useState } from "react";
import { generateCertificatePDF } from "@/lib/generateCertificatePDF";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface Favorite {
  id: string;
  name: string;
  description?: string;
  meaning?: string;
  origin?: string;
  informativeDescription?: string;
  poeticDescription?: string;
  history?: string;
  usedWiki?: boolean;
}

interface FavoritesListProps {
  favorites: Favorite[];
  loading: boolean;
  onRefresh: () => void;
  onDelete: (id: string) => void;
  usingLocalStorage: boolean;
}

export function FavoritesList({
  favorites,
  loading,
  onRefresh,
  onDelete,
  usingLocalStorage,
}: FavoritesListProps) {
  const [loadingDescriptions, setLoadingDescriptions] = useState<Record<string, boolean>>({});
  const [favoritesState, setFavoritesState] = useState<Record<string, Favorite>>({});

  const fetchDescriptionForFavorite = async (favorite: Favorite) => {
    setLoadingDescriptions((prev) => ({ ...prev, [favorite.id]: true }));

    try {
      const res = await fetch("/api/name-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: favorite.name, short: false }),
      });

      if (res.ok) {
        const data = await res.json();
        setFavoritesState((prev) => ({
          ...prev,
          [favorite.id]: {
            ...favorite,
            history: data.history || "",
            meaning: data.meaning || "",
            usedWiki: data.usedWiki || false,
          },
        }));

        console.log(`✅ Full description loaded for "${favorite.name}".`);
      } else {
        console.error("❌ Failed to fetch description for favorite.");
      }
    } catch (err) {
      console.error("❌ Error while fetching description:", err);
    } finally {
      setLoadingDescriptions((prev) => ({ ...prev, [favorite.id]: false }));
    }
  };

  const handleDownloadCertificate = async (favorite: Favorite) => {
    const localState = favoritesState[favorite.id] || favorite;

    const history = localState.history || "";
    const meaning = localState.meaning || "";
    const usedWiki = localState.usedWiki || false;

    if (!history || history.length < 100) {
      console.warn(`⚠️ Cannot generate certificate — full description not loaded yet for "${favorite.name}".`);
      return;
    }

    try {
      await generateCertificatePDF({
        name: favorite.name,
        history,
        meaning,
        usedWiki,
      });
    } catch (error) {
      console.error("❌ Failed to generate certificate:", error);
    }
  };

  if (loading) {
    return <p className="text-center py-8">Loading favorites...</p>;
  }

  if (favorites.length === 0) {
    return <p className="text-center py-8">You have no favorites yet.</p>;
  }

  return (
    <div className="space-y-4">
      {favorites.map((favorite) => {
        const localState = favoritesState[favorite.id];
        const hasFullDescription = localState?.history && localState.history.length > 100;

        return (
          <div key={favorite.id} className="border rounded-md p-4 bg-white shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">{favorite.name}</h3>
              <Button variant="destructive" onClick={() => onDelete(favorite.id)}>
                Delete
              </Button>
            </div>

            <p className="text-sm text-gray-600 mb-2">{favorite.description || "No short description yet."}</p>

            {hasFullDescription ? (
              <div className="bg-blue-50 p-3 rounded text-sm border border-blue-100 mb-2 whitespace-pre-line">
                {localState?.history}
              </div>
            ) : (
              <Button
                onClick={() => fetchDescriptionForFavorite(favorite)}
                disabled={loadingDescriptions[favorite.id]}
                className="mb-2 bg-blue-500 hover:bg-blue-600 text-white"
              >
                {loadingDescriptions[favorite.id] ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Description...
                  </>
                ) : (
                  "Show Description"
                )}
              </Button>
            )}

            {hasFullDescription && (
              <Button
                onClick={() => handleDownloadCertificate(favorite)}
                className="bg-pink-500 hover:bg-pink-600 text-white"
              >
                Download Name Certificate PDF
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
