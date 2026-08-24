"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  FileText,
  Home,
  Layers,
  Mail,
  Quote,
  User,
  type LucideIcon,
} from "lucide-react";
import { NavBar, type NavItem } from "@/components/ui/tubelight-navbar";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  MenuBlackholeCore,
  MenuBlackholeDisk,
  ScrollBurgerIcon,
} from "@/components/ui/ScrollBurgerIcon";
import { NAV_LINKS, ENABLE_SUN_MODE, SITE } from "@/lib/constants";
import { useGsapMobileMenu } from "@/hooks/useGsapMobileMenu";
import { cn } from "@/lib/utils";

const NAV_ICONS: Record<(typeof NAV_LINKS)[number]["label"], LucideIcon> = {
  Home,
  About: User,
  Projects: Briefcase,
  "Tech Stack": Layers,
  Testimonials: Quote,
  Contact: Mail,
};

/** Spy line below the fixed nav — looser than `scroll-mt-28` so hash landings count. */
function getSectionSpyOffset(): number {
  return Math.round(window.innerHeight * 0.28);
}

function getActiveSectionLabel(): string {
  const spyY = getSectionSpyOffset();
  let current = NAV_LINKS[0]?.label ?? "Home";

  for (const link of NAV_LINKS) {
    const el = document.getElementById(link.href.slice(1));
    if (!el) continue;
    if (el.getBoundingClientRect().top <= spyY) current = link.label;
  }

  return current;
}

export function Navbar() {
  const [activeTab, setActiveTab] = useState<string>(NAV_LINKS[0]?.label ?? "Home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const pendingTabRef = useRef<string | null>(null);
  const pendingFallbackRef = useRef<number>(0);

  const items = useMemo<NavItem[]>(
    () => [
      ...NAV_LINKS.map((link) => ({
        name: link.label,
        url: link.href,
        icon: NAV_ICONS[link.label],
      })),
      {
        name: "Resume",
        url: SITE.resumeUrl,
        icon: FileText,
        external: true,
      },
    ],
    [],
  );

  const { overlayRef, panelRef, diskRef, coreRef, flightRef } =
    useGsapMobileMenu({
      open: mobileOpen,
      triggerRef: menuTriggerRef,
    });

  useEffect(() => {
    let ticking = false;

    const clearPending = () => {
      pendingTabRef.current = null;
      if (pendingFallbackRef.current) {
        window.clearTimeout(pendingFallbackRef.current);
        pendingFallbackRef.current = 0;
      }
    };

    const syncActive = () => {
      ticking = false;
      if (pendingTabRef.current) return;
      const next = getActiveSectionLabel();
      setActiveTab((prev) => (prev === next ? prev : next));
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(syncActive);
    };

    const onScrollEnd = () => {
      clearPending();
      syncActive();
    };

    syncActive();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("scrollend", onScrollEnd);
    return () => {
      clearPending();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scrollend", onScrollEnd);
    };
  }, []);

  const onTabChange = (name: string) => {
    setActiveTab(name);
    if (name === "Resume") return;

    pendingTabRef.current = name;
    if (pendingFallbackRef.current) {
      window.clearTimeout(pendingFallbackRef.current);
    }
    pendingFallbackRef.current = window.setTimeout(() => {
      pendingTabRef.current = null;
      pendingFallbackRef.current = 0;
      setActiveTab(getActiveSectionLabel());
    }, 4000);
  };

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

  return (
    <>
      <div className="hidden lg:block">
        {ENABLE_SUN_MODE ? (
          <div className="fixed right-6 top-6 z-[60]">
            <ThemeToggle />
          </div>
        ) : null}
        <NavBar
          items={items}
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
      </div>

      <div ref={diskRef} className="pointer-events-none fixed z-[64] lg:hidden">
        <MenuBlackholeDisk />
      </div>
      <div
        ref={flightRef}
        className="pointer-events-none fixed inset-0 z-[65] overflow-visible lg:hidden"
        aria-hidden
      />
      <div ref={coreRef} className="pointer-events-none fixed z-[66] lg:hidden">
        <MenuBlackholeCore />
      </div>

      <button
        ref={menuTriggerRef}
        type="button"
        className={cn(
          "fixed right-4 top-[max(1rem,env(safe-area-inset-top))] z-[70] cursor-pointer p-2.5 transition-colors duration-200 lg:hidden",
          mobileOpen
            ? "text-[var(--menu-fg)] hover:text-[var(--menu-muted)]"
            : "text-foreground hover:text-muted",
        )}
        aria-expanded={mobileOpen}
        aria-controls="mobile-nav"
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        onClick={toggleMenu}
      >
        <ScrollBurgerIcon
          className="h-7 w-7"
          strokeWidth={2.4}
          resetDelayMs={300}
          disabled={mobileOpen}
        />
      </button>

      <div
        ref={overlayRef}
        className="mobile-menu-overlay fixed inset-0 z-40 lg:hidden"
        aria-hidden={!mobileOpen}
        onClick={closeMenu}
      />

      <aside
        ref={panelRef}
        id="mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!mobileOpen}
        className="mobile-menu-panel fixed top-0 right-0 z-50 flex h-dvh w-[min(100%,18.5rem)] flex-col overflow-hidden sm:w-[min(88vw,20rem)] lg:hidden"
      >
        {ENABLE_SUN_MODE ? (
          <div
            className="absolute left-6 top-[max(1rem,env(safe-area-inset-top))] z-20"
            data-menu-chrome
          >
            <ThemeToggle className="mobile-menu-chrome text-[var(--menu-fg)] hover:text-[var(--menu-muted)]" />
          </div>
        ) : null}

        <ul className="flex list-none flex-1 flex-col justify-center gap-0 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(6.5rem,env(safe-area-inset-top))]">
          {NAV_LINKS.map((link) => (
            <li key={link.href} data-menu-link className="list-none">
              <Link
                href={link.href}
                className="mobile-menu-link block cursor-pointer py-3.5 font-display text-3xl font-medium uppercase tracking-tight text-[var(--menu-fg)] transition-colors duration-300 hover:text-[var(--menu-muted)] sm:py-4 sm:text-[2rem]"
                onClick={closeMenu}
                tabIndex={mobileOpen ? 0 : -1}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li data-menu-link className="list-none">
            <a
              href={SITE.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View resume (PDF)"
              className="mobile-menu-link block cursor-pointer py-3.5 font-display text-3xl font-medium uppercase tracking-tight text-[var(--menu-fg)] transition-colors duration-300 hover:text-[var(--menu-muted)] sm:py-4 sm:text-[2rem]"
              onClick={closeMenu}
              tabIndex={mobileOpen ? 0 : -1}
            >
              Resume
            </a>
          </li>
        </ul>
      </aside>
    </>
  );
}
