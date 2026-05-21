import Link from "next/link";
import { GitHubIcon, LinkedInIcon } from "@/components/icons/BrandIcons";
import { NAV_LINKS, SITE, SOCIAL_LINKS } from "@/lib/constants";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/5 py-12 md:py-16">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 md:flex-row md:items-center md:justify-between md:px-8 lg:px-12">
        <div>
          <Link
            href="#home"
            className="font-display cursor-pointer text-lg font-semibold text-foreground transition-colors duration-200 hover:text-zinc-300"
          >
            {SITE.name}
          </Link>
          <p className="mt-2 max-w-xs text-sm text-muted">{SITE.role}</p>
        </div>

        <nav aria-label="Footer navigation">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
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

        <div className="flex items-center gap-4">
          <a
            href={SOCIAL_LINKS.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="cursor-pointer rounded-full border border-white/10 p-2.5 text-muted transition-colors duration-200 hover:border-white/20 hover:text-foreground"
          >
            <GitHubIcon />
          </a>
          <a
            href={SOCIAL_LINKS.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="cursor-pointer rounded-full border border-white/10 p-2.5 text-muted transition-colors duration-200 hover:border-white/20 hover:text-foreground"
          >
            <LinkedInIcon />
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
