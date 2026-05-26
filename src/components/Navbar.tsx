"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";
import { easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";

const linkClass =
  "cursor-pointer font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 transition-colors duration-200 hover:text-foreground";

/** Rounded blob entering from the right → settles to panel corners */
const DRAWER_RADIUS_ENTER = 48;
const DRAWER_RADIUS_REST = 8;

const drawerTransition = { duration: 0.68, ease: easeOut };

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
    transition: { ...drawerTransition, when: "beforeChildren" },
  },
  exit: {
    x: "100%",
    borderTopLeftRadius: DRAWER_RADIUS_ENTER,
    borderBottomLeftRadius: DRAWER_RADIUS_ENTER,
    transition: { duration: 0.55, ease: easeOut, when: "afterChildren" },
  },
};

const drawerBackdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.35, ease: easeOut } },
  exit: { opacity: 0, transition: { duration: 0.3, ease: easeOut } },
};

const menuList = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.12 },
  },
  exit: {
    transition: { staggerChildren: 0.04, staggerDirection: -1 },
  },
};

const menuItem = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: easeOut },
  },
  exit: {
    opacity: 0,
    x: 12,
    transition: { duration: 0.25, ease: easeOut },
  },
};

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

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

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 border-b border-white/5 transition-colors duration-300",
        mobileOpen
          ? "border-white/10 bg-zinc-950"
          : "bg-background/90 backdrop-blur-sm",
      )}
    >
      <nav
        className="relative z-50 mx-auto flex h-14 max-w-7xl items-center justify-end gap-7 px-5 sm:px-6 md:px-8 lg:h-16 lg:gap-9 lg:px-12 xl:gap-10"
        aria-label="Main navigation"
      >
        <ul className="hidden items-center gap-7 xl:gap-9 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={linkClass}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className={cn(
            "relative z-[60] cursor-pointer p-2 transition-colors duration-300 lg:hidden",
            mobileOpen ? "text-foreground" : "text-zinc-400 hover:text-foreground",
          )}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((open) => !open)}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={mobileOpen ? "close" : "open"}
              initial={
                prefersReducedMotion ? false : { opacity: 0, rotate: -45, scale: 0.85 }
              }
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={
                prefersReducedMotion ? undefined : { opacity: 0, rotate: 45, scale: 0.85 }
              }
              transition={{ duration: 0.32, ease: easeOut }}
              className="flex"
            >
              {mobileOpen ? (
                <X className="h-6 w-6" strokeWidth={1.75} aria-hidden />
              ) : (
                <Menu className="h-6 w-6" strokeWidth={1.75} aria-hidden />
              )}
            </motion.span>
          </AnimatePresence>
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-40 cursor-default bg-black/55 lg:hidden"
              variants={prefersReducedMotion ? undefined : drawerBackdrop}
              initial={prefersReducedMotion ? false : "hidden"}
              animate={prefersReducedMotion ? undefined : "visible"}
              exit={prefersReducedMotion ? undefined : "exit"}
              onClick={closeMenu}
            />

            <motion.aside
              id="mobile-nav"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className="fixed right-0 top-0 z-40 flex h-dvh w-[min(100%,18.5rem)] flex-col overflow-hidden border-l border-white/10 bg-zinc-950 shadow-[-24px_0_64px_rgba(0,0,0,0.45)] sm:w-[min(88vw,20rem)] lg:hidden"
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
              <motion.ul
                className="flex flex-1 flex-col justify-center gap-0 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-20"
                variants={prefersReducedMotion ? undefined : menuList}
                initial={prefersReducedMotion ? false : "hidden"}
                animate={prefersReducedMotion ? undefined : "visible"}
                exit={prefersReducedMotion ? undefined : "exit"}
              >
                {NAV_LINKS.map((link) => (
                  <motion.li
                    key={link.href}
                    variants={prefersReducedMotion ? undefined : menuItem}
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
              </motion.ul>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
