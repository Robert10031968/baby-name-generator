"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Loader2, AlertCircle, Globe, BookOpen } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FavoritesList } from "./favorites-list"
import { HeartButton } from "./heart-button"
import { toast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"

// Type for a name with meaning and origin
interface NameWithMeaning {
  name: string
  meaning: string
  origin: string
  informativeDescription?: string
  poeticDescription?: string
  description?: string // New unified description field
}

// Type for a favorite name
interface Favorite {
  id: string
  name: string
  gender?: string
  theme?: string
  created_at: string
  user_email?: string
  meaning?: string
  origin?: string
  informativeDescription?: string
  poeticDescription?: string
  description?: string // New unified description field
}

export default function BabyNameGenerator() {
  const [theme, setTheme] = useState("")
  const [gender, setGender] = useState("neutral")
  const [namesWithMeanings, setNamesWithMeanings] = useState<NameWithMeaning[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("generator")
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loadingFavorites, setLoadingFavorites] = useState(false)
  const [usingLocalStorage, setUsingLocalStorage] = useState(false)

  // Default guest email for database constraints
  const guestEmail = "guest@example.com"

  // Fetch favorites on initial load
  useEffect(() => {
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    try {
      setLoadingFavorites(true)

      // Try to fetch from API first
      try {
        const res = await fetch("/api/get-favorites")
        const data = await res.json()

        if (Array.isArray(data.favorites)) {
          // Ensure all favorites have meaning and origin
          const processedFavorites = data.favorites.map((fav) => ({
            ...fav,
            meaning: fav.meaning || "Information not available",
            origin: fav.origin || "Unknown",
            informativeDescription: fav.informativeDescription || null,
            poeticDescription: fav.poeticDescription || null,
            description: fav.description || null,
          }))

          setFavorites(processedFavorites)
          setUsingLocalStorage(false)
          return
        }
      } catch (apiError) {
        console.warn("API fetch failed, falling back to localStorage:", apiError)
      }

      // Fallback to localStorage if API fails
      if (typeof window !== "undefined") {
        const storedFavorites = localStorage.getItem("babyNameFavorites")
        if (storedFavorites) {
          const parsedFavorites = JSON.parse(storedFavorites)

          // Ensure all favorites have meaning and origin
          const processedFavorites = parsedFavorites.map((fav: Favorite) => ({
            ...fav,
            meaning: fav.meaning || "Information not available",
            origin: fav.origin || "Unknown",
            informativeDescription: fav.informativeDescription || null,
            poeticDescription: fav.poeticDescription || null,
            description: fav.description || null,
          }))

          setFavorites(processedFavorites)
        } else {
          setFavorites([])
        }
        setUsingLocalStorage(true)
      }
    } catch (error) {
      console.error("Failed to fetch favorites:", error)
      setFavorites([])
    } finally {
      setLoadingFavorites(false)
    }
  }

  const generateNames = async () => {
    if (!theme) return

    setLoading(true)
    setNamesWithMeanings([])
    setError("")

    try {
      const res = await fetch("/api/generate-names", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, gender }),
      })

      if (!res.ok) {
        throw new Error(`Server responded with status: ${res.status}`)
      }

      const data = await res.json()

      // Check if we have namesWithMeanings in the response
      if (Array.isArray(data.namesWithMeanings)) {
        // For each name, fetch a detailed description
        const namesWithDescriptions = await Promise.all(
          data.namesWithMeanings.map(async (nameData) => {
            try {
              const descRes = await fetch("/api/name-description", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: nameData.name }),
              })

              if (descRes.ok) {
                const descData = await descRes.json()
                return {
                  ...nameData,
                  description: descData.description,
                }
              }
              return nameData
            } catch (error) {
              console.error(`Failed to fetch description for ${nameData.name}:`, error)
              return nameData
            }
          }),
        )

        setNamesWithMeanings(namesWithDescriptions)
      } else if (Array.isArray(data.names)) {
        // Fallback to old format if needed
        setNamesWithMeanings(
          data.names.map((name) => ({
            name,
            meaning: "Information not available",
            origin: "Unknown",
          })),
        )
      } else {
        setNamesWithMeanings([])
        setError("No names were generated. Try a different theme or gender.")
      }
    } catch (error) {
      console.error("Failed to generate names:", error)
      setError("Failed to generate names. Please try again.")
      setNamesWithMeanings([])
    } finally {
      setLoading(false)
    }
  }

  const saveFavorite = async (nameData: NameWithMeaning) => {
    try {
      // Create a new favorite object with all data
      const newFavorite: Favorite = {
        id: crypto.randomUUID(),
        name: nameData.name,
        gender,
        theme,
        created_at: new Date().toISOString(),
        user_email: guestEmail,
        meaning: nameData.meaning || "Information not available",
        origin: nameData.origin || "Unknown",
        informativeDescription: nameData.informativeDescription || null,
        poeticDescription: nameData.poeticDescription || null,
        description: nameData.description || null,
      }

      // If we're already using localStorage, save directly to it
      if (usingLocalStorage) {
        saveToLocalStorage(newFavorite)
        return
      }

      // Otherwise try to save to the API - only send basic fields first
      const res = await fetch("/api/save-favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameData.name,
          gender,
          theme,
          email: guestEmail,
          // We'll try to send meaning and origin, but the API will handle if they don't exist
          meaning: nameData.meaning || "Information not available",
          origin: nameData.origin || "Unknown",
          informativeDescription: nameData.informativeDescription || null,
          poeticDescription: nameData.poeticDescription || null,
          description: nameData.description || null,
        }),
      })

      const data = await res.json()

      // Check for schema mismatch error
      if (!res.ok) {
        if (res.status === 422 && data.fallbackToLocal) {
          console.warn("Schema mismatch detected, falling back to localStorage")
          saveToLocalStorage(newFavorite)
          setUsingLocalStorage(true)
          return
        }

        throw new Error(data.error || "Failed to save favorite")
      }

      if (data.success) {
        toast({
          title: "Name saved!",
          description: `"${nameData.name}" has been added to your favorites.`,
        })

        // Refresh favorites list
        fetchFavorites()
      } else if (data.error) {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Failed to save favorite:", error)

      // As a last resort, save to localStorage
      try {
        const newFavorite: Favorite = {
          id: crypto.randomUUID(),
          name: nameData.name,
          gender,
          theme,
          created_at: new Date().toISOString(),
          user_email: guestEmail,
          meaning: nameData.meaning || "Information not available",
          origin: nameData.origin || "Unknown",
          informativeDescription: nameData.informativeDescription || null,
          poeticDescription: nameData.poeticDescription || null,
          description: nameData.description || null,
        }

        saveToLocalStorage(newFavorite)
      } catch (localError) {
        toast({
          title: "Error",
          description: "Failed to save favorite. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  // Helper function to save to localStorage
  const saveToLocalStorage = (newFavorite: Favorite) => {
    // Make sure meaning and origin are included
    const favoriteWithDetails = {
      ...newFavorite,
      meaning: newFavorite.meaning || "Information not available",
      origin: newFavorite.origin || "Unknown",
    }

    const updatedFavorites = [...favorites, favoriteWithDetails]
    setFavorites(updatedFavorites)
    localStorage.setItem("babyNameFavorites", JSON.stringify(updatedFavorites))
    setUsingLocalStorage(true)

    toast({
      title: "Name saved locally!",
      description: `"${newFavorite.name}" has been saved to your browser's local storage.`,
    })
  }

  const removeFavorite = (name: string) => {
    // Find the favorite with matching name and gender
    const favoriteToRemove = favorites.find((fav) => fav.name === name && fav.gender === gender)

    if (!favoriteToRemove) return

    // Remove from favorites
    deleteFavorite(favoriteToRemove.id)

    toast({
      title: "Name removed",
      description: `"${name}" has been removed from your favorites.`,
    })
  }

  const deleteFavorite = async (id: string): Promise<void> => {
    // If using localStorage, delete directly from it
    if (usingLocalStorage) {
      const updatedFavorites = favorites.filter((fav) => fav.id !== id)
      setFavorites(updatedFavorites)
      localStorage.setItem("babyNameFavorites", JSON.stringify(updatedFavorites))

      toast({
        title: "Name removed",
        description: "The name has been removed from your favorites.",
      })
      return
    }

    // Otherwise delete via API
    try {
      // Optimistic update - remove from UI immediately
      const updatedFavorites = favorites.filter((fav) => fav.id !== id)
      setFavorites(updatedFavorites)

      // Call the API to delete from database
      const res = await fetch(`/api/delete-favorite?id=${id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        // If API call fails, revert the UI change
        const data = await res.json()
        throw new Error(data.error || "Failed to delete favorite")
      }

      // Show success toast
      toast({
        title: "Name removed",
        description: "The name has been removed from your favorites.",
      })
    } catch (error) {
      console.error("Failed to delete favorite:", error)

      // Revert UI by re-fetching favorites
      fetchFavorites()

      toast({
        title: "Error",
        description: "Failed to remove favorite. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-gradient-to-b from-pink-50 to-blue-50 rounded-xl shadow-sm">
      <h1 className="text-3xl font-bold mb-4 text-pink-600">AI Baby Name Generator</h1>
      <p className="text-blue-700 mb-6">Discover perfect baby names and save your favorites.</p>

      {usingLocalStorage && (
        <Alert className="mb-6 bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Using browser storage for favorites. Your saved names will only be available on this device.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
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
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            <div>
              <Label htmlFor="theme" className="block mb-2">
                Theme or Inspiration
              </Label>
              <Input
                id="theme"
                placeholder="e.g., nature, literary, ancient, modern"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full border-blue-200 focus:border-pink-300 focus:ring-pink-200"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Try themes like: nature, literary characters, ancient mythology, or modern trends
              </p>
            </div>

            <div>
              <Label className="block mb-2">Gender</Label>
              <RadioGroup value={gender} onValueChange={setGender} className="flex space-x-4 text-blue-700">
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
                  <Label htmlFor="neutral">Gender Neutral</Label>
                </div>
              </RadioGroup>
            </div>

            <Button
              onClick={generateNames}
              disabled={loading || !theme}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Names...
                </>
              ) : (
                "Generate Names"
              )}
            </Button>
          </div>

          {namesWithMeanings.length > 0 && (
            <div className="mt-8 space-y-4">
              <h2 className="text-xl font-semibold">
                {gender === "boy" ? "Boy" : gender === "girl" ? "Girl" : "Gender Neutral"} Names - {theme} Theme
              </h2>
              <div className="grid gap-4">
                {namesWithMeanings.map((nameData, index) => {
                  // Check if this name is in favorites
                  const isFavorite = favorites.some((fav) => fav.name === nameData.name && fav.gender === gender)

                  return (
                    <Card
                      key={index}
                      className="overflow-hidden border-blue-100 hover:shadow-md transition-shadow duration-300"
                    >
                      <CardContent className="p-0">
                        <div className="flex justify-between items-center p-4 bg-blue-50">
                          <h3 className="text-lg font-medium">{nameData.name}</h3>
                          <HeartButton
                            isFavorite={isFavorite}
                            onClick={() => (isFavorite ? removeFavorite(nameData.name) : saveFavorite(nameData))}
                          />
                        </div>
                        <div className="p-4">
                          {nameData.description ? (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-500 flex items-center mb-2">
                                <BookOpen className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                About this name
                              </h4>
                              <div className="bg-pink-50 rounded-md p-3 text-sm border border-pink-100">
                                <div className="prose prose-sm max-w-none text-gray-700">
                                  {nameData.description.split("\n").map((paragraph, i) => (
                                    <p key={i} className="mb-2">
                                      {paragraph}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-500 flex items-center mb-2">
                                <Globe className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                Meaning & Origin
                              </h4>
                              <div className="bg-pink-50 rounded-md p-3 text-sm border border-pink-100">
                                <p className="mb-2">{nameData.meaning}</p>
                                <Separator className="my-2 bg-pink-200" />
                                <p className="text-xs text-gray-600">
                                  <span className="font-semibold">Origin:</span> {nameData.origin}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites">
          <FavoritesList
            favorites={favorites}
            loading={loadingFavorites}
            onRefresh={fetchFavorites}
            onDelete={deleteFavorite}
            usingLocalStorage={usingLocalStorage}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
