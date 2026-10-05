import { useCallback, useEffect, useRef } from 'react';

const DEFAULT_DELAY = 500;   // ms the finger has to stay down
const MOVE_TOLERANCE = 10;   // px of drift still counted as "not moving"
const CLICK_GUARD = 700;     // ms we keep swallowing the click after the press fired

// Long press for touch devices. Call once, spread the returned factory on the
// element; whatever you pass to the factory comes back to `onLongPress`:
//   const longPressProps = useLongPress(openPicker, 500);
//   <div {...longPressProps(className, subject)} />
// The press origin {x, y} in viewport px is appended as the last argument, so
// the callback can place something where the finger actually is.
// Mouse and trackpad are untouched: only touch events can start a press.
export default function useLongPress(onLongPress, delay = DEFAULT_DELAY) {
  const onLongPressRef = useRef(onLongPress);
  onLongPressRef.current = onLongPress;

  const timerRef = useRef(null);
  const startRef = useRef(null);    // {x, y} of the touch that armed the press
  const nodeRef = useRef(null);     // element currently wearing the "pressing" cue
  const firedRef = useRef(false);   // has the running touch already fired?
  const detachRef = useRef(null);   // removes the listeners of the running press

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    startRef.current = null;
    if (nodeRef.current) nodeRef.current.classList.remove("pressing");
    nodeRef.current = null;
    if (detachRef.current) detachRef.current();
    detachRef.current = null;
  }, []);

  // The overlay opens under the finger, so the click iOS fires on lift would
  // close it again. Capture phase on window: nothing else ever sees that click.
  const swallowNextClick = () => {
    let timeout = null;
    const detach = () => {
      clearTimeout(timeout);
      window.removeEventListener("click", swallow, true);
    };
    function swallow(event) {
      event.stopPropagation();
      event.preventDefault();
      detach();
    }
    window.addEventListener("click", swallow, true);
    timeout = setTimeout(detach, CLICK_GUARD);
  };

  const start = useCallback((event, args) => {
    stop();
    firedRef.current = false;
    if (event.touches.length > 1) return;    // two fingers down: that is a pinch

    const touch = event.touches[0];
    const origin = { x: touch.clientX, y: touch.clientY };
    startRef.current = origin;
    nodeRef.current = event.currentTarget;
    nodeRef.current.classList.add("pressing");

    // Capture phase on document: the zoom/pan wrapper stops touchmove from
    // propagating while pinching or panning, so React's events never arrive.
    const onMove = (moveEvent) => {
      const from = startRef.current;
      if (!from) return;
      if (moveEvent.touches.length > 1) return stop();
      const point = moveEvent.touches[0];
      if (Math.abs(point.clientX - from.x) > MOVE_TOLERANCE ||
          Math.abs(point.clientY - from.y) > MOVE_TOLERANCE) stop();
    };
    const onSecondFinger = (startEvent) => {
      if (startEvent.touches.length > 1) stop();
    };
    const onEnd = (endEvent) => {
      // Keep iOS from replaying the lifted finger as mouse events and a click
      if (firedRef.current && endEvent.cancelable) endEvent.preventDefault();
      firedRef.current = false;
      stop();
    };

    const capture = { capture: true };
    document.addEventListener("touchmove", onMove, { capture: true, passive: true });
    document.addEventListener("touchstart", onSecondFinger, { capture: true, passive: true });
    document.addEventListener("touchend", onEnd, { capture: true, passive: false });
    document.addEventListener("touchcancel", stop, capture);
    window.addEventListener("scroll", stop, capture);

    detachRef.current = () => {
      document.removeEventListener("touchmove", onMove, capture);
      document.removeEventListener("touchstart", onSecondFinger, capture);
      document.removeEventListener("touchend", onEnd, capture);
      document.removeEventListener("touchcancel", stop, capture);
      window.removeEventListener("scroll", stop, capture);
    };

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      firedRef.current = true;
      if (nodeRef.current) nodeRef.current.classList.remove("pressing");
      swallowNextClick();
      onLongPressRef.current(...args, origin);
    }, delay);
  }, [stop, delay]);

  // Never leave a timer or a listener behind
  useEffect(() => stop, [stop]);

  return useCallback((...args) => ({
    onTouchStart: (event) => start(event, args),
    // Android pops a context menu on long press; iOS is handled in CSS
    onContextMenu: (event) => event.preventDefault()
  }), [start]);
}
