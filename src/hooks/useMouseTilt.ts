"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useSpring, useMotionValue } from "framer-motion";

const MAX_TILT = 6;

export function useMouseTilt(enabled = true) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 120, damping: 20 });
  const springY = useSpring(rotateY, { stiffness: 120, damping: 20 });
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50 });
  const [canTilt, setCanTilt] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const handler = () => setCanTilt(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const tiltEnabled = enabled && canTilt;

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!tiltEnabled || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      rotateY.set((x - 0.5) * MAX_TILT * 2);
      rotateX.set((0.5 - y) * MAX_TILT * 2);
      setSpotlight({ x: x * 100, y: y * 100 });
    },
    [tiltEnabled, rotateX, rotateY],
  );

  const onLeave = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
    setSpotlight({ x: 50, y: 50 });
  }, [rotateX, rotateY]);

  return { ref, springX, springY, spotlight, onMove, onLeave, tiltEnabled };
}
