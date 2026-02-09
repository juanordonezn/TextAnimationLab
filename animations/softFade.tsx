/**
 * Soft Fade — Letters fade in with crescendo scale toward punctuation marks.
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
  withSequence,
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

function computeCharCrescendo(chars: string[]): number[] {
  const intensities: number[] = new Array(chars.length).fill(0);
  let groupStart = 0;
  for (let i = 0; i < chars.length; i++) {
    if ('.!?'.includes(chars[i]) || i === chars.length - 1) {
      const groupSize = i - groupStart + 1;
      for (let j = groupStart; j <= i; j++) {
        intensities[j] = (j - groupStart + 1) / groupSize;
      }
      groupStart = i + 1;
    }
  }
  return intensities;
}

// ---------------------------------------------------------------------------
// SoftFadeChar
// ---------------------------------------------------------------------------

interface SoftFadeCharProps {
  char: string;
  delay: number;
  intensity: number;
  isPlaying: boolean;
}

const SoftFadeChar: React.FC<SoftFadeCharProps> = ({
  char,
  delay,
  intensity,
  isPlaying,
}) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);

  const peakScale = 1 + intensity * 0.4;

  useEffect(() => {
    if (isPlaying) {
      opacity.value = 0;
      scale.value = 1;

      opacity.value = withDelay(
        delay,
        withTiming(1, { duration: 250, easing: Easing.out(Easing.quad) }),
      );

      scale.value = withDelay(
        delay,
        withSequence(
          withTiming(peakScale, {
            duration: 250,
            easing: Easing.out(Easing.quad),
          }),
          withTiming(1, {
            duration: 300,
            easing: Easing.out(Easing.poly(3)),
          }),
        ),
      );
    } else {
      opacity.value = 0;
      scale.value = 1;
    }
  }, [isPlaying, delay, peakScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const displayChar = char === ' ' ? '\u00A0' : char;

  return (
    <Animated.Text style={[styles.char, animatedStyle]}>
      {displayChar}
    </Animated.Text>
  );
};

// ---------------------------------------------------------------------------
// SoftFade
// ---------------------------------------------------------------------------

export const SoftFade: React.FC<TextAnimationProps> = ({
  text,
  isPlaying,
  punctuationDelay = true,
}) => {
  const chars = useMemo(() => splitChars(text), [text]);
  const delays = useMemo(
    () => computeCharDelays(chars, 25, punctuationDelay),
    [chars, punctuationDelay],
  );
  const intensities = useMemo(() => computeCharCrescendo(chars), [chars]);

  return (
    <View style={styles.row}>
      {chars.map((char, i) => (
        <SoftFadeChar
          key={`${i}-${char}`}
          char={char}
          delay={delays[i]}
          intensity={intensities[i]}
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
  char: {
    fontSize: CONFIG.fontSize,
    fontWeight: CONFIG.fontWeight,
    color: CONFIG.color,
  },
});

export default SoftFade;
