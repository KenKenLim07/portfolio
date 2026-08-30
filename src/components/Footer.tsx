import Link from "next/link";
import {
  FacebookIcon,
  GitHubIcon,
  LinkedInIcon,
} from "@/components/icons/BrandIcons";
import { NAV_LINKS, SITE, SOCIAL_LINKS } from "@/lib/constants";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden py-12 md:py-16">
      <p
        className="pointer-events-none absolute bottom-0 left-6 font-display text-[clamp(4rem,18vw,12rem)] font-bold leading-none tracking-tighter text-foreground/[0.04] select-none md:left-8 lg:left-12"
        aria-hidden
      >
        {SITE.name.split(" ")[0]}
      </p>
      <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center gap-10 px-6 text-center md:flex-row md:items-center md:justify-between md:px-8 md:text-left lg:px-12">
        <div className="flex flex-col items-center md:items-start">
          <Link
            href="#home"
            className="font-display cursor-pointer text-3xl tracking-tight text-foreground transition-colors duration-200 hover:text-muted sm:text-4xl lg:text-5xl"
          >
            {SITE.name}
          </Link>
          <p className="mt-2 max-w-xs text-sm text-muted">{SITE.role}</p>
        </div>

        <nav aria-label="Footer navigation" className="w-full md:w-auto">
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 md:justify-start">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="cursor-pointer text-sm text-muted transition-colors duration-200 hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center justify-center gap-3 md:justify-start">
          <a
            href={SOCIAL_LINKS.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="radius-control inline-flex size-10 cursor-pointer items-center justify-center border border-border text-muted transition-[color,background-color,border-color,box-shadow] duration-200 ease-out hover:border-[color-mix(in_srgb,var(--accent-from)_40%,var(--border))] hover:bg-[var(--fill-hover)] hover:text-foreground hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent-from)_22%,transparent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/30 motion-reduce:transition-none"
          >
            <GitHubIcon className="h-5 w-5" />
          </a>
          <a
            href={SOCIAL_LINKS.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="radius-control inline-flex size-10 cursor-pointer items-center justify-center border border-border text-muted transition-[color,background-color,border-color,box-shadow] duration-200 ease-out hover:border-[color-mix(in_srgb,var(--accent-from)_40%,var(--border))] hover:bg-[var(--fill-hover)] hover:text-foreground hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent-from)_22%,transparent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/30 motion-reduce:transition-none"
          >
            <LinkedInIcon className="h-5 w-5" />
          </a>
          <a
            href={SOCIAL_LINKS.facebook}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="radius-control inline-flex size-10 cursor-pointer items-center justify-center border border-border text-muted transition-[color,background-color,border-color,box-shadow] duration-200 ease-out hover:border-[color-mix(in_srgb,var(--accent-from)_40%,var(--border))] hover:bg-[var(--fill-hover)] hover:text-foreground hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent-from)_22%,transparent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/30 motion-reduce:transition-none"
          >
            <FacebookIcon className="h-5 w-5" />
          </a>
        </div>
      </div>

      <div className="mx-auto mt-10 w-full max-w-7xl px-6 md:px-8 lg:px-12">
        <p className="text-center text-xs text-muted md:text-left">
          © {year} {SITE.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
