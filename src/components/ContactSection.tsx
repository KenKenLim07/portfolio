import type { LucideIcon } from "lucide-react";
import { Mail, MessageCircle } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "@/components/icons/BrandIcons";
import { SITE, SOCIAL_LINKS } from "@/lib/constants";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { AnimatedItem, AnimatedSection } from "@/components/ui/AnimatedSection";

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
    variant: "primary" as const,
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
    label: "Messenger",
    href: SOCIAL_LINKS.messenger,
    icon: MessageCircle,
    variant: "secondary" as const,
    external: true,
  },
];

export function ContactSection() {
  return (
    <Section id="contact" className="border-t border-white/5">
      <div className="relative overflow-hidden rounded-3xl border border-white/10">
        <div className="pointer-events-none absolute inset-0 glow-orb opacity-80" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-950/40 via-transparent to-violet-950/30" />

        <AnimatedSection className="relative px-8 py-20 text-center md:px-16 md:py-28">
          <AnimatedItem>
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-muted">
              Contact
            </p>
          </AnimatedItem>
          <AnimatedItem>
            <h2 className="font-display mx-auto max-w-3xl text-3xl font-semibold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Let&apos;s Build Something Modern
            </h2>
          </AnimatedItem>
          <AnimatedItem>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Open to collaborations with brands, startups, and businesses
              ready to elevate their digital presence with premium engineering
              and design.
            </p>
          </AnimatedItem>
          <AnimatedItem>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
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
          </AnimatedItem>
        </AnimatedSection>
      </div>
    </Section>
  );
}
