/**
 * Rapid Fire — Words appear aggressively fast with tight stagger
 *
 * Each word translates from x=30 -> 0 (250ms, poly(5) out)
 * and fades opacity 0 -> 1 (150ms).
 * Stagger: 110ms between words.
 */

import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
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

const { out, poly } = Easing;

function RapidWord({
  word,
  delay,
  isPlaying,
}: {
  word: string;
  delay: number;
  isPlaying: boolean;
}) {
  const translateX = useSharedValue(30);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      translateX.value = 30;
      opacity.value = 0;

      translateX.value = withDelay(
        delay,
        withTiming(0, { duration: 250, easing: out(poly(5)) }),
      );

      opacity.value = withDelay(delay, withTiming(1, { duration: 150 }));
    } else {
      translateX.value = 30;
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

export function RapidFire({ text, isPlaying, punctuationDelay = false }: TextAnimationProps) {
  const words = useMemo(() => splitWords(text), [text]);
  const delays = useMemo(() => computeWordDelays(words, 110, punctuationDelay), [words, punctuationDelay]);

  return (
    <View style={styles.row}>
      {words.map((word, i) => (
        <RapidWord
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

export default RapidFire;
