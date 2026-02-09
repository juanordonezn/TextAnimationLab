/**
 * Blur Reveal — Text starts blurred and focuses word by word.
 *
 * Self-contained — copy this file to your project.
 * Requires: react-native-reanimated
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
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

// ---------------------------------------------------------------------------
// BlurRevealWord
// ---------------------------------------------------------------------------

interface BlurRevealWordProps {
  word: string;
  delay: number;
  isPlaying: boolean;
}

const BlurRevealWord: React.FC<BlurRevealWordProps> = ({
  word,
  delay,
  isPlaying,
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      progress.value = 0;

      progress.value = withDelay(
        delay,
        withTiming(1, { duration: 700, easing: Easing.out(Easing.poly(3)) }),
      );
    } else {
      progress.value = 0;
    }
  }, [isPlaying, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4, 1], [0, 0.3, 1]),
    transform: [
      { scale: interpolate(progress.value, [0, 1], [1.08, 1]) },
      { translateY: interpolate(progress.value, [0, 1], [4, 0]) },
    ],
    textShadowRadius: interpolate(
      progress.value,
      [0, 0.6, 1],
      [20, 4, 0],
    ),
    textShadowColor: interpolateColor(
      progress.value,
      [0, 0.6, 1],
      ['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0)'],
    ),
    textShadowOffset: { width: 0, height: 0 },
    color: interpolateColor(
      progress.value,
      [0, 0.5, 1],
      ['rgba(0,0,0,0)', 'rgba(0,0,0,0.4)', CONFIG.color],
    ),
  }));

  return (
    <Animated.Text style={[styles.word, animatedStyle]}>
      {word}{' '}
    </Animated.Text>
  );
};

// ---------------------------------------------------------------------------
// BlurReveal
// ---------------------------------------------------------------------------

export const BlurReveal: React.FC<TextAnimationProps> = ({
  text,
  isPlaying,
  punctuationDelay = true,
}) => {
  const words = useMemo(() => splitWords(text), [text]);
  const delays = useMemo(
    () => computeWordDelays(words, 180, punctuationDelay),
    [words, punctuationDelay],
  );

  return (
    <View style={styles.row}>
      {words.map((word, i) => (
        <BlurRevealWord
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

export default BlurReveal;
