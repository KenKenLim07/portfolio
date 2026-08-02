import { ABOUT, ABOUT_TAGS } from "@/lib/constants";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { AnimatedItem, AnimatedSection } from "@/components/ui/AnimatedSection";

export function AboutSection() {
  return (
    <Section id="about">
      <SectionHeading label="" title="About Me" className="mb-10 md:mb-12" />

      <AnimatedSection className="flex max-w-3xl flex-col gap-8 md:gap-10">
        <AnimatedItem>
          <p className="text-base leading-relaxed text-muted md:text-lg md:leading-relaxed">
            {ABOUT.intro}
          </p>
        </AnimatedItem>

        <AnimatedItem>
          <figure className="radius-panel border border-border border-l-[3px] border-l-[var(--accent-from)] bg-surface px-5 py-5 md:px-6 md:py-6">
            <blockquote className="font-display text-xl font-semibold leading-snug tracking-tight text-foreground md:text-2xl">
              &ldquo;{ABOUT.quote}&rdquo;
            </blockquote>
          </figure>
        </AnimatedItem>

        <AnimatedItem>
          <p className="text-base leading-relaxed text-muted md:text-lg md:leading-relaxed">
            {ABOUT.experience}
          </p>
        </AnimatedItem>

        <AnimatedItem>
          <ul className="flex list-none flex-wrap gap-2 p-0">
            {ABOUT_TAGS.map((tag) => (
              <li key={tag}>
                <Badge>{tag}</Badge>
              </li>
            ))}
          </ul>
        </AnimatedItem>
      </AnimatedSection>
    </Section>
  );
}
