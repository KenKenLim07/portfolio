"use client";

import { TESTIMONIALS } from "@/lib/constants";
import { useScrubBlockReveal } from "@/hooks/useScrubBlockReveal";
import { Section } from "@/components/ui/Section";
import { SectionMegaHeading } from "@/components/ui/SectionHeading";
import { TestimonialsRow } from "@/components/ui/testimonials-columns";

const firstRow = TESTIMONIALS.slice(0, 5);
const secondRow = TESTIMONIALS.slice(5, 9);

export function TestimonialsSection() {
  const scopeRef = useScrubBlockReveal();

  return (
    <Section id="testimonials">
      <div ref={scopeRef}>
        <div data-scrub-reveal className="gsap-reveal mb-14 md:mb-20">
          <SectionMegaHeading title="Kind Words" />
        </div>

        <div className="flex flex-col gap-6">
          <div data-scrub-reveal className="gsap-reveal">
            <TestimonialsRow testimonials={firstRow} duration={42} />
          </div>
          <div data-scrub-reveal className="gsap-reveal">
            <TestimonialsRow
              testimonials={secondRow}
              duration={48}
              reverse
            />
          </div>
        </div>
      </div>
    </Section>
  );
}
