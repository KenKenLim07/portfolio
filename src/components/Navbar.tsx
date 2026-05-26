"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { NAV_LINKS, SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 md:px-6 md:pt-5">
      <nav
        className={cn(
          "radius-panel relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-3 transition-all duration-300 md:px-6",
          scrolled || mobileOpen
            ? "glass-solid"
            : "bg-transparent",
        )}
        aria-label="Main navigation"
      >
        <Link
          href="#home"
          className="font-display text-lg font-semibold tracking-tight text-foreground transition-colors duration-200 hover:text-zinc-300 cursor-pointer"
        >
          {SITE.name}
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="radius-chip cursor-pointer px-4 py-2 text-sm text-muted transition-colors duration-200 hover:bg-white/5 hover:text-foreground"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="#contact"
          className="radius-control hidden cursor-pointer border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-foreground transition-colors duration-200 hover:border-white/25 hover:bg-white/10 lg:inline-flex"
        >
          Get in touch
        </Link>

        <button
          type="button"
          className="radius-chip cursor-pointer p-2 text-foreground transition-colors duration-200 hover:bg-white/10 lg:hidden"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 top-0 z-0 bg-black/70 backdrop-blur-sm lg:hidden"
              aria-hidden
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="glass-solid radius-panel relative z-10 mx-auto mt-3 max-w-7xl p-4 lg:hidden"
            >
            <ul className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="radius-control block cursor-pointer px-4 py-3 text-sm text-muted transition-colors duration-200 hover:bg-white/5 hover:text-foreground"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="mt-2 border-t border-white/10 pt-2">
                <Link
                  href="#contact"
                  className="radius-control block cursor-pointer bg-foreground px-4 py-3 text-center text-sm font-medium text-background transition-colors duration-200 hover:bg-zinc-200"
                  onClick={() => setMobileOpen(false)}
                >
                  Get in touch
                </Link>
              </li>
            </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
