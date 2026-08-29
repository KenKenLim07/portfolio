"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { scrollToSection } from "@/lib/scroll-to";
import { cn } from "@/lib/utils";

export type NavItem = {
  name: string;
  url: string;
  icon: LucideIcon;
  external?: boolean;
};

type NavBarProps = {
  items: NavItem[];
  activeTab: string;
  onTabChange: (name: string) => void;
  className?: string;
};

export function NavBar({ items, activeTab, onTabChange, className }: NavBarProps) {
  return (
    <div
      className={cn(
        "fixed left-1/2 top-0 z-50 -translate-x-1/2 pt-6",
        className,
      )}
    >
      <div className="radius-control flex items-center gap-1 border border-border bg-[var(--glass)] px-1 py-1 shadow-lg backdrop-blur-lg">
        {items.map((item) => {
          const isActive = activeTab === item.name;
          const linkClass = cn(
            "radius-control relative cursor-pointer px-5 py-2 text-sm font-semibold transition-colors xl:px-6",
            "text-foreground/80 hover:text-foreground",
            isActive && "bg-[var(--fill-subtle)] text-foreground",
          );

          const content = (
            <>
              <span>{item.name}</span>
              {isActive && (
                <motion.div
                  layoutId="tubelight-lamp"
                  className="radius-control absolute inset-0 -z-10 w-full bg-[color-mix(in_srgb,white_8%,transparent)]"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div className="absolute -top-2 left-1/2 h-1 w-8 -translate-x-1/2 bg-white">
                    <div className="absolute -left-2 -top-2 h-6 w-12 bg-[color-mix(in_srgb,white_20%,transparent)] blur-md" />
                    <div className="absolute -top-1 h-6 w-8 bg-[color-mix(in_srgb,white_20%,transparent)] blur-md" />
                    <div className="absolute left-2 top-0 h-4 w-4 bg-[color-mix(in_srgb,white_20%,transparent)] blur-sm" />
                  </div>
                </motion.div>
              )}
            </>
          );

          if (item.external) {
            return (
              <a
                key={item.name}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onTabChange(item.name)}
                className={linkClass}
              >
                {content}
              </a>
            );
          }

          return (
            <a
              key={item.name}
              href={item.url}
              onClick={(event) => {
                event.preventDefault();
                onTabChange(item.name);
                scrollToSection(item.url.slice(1));
              }}
              className={linkClass}
            >
              {content}
            </a>
          );
        })}
      </div>
    </div>
  );
}
