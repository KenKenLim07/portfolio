"use client";

import { motion } from "framer-motion";
import { fadeInUp, easeOut } from "@/lib/motion";
import { useHeroEntrance } from "@/hooks/useHeroEntrance";
import { cn } from "@/lib/utils";

type HeroEntranceItemProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "span" | "p";
};

/** Same fade-in-up as scroll sections, triggered on hero mount instead of whileInView */
export function HeroEntranceItem({
  children,
  className,
  delay = 0,
  as = "div",
}: HeroEntranceItemProps) {
  const { ready, prefersReducedMotion } = useHeroEntrance();
  const Component = motion[as];

  if (prefersReducedMotion) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Component
      className={className}
      initial={fadeInUp.hidden}
      animate={ready ? { opacity: 1, y: 0 } : fadeInUp.hidden}
      transition={{ duration: 0.6, delay, ease: easeOut }}
    >
      {children}
    </Component>
  );
}

export function HeroEntranceGroup({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ready, prefersReducedMotion } = useHeroEntrance();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      animate={ready ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: 0.1, delayChildren: delay },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/** Child of HeroEntranceGroup — uses shared fadeInUp variant */
export function HeroEntranceChild({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { prefersReducedMotion } = useHeroEntrance();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div className={className} variants={fadeInUp}>
      {children}
    </motion.div>
  );
}
