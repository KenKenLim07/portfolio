"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";
import { easeDrawer } from "@/lib/motion";
import { cn } from "@/lib/utils";

const linkClass =
  "cursor-pointer font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 transition-colors duration-200 hover:text-foreground";

const SCROLL_THRESHOLD = 32;

const DRAWER_RADIUS_ENTER = 56;
const DRAWER_RADIUS_REST = 8;

const drawerTransition = { duration: 0.72, ease: easeDrawer };

const drawerPanel = {
  hidden: {
    x: "100%",
    borderTopLeftRadius: DRAWER_RADIUS_ENTER,
    borderBottomLeftRadius: DRAWER_RADIUS_ENTER,
  },
  visible: {
    x: 0,
    borderTopLeftRadius: DRAWER_RADIUS_REST,
    borderBottomLeftRadius: DRAWER_RADIUS_REST,
    transition: drawerTransition,
  },
  exit: {
    x: "100%",
    borderTopLeftRadius: DRAWER_RADIUS_ENTER,
    borderBottomLeftRadius: DRAWER_RADIUS_ENTER,
    transition: { duration: 0.55, ease: easeDrawer },
  },
};

const drawerBackdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: easeDrawer } },
  exit: { opacity: 0, transition: { duration: 0.32, ease: easeDrawer } },
};

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  /** Bumps on each open so drawer + links remount and re-animate cleanly */
  const [menuEpoch, setMenuEpoch] = useState(0);
  const prefersReducedMotion = useReducedMotion();

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

  const toggleMenu = () => {
    setMobileOpen((open) => {
      if (!open) setMenuEpoch((n) => n + 1);
      return !open;
    });
  };

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

      <AnimatePresence mode="wait">
        {mobileOpen && (
          <motion.div
            key={menuEpoch}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            variants={prefersReducedMotion ? undefined : drawerBackdrop}
            initial={prefersReducedMotion ? false : "hidden"}
            animate={prefersReducedMotion ? undefined : "visible"}
            exit={prefersReducedMotion ? undefined : "exit"}
          >
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 z-0 cursor-default"
              onClick={closeMenu}
            />

            <motion.aside
              id="mobile-nav"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className="absolute right-0 top-0 z-10 flex h-dvh w-[min(100%,18.5rem)] flex-col overflow-hidden border-l border-white/10 bg-zinc-950 shadow-[-24px_0_64px_rgba(0,0,0,0.45)] sm:w-[min(88vw,20rem)]"
              style={
                prefersReducedMotion
                  ? {
                      borderTopLeftRadius: DRAWER_RADIUS_REST,
                      borderBottomLeftRadius: DRAWER_RADIUS_REST,
                    }
                  : undefined
              }
              variants={prefersReducedMotion ? undefined : drawerPanel}
              initial={prefersReducedMotion ? { x: 0, opacity: 1 } : "hidden"}
              animate={prefersReducedMotion ? { x: 0, opacity: 1 } : "visible"}
              exit={prefersReducedMotion ? { x: 0, opacity: 0 } : "exit"}
            >
              <ul className="flex flex-1 flex-col justify-center gap-0 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(5.5rem,env(safe-area-inset-top))]">
                {NAV_LINKS.map((link, index) => (
                  <motion.li
                    key={link.href}
                    initial={
                      prefersReducedMotion ? false : { opacity: 0, x: 16 }
                    }
                    animate={{ opacity: 1, x: 0 }}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : {
                            duration: 0.5,
                            ease: easeDrawer,
                            delay: 0.1 + index * 0.045,
                          }
                    }
                  >
                    <Link
                      href={link.href}
                      className="block cursor-pointer py-3.5 font-display text-3xl font-medium uppercase tracking-tight text-foreground transition-colors duration-300 hover:text-zinc-400 sm:py-4 sm:text-[2rem]"
                      onClick={closeMenu}
                    >
                      {link.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
