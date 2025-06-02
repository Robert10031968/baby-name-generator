"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, BookOpen } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FavoritesList } from "./favorites-list";
import { HeartButton } from "./heart-button";
import { toast } from "@/components/ui/use-toast";

interface NameWithMeaning {
  name: string;
  summary?: string;
  history?: string;
  usedWiki?: boolean;
}

interface Favorite {
  id: string;
  name: string;
  gender?: string;
  theme?: string;
  created_at: string;
  user_email?: string;
  meaning?: string;
  origin?: string;
  description?: string;
  history?: string;
  usedWiki?: boolean;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function BabyNameGenerator() {
  const [theme, setTheme] = useState("");
  const [customNameMode, setCustomNameMode] = useState(false);
  const [gender, setGender] = useState("neutral");
  const [names, setNames] = useState<NameWithMeaning[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  const loadFavoritesFromSupabase = async () => {
    setFavoritesLoading(true);
    try {
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (err) {
      console.error("❌ Failed to fetch favorites:", err);
      toast({
        title: "Error",
        description: "Failed to load favorites. Please try again.",
        variant: "destructive"
      });
    } finally {
      setFavoritesLoading(false);
    }
  };

  useEffect(() => {
    loadFavoritesFromSupabase();
  }, []);

  const generateNames = async () => {
    if (!theme) {
      toast({
        title: "Please enter a theme",
        description: "Enter a theme or inspiration to generate names.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setNames([]);
    setError("");

    try {
      if (customNameMode) {
        const res = await fetch("/api/name-description", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: theme, short: true }),
        });

        if (!res.ok) throw new Error(`Describe endpoint failed: ${res.status}`);
        const data = await res.json();
        setNames([{ 
          name: theme, 
          summary: data.meaning, 
          history: data.history, 
          usedWiki: data.usedWiki 
        }]);
      } else {
        const res = await fetch(
          "https://babyname-agent-railway-production.up.railway.app/webhook/babyname",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ theme, gender, count: 10 }),
          }
        );

        if (!res.ok) throw new Error(`Server responded with status: ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data.namesWithMeanings)) {
          throw new Error("Unexpected response format");
        }
        setNames(data.namesWithMeanings);
      }
    } catch (error) {
      console.error("❌ Error generating names:", error);
      setError("Failed to generate names. Please try again.");
      toast({
        title: "Error",
        description: "Failed to generate names. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const isNameFavorited = (name: string) => {
    return favorites.some(f => f.name === name);
  };

  const toggleFavorite = async (nameData: NameWithMeaning) => {
    const isFavorite = isNameFavorited(nameData.name);

    if (isFavorite) {
      const favorite = favorites.find(f => f.name === nameData.name);
      if (favorite) {
        await handleDeleteFavorite(favorite.id);
      }
      return;
    }

    try {
      const res = await fetch("/api/save-favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameData.name,
          gender: gender || "neutral",
          theme: theme || "",
          user_email: "guest@example.com",
          description: nameData.summary || "No description yet.",
          history: nameData.history || "",
          usedWiki: nameData.usedWiki || false,
          meaning: nameData.summary || "No meaning yet.",
        }),
      });

      if (!res.ok) throw new Error("Failed to save favorite");

      const result = await res.json();
      if (result.success) {
        toast({
          title: "Success",
          description: `"${nameData.name}" added to favorites!`,
        });
        await loadFavoritesFromSupabase();
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (error) {
      console.error("❌ Failed to save favorite:", error);
      toast({
        title: "Error",
        description: "Failed to save favorite.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFavorite = async (favoriteId: string) => {
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", favoriteId);

      if (error) throw error;

      // Update local state
      setFavorites(prev => prev.filter(f => f.id !== favoriteId));
      
      // Clear from localStorage (if exists)
      const savedDescriptions = localStorage.getItem('favoriteDescriptions');
      if (savedDescriptions) {
        const descriptions = JSON.parse(savedDescriptions);
        delete descriptions[favoriteId];
        localStorage.setItem('favoriteDescriptions', JSON.stringify(descriptions));
      }

      toast({ 
        title: "Success",
        description: "Name removed from favorites"
      });
    } catch (error) {
      console.error("❌ Failed to delete favorite:", error);
      toast({
        title: "Error",
        description: "Failed to remove favorite. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-gradient-to-b from-pink-50 to-blue-50 rounded-xl shadow-sm">
      <h1 className="text-3xl font-bold mb-4 text-pink-600">AI Baby Name Generator</h1>
      <p className="text-blue-700 mb-6">Discover perfect baby names with short insights. Add your favorites for more!</p>

      <Tabs defaultValue="generator" className="mb-6">
        <TabsList className="grid w-full grid-cols-2 bg-blue-100">
          <TabsTrigger value="generator" className="data-[state=active]:bg-pink-100 data-[state=active]:text-pink-700">
            Generate Names
          </TabsTrigger>
          <TabsTrigger value="favorites" className="data-[state=active]:bg-pink-100 data-[state=active]:text-pink-700">
            Favorites ({favorites.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generator">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            <div>
              <Label htmlFor="theme">Theme or Inspiration</Label>
              <Input
                id="theme"
                placeholder="e.g., nature, mythology, modern"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="mt-1"
              />
              <div className="flex items-center gap-2 mt-3">
                <input
                  id="customName"
                  type="checkbox"
                  checked={customNameMode}
                  onChange={() => setCustomNameMode(!customNameMode)}
                  className="h-4 w-4 text-pink-600"
                />
                <label htmlFor="customName" className="text-sm text-gray-700">
                  Use your own name to generate a story
                </label>
              </div>
            </div>

            <div>
              <Label>Gender</Label>
              <RadioGroup value={gender} onValueChange={setGender} className="flex space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="boy" id="boy" />
                  <Label htmlFor="boy">Boy</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="girl" id="girl" />
                  <Label htmlFor="girl">Girl</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="neutral" id="neutral" />
                  <Label htmlFor="neutral">Neutral</Label>
                </div>
              </RadioGroup>
            </div>

            <Button
              onClick={generateNames}
              disabled={loading || !theme}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Generating Names...</span>
                </div>
              ) : (
                "Generate Names"
              )}
            </Button>
          </div>

          {names.length > 0 && (
            <div className="mt-8 space-y-4">
              <h2 className="text-xl font-semibold">Suggested Names</h2>
              {names.map((nameData, index) => (
                <Card key={index} className="border-blue-100 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{nameData.name}</h3>
                      <HeartButton
                        isFavorite={isNameFavorited(nameData.name)}
                        onClick={() => toggleFavorite(nameData)}
                        size="md"
                      />
                    </div>
                    {nameData.summary && (
                      <div className="bg-pink-50 rounded-md p-3 text-sm border border-pink-100">
                        <BookOpen className="inline-block w-4 h-4 mr-1 text-gray-400" />
                        {nameData.summary}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites">
          <FavoritesList
            favorites={favorites}
            loading={favoritesLoading}
            onRefresh={loadFavoritesFromSupabase}
            onDelete={handleDeleteFavorite}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}