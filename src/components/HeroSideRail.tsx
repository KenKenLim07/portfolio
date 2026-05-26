"use client";

import { Mail } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "@/components/icons/BrandIcons";
import { SOCIAL_LINKS, SITE } from "@/lib/constants";

const socials = [
  { label: "GitHub", href: SOCIAL_LINKS.github, Icon: GitHubIcon },
  { label: "LinkedIn", href: SOCIAL_LINKS.linkedin, Icon: LinkedInIcon },
  { label: "Email", href: `mailto:${SITE.email}`, Icon: Mail },
] as const;

export function HeroSideRail() {
  return (
    <aside
    className="fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-8 xl:left-6 xl:flex 2xl:left-8"
    aria-label="Social links"
  >
    <p className="origin-left -rotate-90 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-600">
      Social
    </p>
    <ul className="flex flex-col gap-4">
      {socials.map((item) => (
        <li key={item.label}>
          <a
            href={item.href}
            target={item.href.startsWith("mailto") ? undefined : "_blank"}
            rel={item.href.startsWith("mailto") ? undefined : "noopener noreferrer"}
            className="group flex cursor-pointer items-center gap-2 text-zinc-500 transition-colors duration-200 hover:text-foreground"
            aria-label={item.label}
          >
            <item.Icon className="h-4 w-4" strokeWidth={1.5} />
          </a>
        </li>
      ))}
    </ul>
  </aside>
  );
}
