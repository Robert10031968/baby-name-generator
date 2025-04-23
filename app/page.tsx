"use client";

import BabyNameGenerator from "@/baby-name-generator";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen py-12">
      <BabyNameGenerator />
    </main>
  );
}
