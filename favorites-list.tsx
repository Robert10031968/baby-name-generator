"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  RefreshCw,
  Trash2,
  Heart,
  BookOpen,
  ChevronUp,
  ChevronDown,
  Download,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { generateCertificatePDF } from "@/lib/generateCertificatePDF";

interface Favorite {
  id: string;
  name: string;
  gender?: string;
  theme?: string;
  created_at: string;
  user_email?: string;
  meaning?: string;
  origin?: string;
  informativeDescription?: string;
  poeticDescription?: string;
  description?: string;
}

interface FavoritesListProps {
  favorites: Favorite[];
  loading: boolean;
  onRefresh: () => void;
  onDelete: (id: string) => Promise<void>;
  usingLocalStorage: boolean;
}

export function FavoritesList({
  favorites,
  loading,
  onRefresh,
  onDelete,
  usingLocalStorage,
}: FavoritesListProps) {
const [favoritesState, setFavorites] = useState<Favorite[]>(favorites);

useEffect(() => {
  setFavorites(favorites); // ✅ poprawna nazwa funkcji
}, [favorites]);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingDescriptions, setLoadingDescriptions] = useState<Record<string, boolean>>({});
  const [descriptionErrors, setDescriptionErrors] = useState<Record<string, string>>({});
  const [certificateUsed, setCertificateUsed] = useState<boolean>(false);
  const isProUser = true;

  useEffect(() => {
    const stored = localStorage.getItem("certificateGenerated");
    if (stored === "true") setCertificateUsed(true);
  }, []);

  useEffect(() => {
    const initialExpandedState: Record<string, boolean> = {};
    favorites.forEach((favorite) => {
      initialExpandedState[favorite.id] = false;
    });
    setExpandedItems(initialExpandedState);
  }, [favorites]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const hasDescription = (favorite: Favorite) => {
    return (
      favorite.description ||
      favorite.informativeDescription ||
      favorite.poeticDescription ||
      favorite.meaning
    );
  };

  const getDescription = (favorite: Favorite) => {
    if (favorite.description) return favorite.description;
    if (favorite.informativeDescription || favorite.poeticDescription)
      return favorite.informativeDescription || favorite.poeticDescription;
    return `${favorite.meaning || "No meaning available"}. Origin: ${favorite.origin || "Unknown"}`;
  };

  const fetchDescriptionForFavorite = async (favorite: Favorite) => {
    if (!favorite.name || loadingDescriptions[favorite.id]) return;

    try {
      setLoadingDescriptions((prev) => ({ ...prev, [favorite.id]: true }));
      setDescriptionErrors((prev) => ({ ...prev, [favorite.id]: "" }));

      const res = await fetch("/api/name-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: favorite.name }),
      });

      if (!res.ok) throw new Error("Failed to fetch description");

      const data = await res.json();
      const description = data.description;

      const updatedFavorite: Favorite = {
        ...favorite,
        description,
      };

      if (usingLocalStorage) {
        const updatedFavorites = favoritesState.map((fav) =>
          fav.id === favorite.id ? updatedFavorite : fav
        );
        localStorage.setItem("babyNameFavorites", JSON.stringify(updatedFavorites));
        setFavorites(updatedFavorites);
        onRefresh();
      } else {
        try {
          const updateRes = await fetch("/api/update-description", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: favorite.id, description }),
          });

          if (!updateRes.ok) {
            let message = "Failed to save description";
            try {
              const errorData = await updateRes.json();
              message = errorData?.error || message;
            } catch (e) {}
            throw new Error(message);
          }

          setFavorites((prev) =>
            prev.map((fav) => (fav.id === favorite.id ? updatedFavorite : fav))
          );
          onRefresh();
        } catch (error) {
          console.error("Save to DB failed:", error);
          setDescriptionErrors((prev) => ({
            ...prev,
            [favorite.id]: "Failed to save description",
          }));
        }
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setDescriptionErrors((prev) => ({
        ...prev,
        [favorite.id]: "Failed to fetch description",
      }));
    } finally {
      setLoadingDescriptions((prev) => ({ ...prev, [favorite.id]: false }));
    }
  };

  const handleGenerateCertificate = async (favorite: Favorite) => {
  const history =
    favorite.description ||
    favorite.informativeDescription ||
    "No historical context available.";

  const meaning =
    favorite.meaning ||
    favorite.poeticDescription ||
    "This name carries a poetic and emotional quality, full of charm and individuality.";

  await generateCertificatePDF({
    name: favorite.name,
    history,
    meaning,
    logoUrl: "/nomena_logo.png",
  });

  // ❌ NIE zapisujemy localStorage ani nie blokujemy użytkownika
  // ✅ NIE pokazujemy alertów "limit użyty"
};

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground mb-4">You haven't saved any favorite names yet.</p>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Favorite Names</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="border-blue-300 text-blue-600 hover:bg-blue-50"
        >
          {refreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
      </div>

      <div className="space-y-3">
        {favoritesState.map((favorite) => (
          <Card
            key={favorite.id}
            className="overflow-hidden border-blue-100 hover:shadow-md transition-shadow duration-300"
          >
            <CardContent className="p-0">
              <div className="flex justify-between items-center p-4 bg-blue-50">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 fill-red-500 text-red-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{favorite.name}</p>
                    <div className="flex gap-2 mt-1">
                      {favorite.theme && <Badge variant="outline">{favorite.theme}</Badge>}
                      {favorite.gender && (
                        <Badge variant="secondary">
                          {favorite.gender === "boy"
                            ? "Boy"
                            : favorite.gender === "girl"
                            ? "Girl"
                            : "Neutral"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">
                    {new Date(favorite.created_at).toLocaleDateString()}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      setDeletingId(favorite.id);
                      await onDelete(favorite.id).finally(() => {
                        setDeletingId(null);
                      });
                    }}
                    disabled={deletingId === favorite.id}
                    title="Remove from favorites"
                    className="transition-all duration-200 hover:scale-110"
                  >
                    {deletingId === favorite.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors duration-200" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-4">
                <div className="w-full">
                  {hasDescription(favorite) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(favorite.id)}
                      className="w-full flex justify-between items-center p-2 h-auto mb-2 border border-pink-200 rounded-md text-pink-600 hover:bg-pink-50"
                    >
                      <span className="text-xs font-medium">
                        {expandedItems[favorite.id] ? "Hide description" : "Show description"}
                      </span>
                      {expandedItems[favorite.id] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  )}

                  {expandedItems[favorite.id] && (
                    <div className="mt-2">
                      <div className="bg-pink-50 rounded-md p-4 text-sm border border-pink-100">
                        <div className="flex items-center mb-3">
                          <BookOpen className="h-4 w-4 text-pink-600 mr-2" />
                          <h4 className="font-medium text-pink-700">About this name</h4>
                        </div>

                        <div className="prose prose-sm max-w-none text-gray-700 mb-4">
                          {getDescription(favorite)
                            .split("\n")
                            .map((paragraph, i) => (
                              <p key={i}>{paragraph}</p>
                            ))}
                        </div>
                        {(!favorite.description || favorite.description.length < 300 || (isProUser && favorite.description.length >= 300)) && (
  <Button
    size="sm"
    variant={favorite.description ? "ghost" : "outline"}
    onClick={() => fetchDescriptionForFavorite(favorite)}
    disabled={loadingDescriptions[favorite.id]}
    className="w-full mb-3"
  >
    {loadingDescriptions[favorite.id] ? (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Fetching description...
      </>
    ) : (
      <>
        <Download className="mr-2 h-4 w-4" />
        {favorite.description ? "Regenerate description (PRO)" : "Get detailed description"}
      </>
    )}
  </Button>
)}
                        {descriptionErrors[favorite.id] && (
                          <p className="text-red-500 text-xs mt-2">{descriptionErrors[favorite.id]}</p>
                        )}

                        <Button
                          size="sm"
                          className="w-full mt-2 bg-indigo-600 text-white hover:bg-indigo-700"
                          onClick={() => handleGenerateCertificate(favorite)}
                        >
                          Generate Certificate
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
