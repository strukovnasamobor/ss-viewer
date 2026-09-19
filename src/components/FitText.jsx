import { useLayoutEffect, useRef } from 'react';

// Shrinks the text until it fits its parent's width on one line. The font never
// goes below `minScale` of the inherited size; if it still doesn't fit at that
// size the text is allowed to wrap instead.
export default function FitText({ children, minScale = 0.5 }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;

    const fit = () => {
      // Measure at the natural size on a single line
      el.style.fontSize = "";
      el.style.whiteSpace = "nowrap";

      const style = getComputedStyle(parent);
      const available = parent.clientWidth
        - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const needed = el.scrollWidth;
      if (available <= 0 || needed <= available) return;

      const scale = available / needed;
      if (scale >= minScale) {
        el.style.fontSize = `${scale}em`;
      } else {
        el.style.fontSize = `${minScale}em`;
        el.style.whiteSpace = "normal";
      }
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(parent);
    return () => observer.disconnect();
  }, [children, minScale]);

  return <span ref={ref} className="fit-text">{children}</span>;
}
