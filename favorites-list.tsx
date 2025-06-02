"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
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
  const [expandedStates, setExpandedStates] = useState<Record<string, boolean>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
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

  const hasFullDescription = (favorite: Favorite) => {
    const localFavoriteData = localData[favorite.id];
    return (
      (favorite.history && favorite.history.length > 100) ||
      (localFavoriteData?.history && localFavoriteData.history.length > 100)
    );
  };

  const toggleDescription = (favoriteId: string) => {
    setExpandedStates(prev => ({
      ...prev,
      [favoriteId]: !prev[favoriteId],
    }));
  };

  const getDescription = async (favorite: Favorite) => {
    setLoadingStates(prev => ({ ...prev, [favorite.id]: true }));

    try {
      const res = await fetch("/api/name-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: favorite.name,
          short: false,
        }),
      });

      if (!res.ok) throw new Error("Failed to fetch description");

      const data = await res.json();

      const descriptionData = {
        history: data.history || "",
        meaning: data.meaning || "",
        usedWiki: data.usedWiki || false,
      };

      // Update Supabase
      const { error } = await supabase
        .from("favorites")
        .update({
          history: descriptionData.history,
          meaning: descriptionData.meaning,
          usedWiki: descriptionData.usedWiki,
        })
        .eq("id", favorite.id);

      if (error) throw error;

      // Update localData
      setLocalData(prev => ({
        ...prev,
        [favorite.id]: descriptionData,
      }));

      // Expand description
      setExpandedStates(prev => ({
        ...prev,
        [favorite.id]: true,
      }));

      // Refresh favorites from Supabase
      onRefresh();

      toast({
        title: "Success",
        description: "Description generated and saved.",
      });
    } catch (error) {
      console.error("❌ Error generating description:", error);
      toast({
        title: "Error",
        description: "Failed to generate description. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [favorite.id]: false }));
    }
  };

  const handleGenerateCertificate = async (favorite: Favorite) => {
    try {
      const localFavoriteData = localData[favorite.id];
      const history = favorite.history || localFavoriteData?.history;
      const meaning = favorite.meaning || localFavoriteData?.meaning;
      const usedWiki = favorite.usedWiki || localFavoriteData?.usedWiki;

      if (!history) {
        toast({
          title: "Error",
          description: "Please generate a description first.",
          variant: "destructive",
        });
        return;
      }

      await generateCertificatePDF({
        name: favorite.name,
        history,
        meaning: meaning || "",
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
        const isExpanded = expandedStates[favorite.id];
        const isLoading = loadingStates[favorite.id];
        const hasDescription = hasFullDescription(favorite);
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
              {favorite.description || "Click 'Get Description' to learn more about this name."}
            </p>

            <div className="space-y-3">
              {!hasDescription ? (
                <Button
                  onClick={() => getDescription(favorite)}
                  disabled={isLoading}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Description...
                    </>
                  ) : (
                    "Get Description"
                  )}
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => toggleDescription(favorite.id)}
                    className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="mr-2 h-4 w-4" />
                        Hide Description
                      </>
                    ) : (
                      <>
                        <ChevronDown className="mr-2 h-4 w-4" />
                        Show Description
                      </>
                    )}
                  </Button>

                  {isExpanded && description && (
                    <div className="bg-blue-50 p-4 rounded-lg text-sm text-gray-700 border border-blue-100 whitespace-pre-line">
                      {description}
                    </div>
                  )}

                  <Button
                    onClick={() => handleGenerateCertificate(favorite)}
                    className="w-full bg-pink-500 hover:bg-pink-600 text-white"
                  >
                    Generate Certificate PDF
                  </Button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
