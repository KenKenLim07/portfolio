"use client";

import { Mail } from "lucide-react";
import {
  GitHubIcon,
  LinkedInIcon,
  FacebookIcon,
} from "@/components/icons/BrandIcons";
import { SOCIAL_LINKS, SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

const socials = [
  { label: "GitHub", href: SOCIAL_LINKS.github, Icon: GitHubIcon },
  { label: "LinkedIn", href: SOCIAL_LINKS.linkedin, Icon: LinkedInIcon },
  { label: "Facebook", href: SOCIAL_LINKS.facebook, Icon: FacebookIcon },
  { label: "Email", href: `mailto:${SITE.email}`, Icon: Mail },
] as const;

export function HeroSideRail() {
  return (
    <aside
      className={cn(
        "fixed z-30 hidden flex-col xl:flex",
        "top-1/2 -translate-y-1/2 gap-10",
        "left-5 items-start 2xl:left-8",
      )}
      aria-label="Social links"
    >
      <p
        className={cn(
          "shrink-0 origin-left -rotate-90 font-mono text-[11px] uppercase leading-none tracking-[0.32em] text-muted",
        )}
      >
        Social
      </p>
      <ul className="flex flex-col items-start gap-2.5">
        {socials.map((item) => (
          <li key={item.label}>
            <a
              href={item.href}
              target={item.href.startsWith("mailto") ? undefined : "_blank"}
              rel={
                item.href.startsWith("mailto")
                  ? undefined
                  : "noopener noreferrer"
              }
              className={cn(
                "radius-control group inline-flex size-11 cursor-pointer items-center justify-center",
                "border border-transparent text-muted",
                "transition-[color,background-color,border-color,box-shadow] duration-200 ease-out",
                "hover:border-border hover:bg-[var(--fill-hover)] hover:text-foreground hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent-from)_28%,transparent)]",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/30",
                "motion-reduce:transition-none",
              )}
              aria-label={item.label}
            >
              <item.Icon className="block size-5 transition-transform duration-200 ease-out group-hover:-translate-y-px motion-reduce:group-hover:translate-y-0" />
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
