'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import React from "react";

export default function Navbar() {
  // Navigation items data
  const navItems = [
    { label: "about", href: "#" },
    { label: "pricing", href: "#" },
    { label: "contact", href: "#" },
    { label: "partners", href: "#" },
  ];

  return (
    <header className="container w-full py-3 flex items-center justify-between mt-[20px]">
      {/* Brand logo */}
      <Link href="/" className="font-bold text-white text-xl [font-family:'Outfit-Bold',Helvetica]">
        ecomHub
      </Link>

      {/* Navigation links */}
      <nav className="mx-auto">
        <ul className="flex gap-8">
          {navItems.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className="font-bold text-white text-xl [font-family:'Outfit-Bold',Helvetica] hover:text-white/80 transition-colors"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Login button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="h-[53px] w-32 rounded-[83px] border border-solid border-[#9392dc] bg-transparent font-bold text-white text-xl [font-family:'Outfit-Bold',Helvetica]"
      >
        login
      </motion.button>
    </header>
  );
}
