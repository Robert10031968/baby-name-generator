"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center space-x-3">
          <Image src="/nomena_logo.png" alt="Nomena Logo" width={40} height={40} />
          <span className="text-xl font-bold text-pink-600">nomena.io</span>
        </div>

        {/* Desktop menu */}
        <nav className="hidden md:flex space-x-6 text-sm text-gray-600">
          <Link href="#">Home</Link>
          <Link href="#favorites">Favorites</Link>
          <Link href="#how-it-works">How it works</Link>
          <Link href="#about">About</Link>
        </nav>

        {/* Mobile burger icon */}
        <button
          className="md:hidden text-xl text-gray-600"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden px-6 pb-4 space-y-2 text-sm text-gray-700">
          <Link href="#" onClick={() => setIsOpen(false)}>Home</Link>
          <Link href="#favorites" onClick={() => setIsOpen(false)}>Favorites</Link>
          <Link href="#how-it-works" onClick={() => setIsOpen(false)}>How it works</Link>
          <Link href="#about" onClick={() => setIsOpen(false)}>About</Link>
        </div>
      )}
    </header>
  );
}