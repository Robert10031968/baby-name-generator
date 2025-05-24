"use client";

import BabyNameGenerator from "@/baby-name-generator";


export default function Home() {
  return (
    <main className="min-h-screen py-12 flex flex-col items-center justify-start gap-8">
      <BabyNameGenerator />
    </main>
  );
}
