import { useEffect, useRef } from 'react';

const TEXT_INPUT_TAGS = ["INPUT", "TEXTAREA", "SELECT", "ION-INPUT", "ION-SEARCHBAR", "ION-TEXTAREA"];

// Left/right arrow keys move to the previous/next schedule on non-touch devices.
// `enabled` should only be true while a schedule is open on the visible page.
// `navigate` receives 'left' or 'right' (same contract as navigateToCard).
export default function useArrowKeyNavigation(enabled, navigate) {
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;

      // Leave the keys alone while typing (search bar, color picker, ...)
      const target = event.target;
      if (target?.isContentEditable || TEXT_INPUT_TAGS.includes(target?.tagName)) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        navigateRef.current("left");
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        navigateRef.current("right");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);
}
