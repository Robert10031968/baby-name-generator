"use client";

import BabyNameGenerator from "@/baby-name-generator";

<img src="/certificate-background.png" style={{ display: 'none' }} alt="Preload Background" />

export default function Home() {
  return (
    <main className="min-h-screen py-12 flex flex-col items-center justify-start gap-8">
      <BabyNameGenerator />
    </main>
  );
}
