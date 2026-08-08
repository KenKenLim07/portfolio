"use client";

import { TESTIMONIALS } from "@/lib/constants";
import { useScrubBlockReveal } from "@/hooks/useScrubBlockReveal";
import { Section } from "@/components/ui/Section";
import { MegaTitleText } from "@/components/ui/SectionHeading";
import { TestimonialsRow } from "@/components/ui/testimonials-columns";

const firstRow = TESTIMONIALS.slice(0, 5);
const secondRow = TESTIMONIALS.slice(5, 9);

export function TestimonialsSection() {
  const scopeRef = useScrubBlockReveal();

  return (
    <Section id="testimonials" containerClassName="max-w-none px-0 md:px-0 lg:px-0">
      <div ref={scopeRef}>
        <div className="mx-auto mb-14 w-full max-w-7xl px-6 text-center md:mb-20 md:px-8 lg:px-12">
          <div data-scrub-reveal className="gsap-reveal">
            <h2 className="section-mega">
              <MegaTitleText title="Kind Words" />
            </h2>
          </div>
        </div>

        <div
          data-scrub-reveal
          className="gsap-reveal flex flex-col gap-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
        >
          <TestimonialsRow testimonials={firstRow} duration={42} />
          <TestimonialsRow
            testimonials={secondRow}
            duration={48}
            reverse
          />
        </div>
      </div>
    </Section>
  );
}
