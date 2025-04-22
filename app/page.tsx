"use client"

import BabyNameGenerator from "@/baby-name-generator"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="min-h-screen py-12">
      <BabyNameGenerator />

      {/* Hidden button for debugging - only visible in development */}
      {process.env.NODE_ENV === "development" && (
        <div className="max-w-xl mx-auto mt-8 p-4 border-t">
          <p className="text-xs text-muted-foreground mb-2">Developer Tools:</p>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const res = await fetch("/api/create-table")
                const data = await res.json()
                alert(data.message || "Table creation attempted")
              } catch (error) {
                console.error("Error creating table:", error)
                alert("Error creating table")
              }
            }}
          >
            Initialize Database
          </Button>
        </div>
      )}
    </main>
  )
}
