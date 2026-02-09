/**
 * Slam In — Words slide from right with overshoot bounce
 *
 * Each word translates from x=60 with a three-stage sequence:
 *   1. Slam to 0 (180ms, poly(5) out)
 *   2. Bounce back to 5 (80ms, quad out)
 *   3. Settle to 0 (150ms, quad out)
 * Opacity fades 0 -> 1 in 100ms.
 * Stagger: 100ms between words.
 */

import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
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
// Helpers
// ---------------------------------------------------------------------------

function splitWords(text: string): string[] {
  return text.split(' ').filter(w => w.length > 0);
}

function computeWordDelays(
  words: string[],
  staggerMs: number,
  punctDelay: boolean,
): number[] {
  if (!punctDelay) return words.map((_, i) => i * staggerMs);
  const delays: number[] = [];
  let cumulative = 0;
  for (let i = 0; i < words.length; i++) {
    delays.push(cumulative);
    cumulative += staggerMs;
    const last = words[i].slice(-1);
    if ('.!?'.includes(last)) cumulative += CONFIG.punctPauseLong;
    else if (last === ',') cumulative += CONFIG.punctPauseShort;
  }
  return delays;
}

// ---------------------------------------------------------------------------
// Animated Word
// ---------------------------------------------------------------------------

const { out, poly, quad } = Easing;

function SlamWord({
  word,
  delay,
  isPlaying,
}: {
  word: string;
  delay: number;
  isPlaying: boolean;
}) {
  const translateX = useSharedValue(60);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      translateX.value = 60;
      opacity.value = 0;

      translateX.value = withDelay(
        delay,
        withSequence(
          withTiming(0, { duration: 180, easing: out(poly(5)) }),
          withTiming(5, { duration: 80, easing: out(quad) }),
          withTiming(0, { duration: 150, easing: out(quad) }),
        ),
      );

      opacity.value = withDelay(delay, withTiming(1, { duration: 100 }));
    } else {
      translateX.value = 60;
      opacity.value = 0;
    }
  }, [isPlaying, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[styles.word, animatedStyle]}>
      {word}{' '}
    </Animated.Text>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SlamIn({ text, isPlaying, punctuationDelay = false }: TextAnimationProps) {
  const words = useMemo(() => splitWords(text), [text]);
  const delays = useMemo(() => computeWordDelays(words, 100, punctuationDelay), [words, punctuationDelay]);

  return (
    <View style={styles.row}>
      {words.map((word, i) => (
        <SlamWord
          key={`${word}-${i}`}
          word={word}
          delay={delays[i]}
          isPlaying={isPlaying}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    minHeight: 30,
  },
  word: {
    fontSize: CONFIG.fontSize,
    fontWeight: CONFIG.fontWeight,
    color: CONFIG.color,
  },
});

export default SlamIn;
