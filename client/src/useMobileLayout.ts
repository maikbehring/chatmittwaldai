import { useEffect, useState } from "react";

/** Entspricht Tailwind `md` — Viewports darunter nutzen Mobile-Layout (Overlay-Sidebar). */
export const MOBILE_LAYOUT_MQ = "(max-width: 767px)";

export function useIsMobileLayout(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(MOBILE_LAYOUT_MQ).matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_LAYOUT_MQ);
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
