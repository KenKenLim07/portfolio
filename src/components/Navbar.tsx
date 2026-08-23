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

export function Navbar() {
  const [activeTab, setActiveTab] = useState<string>(NAV_LINKS[0]?.label ?? "Home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

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
    const sections = NAV_LINKS.map((link) =>
      document.getElementById(link.href.slice(1)),
    ).filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        const top = visible[0];
        if (!top) return;

        const match = NAV_LINKS.find((link) => link.href === `#${top.target.id}`);
        if (match) setActiveTab(match.label);
      },
      {
        rootMargin: "-35% 0px -45% 0px",
        threshold: [0, 0.15, 0.35, 0.55, 0.75, 1],
      },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
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
          onTabChange={setActiveTab}
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
