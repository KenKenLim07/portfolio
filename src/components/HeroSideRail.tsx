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
        "fixed z-30 hidden flex-col xl:flex",
        "top-1/2 -translate-y-1/2 gap-8",
        "left-6 items-start 2xl:left-8",
      )}
      aria-label="Social links"
    >
      <p
        className={cn(
          "shrink-0 origin-left -rotate-90 font-mono text-[10px] uppercase leading-none tracking-[0.3em] text-muted",
        )}
      >
        Social
      </p>
      <ul className="flex flex-col items-start gap-4">
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
