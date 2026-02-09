/**
 * Typewriter — Characters appear one by one with blinking cursor
 *
 * Uses useState + setTimeout to reveal characters sequentially (80ms per char).
 * Punctuation delays: .!? adds punctPauseLong, comma adds punctPauseShort.
 * Cursor blinks via withRepeat + withSequence on opacity.
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TextAnimationProps {
  text: string;
  isPlaying: boolean;
  punctuationDelay?: boolean;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CONFIG = {
  fontSize: 20,
  fontWeight: '600' as const,
  color: '#000000',
  punctPauseLong: 300,
  punctPauseShort: 150,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Typewriter({ text, isPlaying, punctuationDelay = false }: TextAnimationProps) {
  const [visibleChars, setVisibleChars] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorOpacity = useSharedValue(1);

  // Cursor blink
  useEffect(() => {
    if (isPlaying) {
      cursorOpacity.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 400 }),
          withTiming(1, { duration: 400 }),
        ),
        -1,
        true,
      );
    } else {
      cancelAnimation(cursorOpacity);
      cursorOpacity.value = 0;
    }
  }, [isPlaying]);

  // Typing logic
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (!isPlaying) {
      setVisibleChars(0);
      return;
    }

    setVisibleChars(0);

    let index = 0;

    function typeNext() {
      if (index >= text.length) return;

      index++;
      setVisibleChars(index);

      if (index >= text.length) return;

      let delay = 80;

      if (punctuationDelay) {
        const justTyped = text[index - 1];
        if ('.!?'.includes(justTyped)) {
          delay += CONFIG.punctPauseLong;
        } else if (justTyped === ',') {
          delay += CONFIG.punctPauseShort;
        }
      }

      timeoutRef.current = setTimeout(typeNext, delay);
    }

    timeoutRef.current = setTimeout(typeNext, 80);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isPlaying, text, punctuationDelay]);

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  return (
    <View style={styles.typewriterRow}>
      <Text style={styles.line}>{text.slice(0, visibleChars)}</Text>
      {isPlaying && (
        <Animated.Text style={[styles.cursor, cursorStyle]}>|</Animated.Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  typewriterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 30,
  },
  line: {
    fontSize: CONFIG.fontSize,
    fontWeight: CONFIG.fontWeight,
    color: CONFIG.color,
  },
  cursor: {
    fontSize: CONFIG.fontSize,
    fontWeight: '300' as const,
    color: CONFIG.color,
    marginLeft: -1,
  },
});

export default Typewriter;
