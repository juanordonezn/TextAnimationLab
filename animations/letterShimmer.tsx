/**
 * Letter Shimmer — Letters slide in with a color shimmer wave.
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

function splitChars(text: string): string[] {
  return text.split('');
}

function computeCharDelays(
  chars: string[],
  staggerMs: number,
  punctDelay: boolean,
): number[] {
  if (!punctDelay) return chars.map((_, i) => i * staggerMs);
  const delays: number[] = [];
  let cumulative = 0;
  for (let i = 0; i < chars.length; i++) {
    delays.push(cumulative);
    cumulative += staggerMs;
    if ('.!?'.includes(chars[i])) cumulative += CONFIG.punctPauseLong;
    else if (chars[i] === ',') cumulative += CONFIG.punctPauseShort;
  }
  return delays;
}

// ---------------------------------------------------------------------------
// ShimmerChar
// ---------------------------------------------------------------------------

interface ShimmerCharProps {
  char: string;
  index: number;
  totalChars: number;
  delay: number;
  isPlaying: boolean;
  shimmerPos: SharedValue<number>;
}

const ShimmerChar: React.FC<ShimmerCharProps> = ({
  char,
  index,
  totalChars,
  delay,
  isPlaying,
  shimmerPos,
}) => {
  const translateX = useSharedValue(20);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      translateX.value = 20;
      opacity.value = 0;

      translateX.value = withDelay(
        delay,
        withTiming(0, { duration: 400, easing: Easing.out(Easing.poly(4)) }),
      );

      opacity.value = withDelay(
        delay,
        withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) }),
      );
    } else {
      translateX.value = 20;
      opacity.value = 0;
    }
  }, [isPlaying, delay]);

  const charPos = totalChars > 0 ? index / (totalChars / 4) : 0;

  const intensity = useDerivedValue(() => {
    const dist = Math.abs(shimmerPos.value - charPos);
    return Math.max(0, 1 - dist * 0.6);
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

  const displayChar = char === ' ' ? '\u00A0' : char;

  return (
    <Animated.Text style={[styles.char, animatedStyle]}>
      {displayChar}
    </Animated.Text>
  );
};

// ---------------------------------------------------------------------------
// LetterShimmer
// ---------------------------------------------------------------------------

export const LetterShimmer: React.FC<TextAnimationProps> = ({
  text,
  isPlaying,
  punctuationDelay = true,
}) => {
  const words = useMemo(() => splitWords(text), [text]);
  const chars = useMemo(() => splitChars(text), [text]);
  const delays = useMemo(
    () => computeCharDelays(chars, 25, punctuationDelay),
    [chars, punctuationDelay],
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
      {chars.map((char, i) => (
        <ShimmerChar
          key={`${i}-${char}`}
          char={char}
          index={i}
          totalChars={chars.length}
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
  char: {
    fontSize: CONFIG.fontSize,
    fontWeight: CONFIG.fontWeight,
    color: CONFIG.color,
  },
});

export default LetterShimmer;
