"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";
import { useGsapMobileMenu } from "@/hooks/useGsapMobileMenu";
import { cn } from "@/lib/utils";

const linkClass =
  "cursor-pointer font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 transition-colors duration-200 hover:text-foreground";

const SCROLL_THRESHOLD = 32;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const { mounted: menuMounted, overlayRef, panelRef } = useGsapMobileMenu({
    open: mobileOpen,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const closeMenu = () => setMobileOpen(false);
  const toggleMenu = () => setMobileOpen((open) => !open);

  const desktopBarSolid = scrolled && !mobileOpen;

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 hidden transition-[background-color,border-color,backdrop-filter] duration-500 ease-out lg:block",
          desktopBarSolid
            ? "border-b border-white/5 bg-background/85 backdrop-blur-md"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <nav
          className="mx-auto flex h-16 max-w-7xl items-center justify-end gap-7 px-12 xl:gap-10"
          aria-label="Main navigation"
        >
          <ul className="flex items-center gap-7 xl:gap-9">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <button
        type="button"
        className={cn(
          "fixed right-4 top-[max(1rem,env(safe-area-inset-top))] z-[60] cursor-pointer p-2 text-zinc-400 transition-colors duration-200 hover:text-foreground lg:hidden",
          mobileOpen && "text-foreground",
        )}
        aria-expanded={mobileOpen}
        aria-controls="mobile-nav"
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        onClick={toggleMenu}
      >
        {mobileOpen ? (
          <X className="h-6 w-6" strokeWidth={1.75} aria-hidden />
        ) : (
          <Menu className="h-6 w-6" strokeWidth={1.75} aria-hidden />
        )}
      </button>

      {menuMounted && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-40 bg-black/55 lg:hidden"
          style={prefersReducedMotion && !mobileOpen ? { display: "none" } : undefined}
        >
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 z-0 cursor-default"
            onClick={closeMenu}
          />

          <aside
            ref={panelRef}
            id="mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute right-0 top-0 z-10 flex h-dvh w-[min(100%,18.5rem)] flex-col overflow-hidden border-l border-white/10 bg-zinc-950 shadow-[-24px_0_64px_rgba(0,0,0,0.5)] sm:w-[min(88vw,20rem)]"
          >
            <ul className="flex flex-1 flex-col justify-center gap-0 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(5.5rem,env(safe-area-inset-top))]">
              {NAV_LINKS.map((link) => (
                <li key={link.href} data-menu-link>
                  <Link
                    href={link.href}
                    className="block cursor-pointer py-3.5 font-display text-3xl font-medium uppercase tracking-tight text-foreground transition-colors duration-300 hover:text-zinc-400 sm:py-4 sm:text-[2rem]"
                    onClick={closeMenu}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      )}
    </>
  );
}
