import { ABOUT } from "@/lib/constants";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AnimatedItem, AnimatedSection } from "@/components/ui/AnimatedSection";

export function AboutSection() {
  return (
    <Section id="about">
      <SectionHeading label="" title="About Me" description={ABOUT.lead} />

      <AnimatedSection delay={0.15} className="mb-14 md:mb-20">
        <AnimatedItem>
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
        </AnimatedItem>
      </AnimatedSection>

      <AnimatedSection variant="tail">
        <AnimatedItem>
          <div className="max-w-3xl space-y-6">
            {ABOUT.paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="text-lg leading-relaxed text-muted"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </AnimatedItem>
      </AnimatedSection>
    </Section>
  );
}
