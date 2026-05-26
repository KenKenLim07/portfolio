import type { LucideIcon } from "lucide-react";
import { Mail, MessageCircle } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "@/components/icons/BrandIcons";
import { SITE, SOCIAL_LINKS } from "@/lib/constants";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { AnimatedItem, AnimatedSection } from "@/components/ui/AnimatedSection";
import { ContactForm } from "@/components/ContactForm";

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
      <div className="radius-panel-lg relative overflow-hidden border border-white/10">
        <div className="pointer-events-none absolute inset-0 glow-orb opacity-80" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-950/40 via-transparent to-violet-950/30" />

        <div className="relative grid gap-12 px-6 py-16 md:px-12 md:py-20 lg:grid-cols-2 lg:gap-16 lg:px-16 lg:py-24">
          <AnimatedSection>
            <AnimatedItem>
              <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-muted">
                Contact
              </p>
            </AnimatedItem>
            <AnimatedItem>
              <h2 className="font-display max-w-xl text-3xl font-semibold tracking-tight text-foreground md:text-4xl lg:text-5xl">
                Let&apos;s Build Something Modern
              </h2>
            </AnimatedItem>
            <AnimatedItem>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
                Open to collaborations with brands, startups, and businesses
                ready to elevate their digital presence with premium engineering
                and design.
              </p>
            </AnimatedItem>
            <AnimatedItem>
              <div className="mt-8 flex flex-wrap gap-3">
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

          <AnimatedSection delay={0.1}>
            <AnimatedItem>
              <div className="radius-panel border border-white/10 bg-[var(--form-surface)] p-6 md:p-8">
                <h3 className="font-display mb-1 text-lg font-semibold text-foreground">
                  Send a message
                </h3>
                <p className="mb-6 text-sm text-muted">
                  Share your project details and I&apos;ll respond as soon as
                  possible.
                </p>
                <ContactForm />
              </div>
            </AnimatedItem>
          </AnimatedSection>
        </div>
      </div>
    </Section>
  );
}
