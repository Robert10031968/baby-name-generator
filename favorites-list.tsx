"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, Trash2, Heart, BookOpen, ChevronUp, ChevronDown, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"

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
  description?: string
}

interface FavoritesListProps {
  favorites: Favorite[]
  loading: boolean
  onRefresh: () => void
  onDelete: (id: string) => Promise<void>
  usingLocalStorage: boolean
}

export function FavoritesList({ favorites, loading, onRefresh, onDelete, usingLocalStorage }: FavoritesListProps) {
  const [refreshing, setRefreshing] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [loadingDescriptions, setLoadingDescriptions] = useState<Record<string, boolean>>({})
  const [descriptionErrors, setDescriptionErrors] = useState<Record<string, string>>({})
  const [favoritesState, setFavorites] = useState<Favorite[]>(favorites)

  // Initialize expanded state for all items
  useEffect(() => {
    const initialExpandedState: Record<string, boolean> = {}

    favorites.forEach((favorite) => {
      initialExpandedState[favorite.id] = false
    })

    setExpandedItems(initialExpandedState)
  }, [favorites])

  const handleRefresh = async () => {
    setRefreshing(true)
    await onRefresh()
    setRefreshing(false)
  }

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Helper function to check if a favorite has a description
  const hasDescription = (favorite: Favorite) => {
    return favorite.description || favorite.informativeDescription || favorite.poeticDescription || favorite.meaning
  }

  // Helper function to get the best available description
  const getDescription = (favorite: Favorite) => {
    // Prefer the new unified description if available
    if (favorite.description) {
      return favorite.description
    }

    // Fall back to older description formats if needed
    if (favorite.informativeDescription || favorite.poeticDescription) {
      return favorite.informativeDescription || favorite.poeticDescription
    }

    // Last resort: use basic meaning and origin
    return `${favorite.meaning || "No meaning available"}. Origin: ${favorite.origin || "Unknown"}`
  }

  const fetchDescriptionForFavorite = async (favorite: Favorite) => {
    if (!favorite.name || loadingDescriptions[favorite.id]) return

    try {
      setLoadingDescriptions((prev) => ({ ...prev, [favorite.id]: true }))
      setDescriptionErrors((prev) => ({ ...prev, [favorite.id]: "" }))

      const res = await fetch("/api/name-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: favorite.name }),
      })

      if (!res.ok) {
        throw new Error("Failed to fetch description")
      }

      const data = await res.json()
      const description = data.description

      // Update the favorite with the new description
      const updatedFavorite = {
        ...favorite,
        description,
      }

      // If using localStorage, update it directly
      if (usingLocalStorage) {
        const updatedFavorites = favorites.map((fav) => (fav.id === favorite.id ? updatedFavorite : fav))
        localStorage.setItem("babyNameFavorites", JSON.stringify(updatedFavorites))
        onRefresh() // Refresh to show the updated data
      } else {
        // Otherwise update in database - ONLY send id, name and description
        try {
          const updateRes = await fetch("/api/update-description", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: favorite.id,
              description,
            }),
          })

          if (!updateRes.ok) {
            const errorData = await updateRes.json()
            throw new Error(errorData.error || "Failed to save description")
          }

          // Refresh to show the updated data
          onRefresh()
        } catch (error) {
          console.error("Failed to save description to database:", error)
          setDescriptionErrors((prev) => ({
            ...prev,
            [favorite.id]: error.message || "Failed to save description",
          }))

          // Still update the UI optimistically
          const updatedFavorites = favorites.map((fav) => (fav.id === favorite.id ? { ...fav, description } : fav))
          setFavorites(updatedFavorites)
        }
      }
    } catch (error) {
      console.error("Failed to fetch description:", error)
      setDescriptionErrors((prev) => ({
        ...prev,
        [favorite.id]: "Failed to fetch description",
      }))
    } finally {
      setLoadingDescriptions((prev) => ({ ...prev, [favorite.id]: false }))
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
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
    )
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
        {favorites.map((favorite) => (
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
                          {favorite.gender === "boy" ? "Boy" : favorite.gender === "girl" ? "Girl" : "Neutral"}
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
                      setDeletingId(favorite.id)
                      await onDelete(favorite.id).finally(() => {
                        setDeletingId(null)
                      })
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

                        {favorite.description ? (
                          // Display the description with preserved line breaks
                          <div className="prose prose-sm max-w-none text-gray-700">
                            {favorite.description.split("\n").map((paragraph, i) => (
                              <p key={i} className="mb-2">
                                {paragraph}
                              </p>
                            ))}
                          </div>
                        ) : favorite.informativeDescription || favorite.poeticDescription ? (
                          // Fall back to old format if available
                          <div className="prose prose-sm max-w-none text-gray-700">
                            {(favorite.informativeDescription || favorite.poeticDescription || "")
                              .split("\n")
                              .map((paragraph, i) => (
                                <p key={i} className="mb-2">
                                  {paragraph}
                                </p>
                              ))}
                          </div>
                        ) : (
                          // If no description is available, show basic info and fetch button
                          <div>
                            <p className="mb-3">
                              <span className="font-semibold">Meaning:</span>{" "}
                              {favorite.meaning || "Information not available"}
                            </p>
                            <p className="mb-4">
                              <span className="font-semibold">Origin:</span> {favorite.origin || "Unknown"}
                            </p>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => fetchDescriptionForFavorite(favorite)}
                              disabled={loadingDescriptions[favorite.id]}
                              className="w-full mt-2"
                            >
                              {loadingDescriptions[favorite.id] ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Fetching description...
                                </>
                              ) : (
                                <>
                                  <Download className="mr-2 h-4 w-4" />
                                  Get detailed description
                                </>
                              )}
                            </Button>

                            {descriptionErrors[favorite.id] && (
                              <p className="text-red-500 text-xs mt-2">{descriptionErrors[favorite.id]}</p>
                            )}
                          </div>
                        )}
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
  )
}
