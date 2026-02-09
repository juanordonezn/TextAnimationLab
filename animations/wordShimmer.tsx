/**
 * Word Shimmer — Words fade in with a color shimmer wave sweeping across.
 *
 * Self-contained — copy this file to your project.
 * Requires: react-native-reanimated
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

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
  accentColor: '#FC2D50',
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
// ShimmerWord
// ---------------------------------------------------------------------------

interface ShimmerWordProps {
  word: string;
  index: number;
  delay: number;
  isPlaying: boolean;
  shimmerPos: SharedValue<number>;
}

const ShimmerWord: React.FC<ShimmerWordProps> = ({
  word,
  index,
  delay,
  isPlaying,
  shimmerPos,
}) => {
  const translateX = useSharedValue(50);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      translateX.value = 50;
      opacity.value = 0;

      translateX.value = withDelay(
        delay,
        withTiming(0, { duration: 500, easing: Easing.out(Easing.poly(5)) }),
      );

      opacity.value = withDelay(
        delay,
        withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) }),
      );
    } else {
      translateX.value = 50;
      opacity.value = 0;
    }
  }, [isPlaying, delay]);

  const intensity = useDerivedValue(() => {
    const dist = Math.abs(shimmerPos.value - index);
    return Math.max(0, 1 - dist * 0.8);
  });

  const animatedStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      intensity.value,
      [0, 1],
      [CONFIG.color, CONFIG.accentColor],
    );

    return {
      opacity: opacity.value,
      color,
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <Animated.Text style={[styles.word, animatedStyle]}>
      {word}{' '}
    </Animated.Text>
  );
};

// ---------------------------------------------------------------------------
// WordShimmer
// ---------------------------------------------------------------------------

export const WordShimmer: React.FC<TextAnimationProps> = ({
  text,
  isPlaying,
  punctuationDelay = true,
}) => {
  const words = useMemo(() => splitWords(text), [text]);
  const delays = useMemo(
    () => computeWordDelays(words, 120, punctuationDelay),
    [words, punctuationDelay],
  );

  const shimmerPos = useSharedValue(-0.5);

  useEffect(() => {
    if (isPlaying) {
      shimmerPos.value = -0.5;

      const sweepDuration = words.length * 450;
      shimmerPos.value = withRepeat(
        withSequence(
          withTiming(words.length + 1, { duration: sweepDuration }),
          withTiming(-0.5, { duration: sweepDuration }),
        ),
        -1,
      );
    } else {
      cancelAnimation(shimmerPos);
      shimmerPos.value = -0.5;
    }
  }, [isPlaying, words.length]);

  return (
    <View style={styles.row}>
      {words.map((word, i) => (
        <ShimmerWord
          key={`${i}-${word}`}
          word={word}
          index={i}
          delay={delays[i]}
          isPlaying={isPlaying}
          shimmerPos={shimmerPos}
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

export default WordShimmer;
