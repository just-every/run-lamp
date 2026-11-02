import { useEffect, useId, useRef, useState, type ComponentProps } from "react";

/** Composer icon controls share a delayed hover hint and an immediate focus hint. */
export function TooltipButton({ tooltip, children, onFocus, onBlur, onMouseEnter, onMouseLeave, onKeyDown, ...props }: ComponentProps<"button"> & { tooltip: string }) {
  const id = useId();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [position, setPosition] = useState<{ left: number; top: number; below: boolean } | null>(null);
  const cancel = () => clearTimeout(timer.current);
  const hide = () => { cancel(); setPosition(null); };
  const show = (button: HTMLButtonElement) => {
    const rect = button.getBoundingClientRect();
    const below = rect.top < 48;
    setPosition({ left: Math.max(80, Math.min(innerWidth - 80, rect.left + rect.width / 2)), top: below ? rect.bottom + 6 : rect.top - 6, below });
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  return <button {...props} aria-describedby={[props["aria-describedby"], position ? id : null].filter(Boolean).join(" ") || undefined}
    onMouseEnter={event => { cancel(); const button = event.currentTarget; timer.current = setTimeout(() => show(button), 300); onMouseEnter?.(event); }}
    onMouseLeave={event => { cancel(); if (document.activeElement !== event.currentTarget) setPosition(null); onMouseLeave?.(event); }}
    onFocus={event => { cancel(); show(event.currentTarget); onFocus?.(event); }}
    onBlur={event => { hide(); onBlur?.(event); }}
    onKeyDown={event => { if (event.key === "Escape") hide(); onKeyDown?.(event); }}>
    {children}
    {position && <span id={id} role="tooltip" style={{ position: "fixed", zIndex: 100, left: position.left, top: position.top, transform: position.below ? undefined : "translateY(-100%)", translate: "-50% 0", display: "block", padding: "6px 10px", borderRadius: 6, background: "var(--ink)", color: "var(--on-ink)", fontSize: 13, fontWeight: 400, lineHeight: 1.4, whiteSpace: "nowrap", pointerEvents: "none" }}>{tooltip}</span>}
  </button>;
}
