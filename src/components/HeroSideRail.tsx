"use client";

import { Mail } from "lucide-react";
import { GitHubIcon, FacebookIcon } from "@/components/icons/BrandIcons";
import { SOCIAL_LINKS, SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

const socials = [
  { label: "GitHub", href: SOCIAL_LINKS.github, Icon: GitHubIcon },
  { label: "Facebook", href: SOCIAL_LINKS.facebook, Icon: FacebookIcon },
  { label: "Email", href: `mailto:${SITE.email}`, Icon: Mail },
] as const;

export function HeroSideRail() {
  return (
    <aside
      className={cn(
        "fixed z-30 flex flex-col",
        /* Mobile: higher on screen, flush right */
        "top-[33%] -translate-y-1/2 gap-4",
        "right-[max(0.5rem,env(safe-area-inset-right))] items-end",
        /* Desktop: vertically centered left rail */
        "xl:top-1/2 xl:gap-8 xl:right-auto xl:left-6 xl:items-start 2xl:left-8",
      )}
      aria-label="Social links"
    >
      <p
        className={cn(
          "shrink-0 font-mono text-[10px] uppercase leading-none tracking-[0.3em] text-muted",
          "origin-right rotate-90",
          "xl:origin-left xl:-rotate-90",
        )}
      >
        Social
      </p>
      <ul
        className={cn(
          "flex flex-col items-end",
          /* Tighter icon stack — social label keeps the outer gap above */
          "gap-2 xl:items-start xl:gap-4",
        )}
      >
        {socials.map((item) => (
          <li key={item.label}>
            <a
              href={item.href}
              target={item.href.startsWith("mailto") ? undefined : "_blank"}
              rel={item.href.startsWith("mailto") ? undefined : "noopener noreferrer"}
              className="block cursor-pointer leading-none text-muted transition-colors duration-200 hover:text-foreground"
              aria-label={item.label}
            >
              <item.Icon className="block size-4" strokeWidth={1.5} />
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
