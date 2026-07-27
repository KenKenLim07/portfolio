import { Check } from "lucide-react";
import { ABOUT, ABOUT_HIGHLIGHTS } from "@/lib/constants";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AnimatedItem, AnimatedSection } from "@/components/ui/AnimatedSection";

export function AboutSection() {
  return (
    <Section id="about" className="border-t border-border">
      <SectionHeading label="" title="About Me" description={ABOUT.lead} />

      <AnimatedSection delay={0.15} className="mb-14 md:mb-20">
        <AnimatedItem>
          <blockquote className="max-w-4xl font-display text-xl leading-snug tracking-tight text-foreground md:text-2xl lg:text-3xl">
            {ABOUT.belief}
          </blockquote>
        </AnimatedItem>
      </AnimatedSection>

      <AnimatedSection variant="tail">
        <AnimatedItem>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              {ABOUT.paragraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className={`text-lg leading-relaxed text-muted ${index > 0 ? "mt-6" : ""}`}
                >
                  {paragraph}
                </p>
              ))}
            </div>

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
          </div>
        </AnimatedItem>
      </AnimatedSection>
    </Section>
  );
}
