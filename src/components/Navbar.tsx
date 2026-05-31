"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";
import { useGsapMobileMenu } from "@/hooks/useGsapMobileMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ScrollBurgerIcon } from "@/components/ui/ScrollBurgerIcon";
import { cn } from "@/lib/utils";

const linkClass =
  "cursor-pointer font-mono text-[10px] uppercase tracking-[0.22em] text-muted transition-colors duration-200 hover:text-foreground";

const SCROLL_THRESHOLD = 32;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { overlayRef, panelRef } = useGsapMobileMenu({
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
          "fixed right-4 top-[max(1rem,env(safe-area-inset-top))] z-[60] cursor-pointer p-2.5 transition-colors duration-200 lg:hidden",
          mobileOpen
            ? "text-[var(--menu-fg)] hover:text-[var(--menu-muted)]"
            : "text-foreground hover:text-muted",
        )}
        aria-expanded={mobileOpen}
        aria-controls="mobile-nav"
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        onClick={toggleMenu}
      >
        {mobileOpen ? (
          <X className="h-7 w-7" strokeWidth={2.2} aria-hidden />
        ) : (
          <ScrollBurgerIcon
            className="h-7 w-7"
            strokeWidth={2.4}
            resetDelayMs={300}
            disabled={mobileOpen}
          />
        )}
      </button>

      <div
        ref={overlayRef}
        className="mobile-menu-overlay fixed inset-0 z-40 lg:hidden"
        style={{ display: "none" }}
        aria-hidden={!mobileOpen}
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
            <ThemeToggle className="mobile-menu-chrome text-[var(--menu-fg)] hover:text-[var(--menu-muted)]" />
          </div>
          <ul className="flex flex-1 flex-col justify-center gap-0 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(6.5rem,env(safe-area-inset-top))]">
            {NAV_LINKS.map((link) => (
              <li key={link.href} data-menu-link>
                <Link
                  href={link.href}
                  className="mobile-menu-link block cursor-pointer py-3.5 font-display text-3xl font-medium uppercase tracking-tight text-[var(--menu-fg)] transition-colors duration-300 hover:text-[var(--menu-muted)] sm:py-4 sm:text-[2rem]"
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
