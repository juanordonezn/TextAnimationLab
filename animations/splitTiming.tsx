/**
 * Split Timing — First 60% of words enter, pause, then remaining words complete.
 *
 * Self-contained — copy this file to your project.
 * Requires: react-native-reanimated
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
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
  return text.split(' ').filter((w) => w.length > 0);
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

function computeSplitDelays(
  words: string[],
  pDelay: boolean,
): number[] {
  const splitAt = Math.ceil(words.length * 0.6);
  const group1 = words.slice(0, splitAt);
  const group2 = words.slice(splitAt);
  const g1Delays = computeWordDelays(group1, 100, pDelay);
  const g2Delays = computeWordDelays(group2, 100, pDelay);
  const g1End =
    g1Delays.length > 0 ? g1Delays[g1Delays.length - 1] + 100 : 0;
  return [...g1Delays, ...g2Delays.map((d) => d + g1End + 400)];
}

// ---------------------------------------------------------------------------
// SplitTimingWord
// ---------------------------------------------------------------------------

interface SplitTimingWordProps {
  word: string;
  delay: number;
  isPlaying: boolean;
}

const SplitTimingWord: React.FC<SplitTimingWordProps> = ({
  word,
  delay,
  isPlaying,
}) => {
  const translateY = useSharedValue(20);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      translateY.value = 20;
      opacity.value = 0;

      translateY.value = withDelay(
        delay,
        withTiming(0, { duration: 450, easing: Easing.out(Easing.poly(4)) }),
      );

      opacity.value = withDelay(
        delay,
        withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) }),
      );
    } else {
      translateY.value = 20;
      opacity.value = 0;
    }
  }, [isPlaying, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.Text style={[styles.word, animatedStyle]}>
      {word}{' '}
    </Animated.Text>
  );
};

// ---------------------------------------------------------------------------
// SplitTiming
// ---------------------------------------------------------------------------

export const SplitTiming: React.FC<TextAnimationProps> = ({
  text,
  isPlaying,
  punctuationDelay = true,
}) => {
  const words = useMemo(() => splitWords(text), [text]);
  const delays = useMemo(
    () => computeSplitDelays(words, punctuationDelay),
    [words, punctuationDelay],
  );

  return (
    <View style={styles.row}>
      {words.map((word, i) => (
        <SplitTimingWord
          key={`${i}-${word}`}
          word={word}
          delay={delays[i]}
          isPlaying={isPlaying}
        />
      ))}
    </View>
  );
};

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

export default SplitTiming;
