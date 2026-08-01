/**
 * useTimeRangeDrag — PanResponder wiring for the session time-range slider.
 *
 * ONE responder on the whole track; the drag target (start handle / end
 * handle / whole range) is resolved from the touch position at grant time,
 * which stays reliable even when the two handles nearly coincide.
 *
 * PanResponder (not react-native-gesture-handler) on purpose: the slider
 * lives inside an RN <Modal>, which renders outside the app-root
 * GestureHandlerRootView on native; react-native-web supports PanResponder
 * with mouse events and keeps tracking when the pointer leaves the track.
 */
import { useRef, useState } from 'react';
import { PanResponder } from 'react-native';
import type { GestureResponderHandlers, LayoutChangeEvent, View } from 'react-native';

import {
  applyDrag,
  clamp,
  minutesToX,
  resolveDragMode,
  snapToStep,
  xToMinutes,
  MAX_END,
  MIN_DURATION,
} from '../utils/timeRange';
import type { DragMode, RangeMin } from '../utils/timeRange';

/** Effective touch target around each 24px handle (≈48px total). */
const HANDLE_HIT_RADIUS = 24;

interface UseTimeRangeDragArgs {
  startMin: number;
  endMin: number;
  /** Fired only when the snapped pair actually changes. */
  onChange: (start: number, end: number) => void;
  /** Parent uses this to freeze the modal ScrollView while dragging. */
  onDraggingChange?: (dragging: boolean) => void;
}

interface UseTimeRangeDragResult {
  panHandlers: GestureResponderHandlers;
  dragMode: DragMode | null;
  trackWidth: number;
  onTrackLayout: (e: LayoutChangeEvent) => void;
  /** Attach to the track View — used to resolve page→track coordinates. */
  trackRef: React.RefObject<View | null>;
}

export function useTimeRangeDrag({
  startMin,
  endMin,
  onChange,
  onDraggingChange,
}: UseTimeRangeDragArgs): UseTimeRangeDragResult {
  const [dragMode, setDragMode] = useState<DragMode | null>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const trackRef = useRef<View | null>(null);
  // Window-x of the track's left edge. locationX is unreliable here — it is
  // relative to whichever CHILD (handle, range fill) the pointer lands on,
  // especially on react-native-web — so we work in page coordinates instead.
  const trackPageXRef = useRef(0);

  // The responder is created once; all mutable inputs are read through refs
  // kept current on every render — no stale closures, no responder churn.
  const stateRef = useRef({ startMin, endMin, trackWidth, onChange, onDraggingChange });
  stateRef.current = { startMin, endMin, trackWidth, onChange, onDraggingChange };

  const originRef = useRef<RangeMin>({ start: startMin, end: endMin });
  const modeRef = useRef<DragMode>('range');
  const lastRef = useRef<RangeMin>({ start: startMin, end: endMin });
  const pressPageXRef = useRef(0);

  // Delta from the ORIGINAL press point (not gestureState.dx, which starts
  // at the grant point after the move threshold).
  const applyPointer = (pageX: number | undefined) => {
    const s = stateRef.current;
    if (s.trackWidth === 0 || typeof pageX !== 'number') return;
    const deltaMin = xToMinutes(pageX - pressPageXRef.current, s.trackWidth);
    const next = applyDrag(modeRef.current, originRef.current, deltaMin);
    if (next.start !== lastRef.current.start || next.end !== lastRef.current.end) {
      lastRef.current = next;
      s.onChange(next.start, next.end);
    }
  };
  const applyPointerRef = useRef(applyPointer);
  applyPointerRef.current = applyPointer;

  const panResponder = useRef(
    PanResponder.create({
      // Never capture on touch-down — a vertical scroll starting on the
      // track must still scroll the modal. But record where the press landed:
      // the responder is granted only after a move threshold, so gestureState
      // x0/dx are measured from the grant point, not the original press —
      // using them raw silently eats the first ~10px of every drag.
      onStartShouldSetPanResponder: (evt) => {
        pressPageXRef.current = evt.nativeEvent.pageX;
        return false;
      },
      // Claim the gesture only on clear horizontal intent.
      onMoveShouldSetPanResponder: (_evt, g) =>
        Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 4,
      // Once we own the drag, the ScrollView cannot steal it mid-gesture.
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: () => {
        const s = stateRef.current;
        // Refresh the track origin for subsequent gestures (layout may have
        // shifted since mount); this frame still uses the last known value.
        trackRef.current?.measureInWindow((x) => {
          trackPageXRef.current = x;
        });
        const touchX = pressPageXRef.current - trackPageXRef.current;
        const startX = minutesToX(s.startMin, s.trackWidth);
        const endX = minutesToX(s.endMin, s.trackWidth);
        const mode = resolveDragMode(touchX, startX, endX, HANDLE_HIT_RADIUS);

        let origin: RangeMin = { start: s.startMin, end: s.endMin };
        // Tap outside the range → jump the nearest handle to the tap point
        // first, then drag from there.
        const outside = touchX < startX - HANDLE_HIT_RADIUS || touchX > endX + HANDLE_HIT_RADIUS;
        if (outside && mode !== 'range') {
          const tapped = snapToStep(xToMinutes(touchX, s.trackWidth));
          origin =
            mode === 'start'
              ? { start: clamp(tapped, 0, s.endMin - MIN_DURATION), end: s.endMin }
              : { start: s.startMin, end: clamp(tapped, s.startMin + MIN_DURATION, MAX_END) };
          if (origin.start !== s.startMin || origin.end !== s.endMin) {
            s.onChange(origin.start, origin.end);
          }
        }

        originRef.current = origin;
        lastRef.current = origin;
        modeRef.current = mode;
        setDragMode(mode);
        s.onDraggingChange?.(true);
      },

      onPanResponderMove: (evt) => {
        applyPointerRef.current(evt.nativeEvent.pageX);
      },

      onPanResponderRelease: (evt) => {
        // Some engines (WebKit) coalesce away the final mousemove — apply the
        // pointer-up position so the range always lands where the drag ended.
        applyPointerRef.current(evt.nativeEvent.pageX);
        setDragMode(null);
        stateRef.current.onDraggingChange?.(false);
      },
      onPanResponderTerminate: () => {
        setDragMode(null);
        stateRef.current.onDraggingChange?.(false);
      },
    }),
  ).current;

  const onTrackLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
    trackRef.current?.measureInWindow((x) => {
      trackPageXRef.current = x;
    });
  };

  return { panHandlers: panResponder.panHandlers, dragMode, trackWidth, onTrackLayout, trackRef };
}
