import { useEffect, useRef, type SelectHTMLAttributes } from "react";

/** Konkrete RGB-Werte — Windows/Chromium ignorieren CSS-Variablen auf <option>. */
const OPTION_COLORS = {
  light: { bg: "#ffffff", fg: "#1d1e1f" },
  dark: { bg: "#141516", fg: "#ffffff" },
} as const;

function paintSelectOptions(select: HTMLSelectElement) {
  const isDark = document.documentElement.classList.contains("dark");
  const { bg, fg } = OPTION_COLORS[isDark ? "dark" : "light"];
  for (let i = 0; i < select.options.length; i++) {
    const opt = select.options[i]!;
    opt.style.backgroundColor = bg;
    opt.style.color = fg;
  }
}

/** Native <select> mit lesbaren Optionen in Dark Mode (v. a. Windows/Chromium). */
export function PlaygroundNativeSelect({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  const ref = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const sync = () => paintSelectOptions(el);
    sync();

    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, [children]);

  return (
    <select ref={ref} className={`playground-native-select ${className}`.trim()} {...props}>
      {children}
    </select>
  );
}
