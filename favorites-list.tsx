"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { generateCertificatePDF } from "@/lib/generateCertificatePDF";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Favorite {
  id: string;
  name: string;
  description?: string;
  meaning?: string;
  origin?: string;
  history?: string;
  usedWiki?: boolean;
  gender?: string;
  theme?: string;
}

interface FavoritesListProps {
  favorites: Favorite[];
  loading: boolean;
  onRefresh: () => void;
  onDelete: (id: string) => void;
}

export function FavoritesList({
  favorites,
  loading,
  onRefresh,
  onDelete,
}: FavoritesListProps) {
  const [localData, setLocalData] = useState<Record<string, { history?: string; meaning?: string; usedWiki?: boolean }>>({});

  // Load saved descriptions from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem("favoriteDescriptions");
    if (savedData) {
      try {
        setLocalData(JSON.parse(savedData));
      } catch (error) {
        console.error("Failed to parse localStorage data:", error);
        localStorage.removeItem("favoriteDescriptions");
      }
    }
  }, []);

  // Save to localStorage whenever localData changes
  useEffect(() => {
    localStorage.setItem("favoriteDescriptions", JSON.stringify(localData));
  }, [localData]);

  const handleGenerateCertificate = async (favorite: Favorite) => {
  console.log("➡️ handleGenerateCertificate clicked for:", favorite.name);

  try {
    const localFavoriteData = localData[favorite.id];
    const history = favorite.history || localFavoriteData?.history;
    const meaning = favorite.meaning || localFavoriteData?.meaning;
    const usedWiki = favorite.usedWiki || localFavoriteData?.usedWiki;

    console.log("➡️ Data for certificate:", { history, meaning, usedWiki });

    if (!history && !meaning) {
    toast({
    title: "Error",
    description: "No description available for certificate.",
    variant: "destructive",
    });
    return;
    }

    await generateCertificatePDF({
    name: favorite.name,
    history: history || "",  // nawet jak braknie, damy pusty string
    meaning: meaning || "",  // mamy meaning → tu OK
    usedWiki: usedWiki || false,
    });

    toast({
      title: "Success",
      description: "Certificate PDF has been generated.",
    });
  } catch (error) {
    console.error("❌ Failed to generate certificate:", error);
    toast({
      title: "Error",
      description: "Failed to generate certificate. Please try again.",
      variant: "destructive",
    });
  }
};

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading favorites...</span>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No favorites yet. Click the heart icon (❤️) on names you like to add them here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {favorites.map(favorite => {
        const localFavoriteData = localData[favorite.id];
        const description = favorite.history || localFavoriteData?.history;

        return (
          <div key={favorite.id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium text-gray-900">{favorite.name}</h3>
              <Button variant="destructive" size="sm" onClick={() => onDelete(favorite.id)}>
                Delete
              </Button>
            </div>

            <p className="text-sm text-gray-600 mb-3">
              {favorite.description || "No description available."}
            </p>

            {description && (
              <div className="bg-blue-50 p-4 rounded-lg text-sm text-gray-700 border border-blue-100 whitespace-pre-line mb-3">
                {description}
              </div>
            )}

            <Button
              onClick={() => handleGenerateCertificate(favorite)}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white"
            >
              Download Name Certificate PDF
            </Button>
          </div>
        );
      })}
    </div>
  );
}
