import { Check } from "lucide-react";
import { ABOUT, ABOUT_EXPERIENCE, ABOUT_HIGHLIGHTS } from "@/lib/constants";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AnimatedItem, AnimatedSection } from "@/components/ui/AnimatedSection";

export function AboutSection() {
  return (
    <Section id="about" className="border-t border-white/5">
      <SectionHeading
        label="About"
        title={ABOUT.title}
        description={ABOUT.lead}
      />

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

        <AnimatedSection className="space-y-8">
          <AnimatedItem>
            <div className="glass radius-panel p-6 md:p-8">
              <h3 className="font-display mb-5 text-sm font-semibold uppercase tracking-widest text-foreground">
                Core Focus
              </h3>
              <ul className="grid gap-3 sm:grid-cols-2">
                {ABOUT_HIGHLIGHTS.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-muted">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </AnimatedItem>

          <AnimatedItem>
            <div className="radius-panel border border-white/10 bg-surface p-6 md:p-8">
              <h3 className="font-display mb-5 text-sm font-semibold uppercase tracking-widest text-foreground">
                Experience Building
              </h3>
              <ul className="space-y-3">
                {ABOUT_EXPERIENCE.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 border-b border-white/5 pb-3 text-sm text-muted last:border-0 last:pb-0"
                  >
                    <span className="h-1 w-8 rounded-full bg-gradient-to-r from-indigo-500/80 to-violet-500/40" />
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
