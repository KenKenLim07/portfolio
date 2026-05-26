"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { NAV_LINKS } from "@/lib/constants";
import { useGsapMobileMenu } from "@/hooks/useGsapMobileMenu";
import { useScrollSpin } from "@/hooks/useScrollSpin";
import { MobileMenuButton } from "@/components/MobileMenuButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

const linkClass =
  "cursor-pointer font-mono text-[10px] uppercase tracking-[0.22em] text-muted transition-colors duration-200 hover:text-foreground";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const { scrolled, rotation: burgerRotation } = useScrollSpin(mobileOpen);

  const { overlayRef, panelRef } = useGsapMobileMenu({
    open: mobileOpen,
  });

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
            ? "border-b border-border bg-background/85 backdrop-blur-md"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <nav
          className="mx-auto flex h-16 max-w-7xl items-center justify-end gap-5 px-12 xl:gap-8"
          aria-label="Main navigation"
        >
          <ThemeToggle />
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
          "fixed right-4 top-[max(1rem,env(safe-area-inset-top))] z-[60] cursor-pointer p-2 transition-colors duration-200 lg:hidden",
          mobileOpen
            ? "mobile-menu-chrome hover:text-[var(--menu-fg)]"
            : "text-muted hover:text-foreground",
        )}
        aria-expanded={mobileOpen}
        aria-controls="mobile-nav"
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        onClick={toggleMenu}
      >
        <MobileMenuButton open={mobileOpen} scrollRotation={burgerRotation} />
      </button>

      <div
        ref={overlayRef}
        className="mobile-menu-overlay fixed inset-0 z-40 lg:hidden"
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
          className="mobile-menu-panel absolute right-0 top-0 z-10 flex h-dvh w-[min(100%,18.5rem)] flex-col overflow-hidden border-l sm:w-[min(88vw,20rem)]"
        >
          <div className="absolute left-6 top-[max(1rem,env(safe-area-inset-top))] z-20">
            <ThemeToggle className="mobile-menu-chrome hover:text-[var(--menu-muted)]" />
          </div>
          <ul className="flex flex-1 flex-col justify-center gap-0 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(6.5rem,env(safe-area-inset-top))]">
            {NAV_LINKS.map((link) => (
              <li key={link.href} data-menu-link>
                <Link
                  href={link.href}
                  className="mobile-menu-link block cursor-pointer py-3.5 font-display text-3xl font-medium uppercase tracking-tight transition-colors duration-300 sm:py-4 sm:text-[2rem]"
                  onClick={closeMenu}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  );
}
