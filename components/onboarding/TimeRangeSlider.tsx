/**
 * TimeRangeSlider — draggable session-time picker on a 24h timeline.
 *
 * The session is a physical object on the track: drag either handle to
 * resize, drag the middle to move the whole session, tap anywhere to jump
 * the nearest handle. Already-scheduled sessions render as amber blocked
 * zones; overlapping one turns the range amber (Save is gated by the parent).
 */
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

import { Colors } from '../../constants/Colors';
import { useTimeRangeDrag } from '../../hooks/useTimeRangeDrag';
import { crossPlatformShadow } from '../../utils/shadow';
import { findConflict, minutesToTime, minutesToX, timeToMinutes } from '../../utils/timeRange';
import type { BlockedInterval } from '../../utils/timeRange';

import TimeRangeSliderControls from './TimeRangeSliderControls';

const HANDLE_SIZE = 24;
const BUBBLE_WIDTH = 52;

export interface TimeRangeSliderProps {
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  onChange: (startTime: string, endTime: string) => void;
  /** Own + cross-hospital sessions to render as blocked zones. */
  blocked: BlockedInterval[];
  slotDurationMinutes: number;
  onDraggingChange?: (dragging: boolean) => void;
}

export default function TimeRangeSlider({
  startTime,
  endTime,
  onChange,
  blocked,
  slotDurationMinutes,
  onDraggingChange,
}: TimeRangeSliderProps) {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  const { panHandlers, dragMode, trackWidth, onTrackLayout, trackRef } = useTimeRangeDrag({
    startMin,
    endMin,
    onChange: (s, e) => onChange(minutesToTime(s), minutesToTime(e)),
    onDraggingChange,
  });

  const conflict = findConflict(startMin, endMin, blocked);
  const measured = trackWidth > 0;
  const xStart = minutesToX(startMin, trackWidth);
  const xEnd = minutesToX(endMin, trackWidth);

  // Ruler density adapts to available width.
  const labelEveryH = trackWidth >= 520 ? 3 : 6;
  const tickEveryH = trackWidth >= 520 ? 1 : 3;
  const hourLabels = Array.from({ length: 24 / labelEveryH + 1 }, (_, i) => i * labelEveryH);
  const hourTicks = Array.from({ length: 24 / tickEveryH + 1 }, (_, i) => i * tickEveryH);

  const bubbleLeft = (x: number) =>
    Math.min(Math.max(x - BUBBLE_WIDTH / 2, 0), Math.max(trackWidth - BUBBLE_WIDTH, 0));

  const renderBubble = (min: number, key: string) => (
    <View key={key} style={[styles.bubble, { left: bubbleLeft(minutesToX(min, trackWidth)) }]}>
      <Text style={styles.bubbleText}>{minutesToTime(min)}</Text>
    </View>
  );

  return (
    <View>
      {/* Hour ruler */}
      <View style={styles.rulerRow}>
        {measured &&
          hourLabels.map((h) => {
            const x = minutesToX(h * 60, trackWidth);
            const left = Math.min(Math.max(x - 12, 0), trackWidth - 24);
            return (
              <Text key={h} style={[styles.rulerLabel, { left }]}>
                {h.toString().padStart(2, '0')}
              </Text>
            );
          })}
      </View>

      {/* Track */}
      <View
        ref={trackRef}
        testID="time-range-track"
        onLayout={onTrackLayout}
        {...panHandlers}
        style={[
          styles.trackWrap,
          Platform.OS === 'web' &&
            ({ touchAction: 'none', userSelect: 'none' } as Record<string, string>),
        ]}
      >
        <View style={styles.trackBase} />

        {measured &&
          hourTicks.map((h) => (
            <View
              key={`tick-${h}`}
              style={[styles.tick, { left: minutesToX(h * 60, trackWidth) }]}
            />
          ))}

        {/* Blocked zones — rendered at exact fractional x, never snapped */}
        {measured &&
          blocked.map((b, i) => {
            const left = minutesToX(b.startMin, trackWidth);
            const width = Math.max(minutesToX(b.endMin, trackWidth) - left, 2);
            return <View key={`blocked-${i}`} style={[styles.blockedZone, { left, width }]} />;
          })}

        {/* Selected range */}
        {measured && (
          <View
            style={[
              styles.rangeFill,
              { left: xStart, width: Math.max(xEnd - xStart, 2) },
              conflict && styles.rangeFillConflict,
            ]}
          />
        )}

        {/* Handles */}
        {measured && (
          <>
            <View
              testID="time-range-handle-start"
              accessibilityRole="adjustable"
              accessibilityLabel="Session start time"
              accessibilityValue={{ text: startTime }}
              style={[
                styles.handle,
                { left: xStart - HANDLE_SIZE / 2 },
                dragMode === 'start' && styles.handleActive,
              ]}
            />
            <View
              testID="time-range-handle-end"
              accessibilityRole="adjustable"
              accessibilityLabel="Session end time"
              accessibilityValue={{ text: endTime }}
              style={[
                styles.handle,
                { left: xEnd - HANDLE_SIZE / 2 },
                dragMode === 'end' && styles.handleActive,
              ]}
            />
          </>
        )}

        {/* Time bubbles while dragging */}
        {measured && dragMode === 'start' && renderBubble(startMin, 'b-start')}
        {measured && dragMode === 'end' && renderBubble(endMin, 'b-end')}
        {measured && dragMode === 'range' && (
          <>
            {renderBubble(startMin, 'b-start')}
            {renderBubble(endMin, 'b-end')}
          </>
        )}
      </View>

      <TimeRangeSliderControls
        startMin={startMin}
        endMin={endMin}
        slotDurationMinutes={slotDurationMinutes}
        conflict={conflict}
        onSet={(s, e) => onChange(minutesToTime(s), minutesToTime(e))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  rulerRow: {
    height: 16,
    marginBottom: 2,
  },
  rulerLabel: {
    position: 'absolute',
    width: 24,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textLight,
  },
  trackWrap: {
    height: 48,
    justifyContent: 'center',
    // Room for the drag bubbles above the handles.
    marginTop: 26,
  },
  trackBase: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.borderLight,
    width: '100%',
  },
  tick: {
    position: 'absolute',
    width: 1,
    height: 10,
    backgroundColor: Colors.border,
    top: 19,
  },
  blockedZone: {
    position: 'absolute',
    height: 14,
    top: 17,
    borderRadius: 4,
    backgroundColor: Colors.goldLight,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  rangeFill: {
    position: 'absolute',
    height: 6,
    top: 21,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  rangeFillConflict: {
    backgroundColor: Colors.gold,
  },
  handle: {
    position: 'absolute',
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    top: 12,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
    ...crossPlatformShadow({
      color: Colors.shadowDark,
      offsetY: 2,
      opacity: 0.2,
      radius: 4,
      elevation: 3,
    }),
  },
  handleActive: {
    backgroundColor: Colors.primary,
  },
  bubble: {
    position: 'absolute',
    top: -22,
    width: BUBBLE_WIDTH,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  bubbleText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.white,
  },
});
