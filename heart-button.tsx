"use client"

import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

interface HeartButtonProps {
  isFavorite: boolean
  onClick: () => void
  size?: "sm" | "md" | "lg"
  className?: string
}

export function HeartButton({ isFavorite, onClick, size = "md", className = "" }: HeartButtonProps) {
  // Local state to track animation and favorite status
  const [isAnimating, setIsAnimating] = useState(false)
  const [localFavorite, setLocalFavorite] = useState(isFavorite)

  // Update local state when prop changes
  useEffect(() => {
    setLocalFavorite(isFavorite)
  }, [isFavorite])

  const handleClick = () => {
    setIsAnimating(true)
    setLocalFavorite(!localFavorite)
    onClick()

    // Reset animation state after animation completes
    setTimeout(() => {
      setIsAnimating(false)
    }, 300)
  }

  // Determine icon size based on prop
  const iconSize = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5"

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      title={localFavorite ? "Remove from favorites" : "Add to favorites"}
      className={`transition-all duration-300 hover:scale-110 hover:bg-pink-100 ${className}`}
    >
      <Heart
        className={`${iconSize} transition-all duration-300 ease-in-out
          ${localFavorite ? "fill-red-500 text-red-500" : "fill-transparent text-gray-500"}
          ${isAnimating ? "scale-110" : "scale-100"}`}
      />
      <span className="sr-only">{localFavorite ? "Remove from favorites" : "Add to favorites"}</span>
    </Button>
  )
}
