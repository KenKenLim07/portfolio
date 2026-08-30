"use client";

import type { LucideIcon } from "lucide-react";
import { FileText, Mail } from "lucide-react";
import {
  FacebookIcon,
  GitHubIcon,
  LinkedInIcon,
} from "@/components/icons/BrandIcons";
import { SITE, SOCIAL_LINKS } from "@/lib/constants";
import { useScrubBlockReveal } from "@/hooks/useScrubBlockReveal";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { ContactForm } from "@/components/ContactForm";
import { SectionMegaHeading } from "@/components/ui/SectionHeading";

type ContactIcon = LucideIcon | typeof GitHubIcon;

const links: {
  label: string;
  href: string;
  icon: ContactIcon;
  variant: "primary" | "secondary";
  external?: boolean;
}[] = [
  {
    label: "Email",
    href: `mailto:${SITE.email}`,
    icon: Mail,
    variant: "secondary" as const,
  },
  {
    label: "Resume",
    href: SITE.resumeUrl,
    icon: FileText,
    variant: "secondary" as const,
    external: true,
  },
  {
    label: "GitHub",
    href: SOCIAL_LINKS.github,
    icon: GitHubIcon,
    variant: "secondary" as const,
    external: true,
  },
  {
    label: "LinkedIn",
    href: SOCIAL_LINKS.linkedin,
    icon: LinkedInIcon,
    variant: "secondary" as const,
    external: true,
  },
  {
    label: "Facebook",
    href: SOCIAL_LINKS.facebook,
    icon: FacebookIcon,
    variant: "secondary" as const,
    external: true,
  },
];

export function ContactSection() {
  const scopeRef = useScrubBlockReveal();

  return (
    <Section id="contact">
      <div
        ref={scopeRef}
        className="radius-panel-lg relative overflow-hidden border border-border"
      >
        <div className="pointer-events-none absolute inset-0 glow-orb opacity-80" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--accent-from)]/20 via-transparent to-[var(--accent-to)]/15" />

        <div className="relative grid gap-12 px-6 py-16 md:px-12 md:py-20 lg:grid-cols-2 lg:gap-16 lg:px-16 lg:py-24">
          <div className="space-y-0">
            <div data-scrub-reveal className="gsap-reveal">
              <SectionMegaHeading title="Get in Touch" className="max-w-xl" />
            </div>

            <div data-scrub-reveal className="gsap-reveal mt-6">
              <p className="max-w-lg text-lg leading-relaxed text-muted">
                Open to collaborations with brands, startups, and businesses
                ready to elevate their digital presence with premium engineering
                and design.
              </p>
            </div>

            <div data-scrub-reveal className="gsap-reveal mt-8">
              <div className="flex flex-wrap gap-3">
                {links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Button
                      key={link.label}
                      href={link.href}
                      variant={link.variant}
                      external={link.external}
                      className="inline-flex gap-2"
                    >
                      <Icon />
                      {link.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          <div data-scrub-reveal className="gsap-reveal">
            <div className="radius-panel border border-border bg-[var(--form-surface)] p-6 md:p-8">
              <h3 className="font-display mb-6 text-lg font-semibold text-foreground">
                Send a message
              </h3>
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
