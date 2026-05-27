import { Check } from "lucide-react";
import { ABOUT, ABOUT_HIGHLIGHTS } from "@/lib/constants";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AnimatedItem, AnimatedSection } from "@/components/ui/AnimatedSection";

export function AboutSection() {
  return (
    <Section id="about" className="border-t border-border">
      <SectionHeading label="" title="About Me" description={ABOUT.lead} />

      <AnimatedSection className="mb-14 md:mb-20">
        <AnimatedItem>
          <blockquote className="max-w-4xl font-display text-xl leading-snug tracking-tight text-foreground md:text-2xl lg:text-3xl">
            {ABOUT.belief}
          </blockquote>
        </AnimatedItem>
      </AnimatedSection>

      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <AnimatedSection>
          {ABOUT.paragraphs.map((paragraph, index) => (
            <AnimatedItem key={index}>
              <p
                className={`text-lg leading-relaxed text-muted ${index > 0 ? "mt-6" : ""}`}
              >
                {paragraph}
              </p>
            </AnimatedItem>
          ))}
        </AnimatedSection>

        {/* Tail block: fade out only when the tail is about to leave viewport */}
        <AnimatedSection end="bottom 15%">
          <AnimatedItem>
            <div className="glass radius-panel p-6 md:p-8">
              <h3 className="font-display mb-5 text-sm font-semibold uppercase tracking-widest text-foreground">
                Core Focus
              </h3>
              <ul className="grid gap-3 sm:grid-cols-2">
                {ABOUT_HIGHLIGHTS.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-muted">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[rgba(122,98,73,0.95)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </AnimatedItem>
        </AnimatedSection>
      </div>
    </Section>
  );
}
