'use client'

import { motion } from 'framer-motion'
import React from "react";

export default function Hero() {
  return (
    <section className="container flex flex-col md:flex-row items-center justify-between mt-[50px]">
      <div className="flex flex-col max-w-[532px] space-y-6">
        <h1 className="font-main-heading font-[number:var(--main-heading-font-weight)] text-white text-[clamp(2rem,5vw,var(--main-heading-font-size))] tracking-[var(--main-heading-letter-spacing)] leading-[var(--main-heading-line-height)] [font-style:var(--main-heading-font-style)]">
          Sell Smarter Across Marketplaces
        </h1>

        <p className="font-body-text font-[number:var(--body-text-font-weight)] text-white text-[clamp(1rem,2.5vw,var(--body-text-font-size))] tracking-[var(--body-text-letter-spacing)] leading-[var(--body-text-line-height)] [font-style:var(--body-text-font-style)] max-w-[373px]">
          Automate, track, and grow your online business from one powerful
          platform.
        </p>

        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-fit h-auto px-[clamp(2rem,4vw,43px)] py-[clamp(1rem,2vw,26px)] bg-[#8e8edb] rounded-[83px] hover:bg-[#7a7ac7] transition-colors"
        >
          <span className="font-sub-heading font-[number:var(--sub-heading-font-weight)] text-white text-[clamp(0.875rem,1.5vw,var(--sub-heading-font-size))] tracking-[var(--sub-heading-letter-spacing)] leading-[var(--sub-heading-line-height)] whitespace-nowrap [font-style:var(--sub-heading-font-style)]">
            START FOR FREE
          </span>
        </motion.button>
      </div>

      <div className="w-full max-w-[532px] aspect-[532/566]">
        <img
          src="/homehero.png"
          alt="Dashboard illustration"
          className="w-full h-full object-contain"
        />
      </div>
    </section>
  );
}
