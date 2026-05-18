import { useState, useEffect, useRef } from "react";

export default function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0);
  const startTime = useRef(null);
  const animId = useRef(null);

  useEffect(() => {
    if (target === 0 || target == null) { setValue(0); return; }

    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    const tick = (timestamp) => {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      setValue(Math.round(easeOut(progress) * target));
      if (progress < 1) {
        animId.current = requestAnimationFrame(tick);
      }
    };

    startTime.current = null;
    animId.current = requestAnimationFrame(tick);

    return () => {
      if (animId.current) cancelAnimationFrame(animId.current);
    };
  }, [target, duration]);

  return value;
}
