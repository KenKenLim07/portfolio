"use client";

import { useRef } from "react";
import { Check } from "lucide-react";
import { ABOUT, ABOUT_HIGHLIGHTS } from "@/lib/constants";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useAboutScrollReveal } from "@/hooks/useAboutScrollReveal";
import { cn } from "@/lib/utils";

function AboutReveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div data-gsap-reveal className={cn("gsap-reveal", className)}>
      {children}
    </div>
  );
}

export function AboutSection() {
  const contentRef = useRef<HTMLDivElement>(null);
  useAboutScrollReveal(contentRef);

  return (
    <Section id="about">
      <div ref={contentRef}>
        <div data-about-layer="heading">
          <SectionHeading
            label=""
            title="About Me"
            description={ABOUT.lead}
            animate={false}
          />
        </div>

        <div
          data-about-layer="belief"
          className="mb-14 md:mb-20"
        >
          <AboutReveal>
            <blockquote className="max-w-4xl font-display text-xl leading-snug tracking-tight text-foreground md:text-2xl lg:text-3xl">
              {ABOUT.belief}
            </blockquote>
          </AboutReveal>
        </div>

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div data-about-layer="copy">
            {ABOUT.paragraphs.map((paragraph, index) => (
              <AboutReveal
                key={index}
                className={index > 0 ? "mt-6" : undefined}
              >
                <p className="text-lg leading-relaxed text-muted">
                  {paragraph}
                </p>
              </AboutReveal>
            ))}
          </div>

          <div data-about-layer="focus">
            <AboutReveal>
              <div className="glass radius-panel p-6 md:p-8">
                <h3 className="font-display mb-5 text-sm font-semibold uppercase tracking-widest text-foreground">
                  Core Focus
                </h3>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {ABOUT_HIGHLIGHTS.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm text-muted"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-from" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </AboutReveal>
          </div>
        </div>
      </div>
    </Section>
  );
}
