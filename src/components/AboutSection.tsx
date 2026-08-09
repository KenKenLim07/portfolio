"use client";

import { ABOUT } from "@/lib/constants";
import { useAboutBlockReveal } from "@/hooks/useAboutBlockReveal";
import { Section } from "@/components/ui/Section";
import { MegaTitleText } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";

function AboutReveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div data-about-reveal className={cn("gsap-reveal", className)}>
      {children}
    </div>
  );
}

export function AboutSection() {
  const scopeRef = useAboutBlockReveal();

  return (
    <Section id="about">
      <div ref={scopeRef}>
        <AboutReveal className="mb-5 md:mb-6">
          <h2 className="section-mega">
            <MegaTitleText title="About Me" />
          </h2>
        </AboutReveal>

        <AboutReveal className="mb-14 md:mb-20">
          <p className="max-w-2xl text-base leading-relaxed text-muted md:text-lg">
            {ABOUT.lead}
          </p>
        </AboutReveal>

        <AboutReveal className="mb-14 md:mb-20">
          <blockquote className="relative max-w-3xl border border-border border-l-[3px] border-l-[var(--accent-from)] bg-subtle px-6 py-7 sm:px-8 sm:py-8 md:px-10 md:py-9">
            <span
              className="pointer-events-none absolute top-3 left-4 font-display text-5xl leading-none text-foreground/15 select-none sm:top-4 sm:left-5 sm:text-6xl"
              aria-hidden
            >
              &ldquo;
            </span>
            <p className="relative font-display text-xl leading-snug tracking-tight text-foreground md:text-2xl lg:text-[1.75rem] lg:leading-snug">
              {ABOUT.belief}
            </p>
          </blockquote>
        </AboutReveal>

        {ABOUT.paragraphs.map((paragraph, index) => (
          <AboutReveal
            key={paragraph}
            className={index < ABOUT.paragraphs.length - 1 ? "mb-6" : undefined}
          >
            <p className="max-w-3xl text-lg leading-relaxed text-muted italic">
              {paragraph}
            </p>
          </AboutReveal>
        ))}
      </div>
    </Section>
  );
}
