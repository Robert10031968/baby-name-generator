"use client";
// trigger redeploy
import { useState } from "react";
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
import { Separator } from "@/components/ui/separator";

interface NameWithMeaning {
  name: string;
  summary?: string;
}

export default function BabyNameGenerator() {
  const [theme, setTheme] = useState("");
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

    if (error) {
      console.error("❌ Failed to fetch favorites:", error.message);
    } else {
      console.log("✅ Fetched favorites:", data); // <-- ten log pojawi się w F12
      setFavorites(data || []);
    }
  } catch (err) {
    console.error("❌ Unexpected error:", err);
  } finally {
    setFavoritesLoading(false);
  }
};

useEffect(() => {
  loadFavoritesFromSupabase();
}, []);

  const generateNames = async () => {
    console.log("▶️ generateNames() wywołana. theme:", theme, "gender:", gender);
    if (!theme) return;
    setLoading(true);
    setNames([]);
    setError("");
  
    console.log("🛰️ Wysyłam fetch do AI...");
  
    try {
      const res = await fetch("https://babyname-agent-railway-production.up.railway.app/webhook/babyname", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ theme, gender, count: 10 }),
      });
  
      console.log("✅ Fetch zakończony:", res.status);
  
      if (!res.ok) {
        throw new Error(`Server responded with status: ${res.status}`);
      }
  
      const data = await res.json();
      console.log("📦 ODPOWIEDŹ Z API:", data);
  
      if (Array.isArray(data.namesWithMeanings)) {
        setNames(data.namesWithMeanings);
      } else {
        setError("Unexpected response format. Please try again.");
      }
    } catch (error) {
      console.error("❌ Błąd podczas generowania imion:", error);
      setError("Failed to generate names. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const saveFavorite = async (nameData: NameWithMeaning) => {
    try {
      const res = await fetch("/api/save-favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameData.name,
          gender,
          theme,
          user_email: "guest@example.com",
          description: nameData.summary || "",
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        toast({
          title: `"${nameData.name}" added to favorites!`,
        });
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

  return (
    <div className="max-w-xl mx-auto p-6 bg-gradient-to-b from-pink-50 to-blue-50 rounded-xl shadow-sm">
      <h1 className="text-3xl font-bold mb-4 text-pink-600">
        AI Baby Name Generator
      </h1>
      <p className="text-blue-700 mb-6">
        Discover perfect baby names with short insights. Add your favorites for
        more!
      </p>

      <Tabs defaultValue="generator" className="mb-6">
        <TabsList className="grid w-full grid-cols-2 bg-blue-100">
          <TabsTrigger
            value="generator"
            className="data-[state=active]:bg-pink-100 data-[state=active]:text-pink-700"
          >
            Generate Names
          </TabsTrigger>
          <TabsTrigger
            value="favorites"
            className="data-[state=active]:bg-pink-100 data-[state=active]:text-pink-700"
          >
            Favorites
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
            </div>

            <div>
              <Label>Gender</Label>
              <RadioGroup
                value={gender}
                onValueChange={setGender}
                className="flex space-x-4 mt-2"
              >
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
                <Card key={index} className="border-blue-100 hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-medium">{nameData.name}</h3>
                      <HeartButton
                        isFavorite={false}
                        onClick={() => saveFavorite(nameData)}
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
    onDelete={async (id: string) => {
      const { error } = await supabase.from("favorites").delete().eq("id", id);
      if (!error) {
        loadFavoritesFromSupabase();
      } else {
        console.error("❌ Failed to delete favorite:", error.message);
      }
    }}
    usingLocalStorage={false}
  />
</TabsContent>
      </Tabs>
    </div>
  );
}
