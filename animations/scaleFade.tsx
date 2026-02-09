/**
 * Scale Fade — Each word grows from small to full size with fade.
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

// ---------------------------------------------------------------------------
// ScaleFadeWord
// ---------------------------------------------------------------------------

interface ScaleFadeWordProps {
  word: string;
  delay: number;
  isPlaying: boolean;
}

const ScaleFadeWord: React.FC<ScaleFadeWordProps> = ({
  word,
  delay,
  isPlaying,
}) => {
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      scale.value = 0.85;
      opacity.value = 0;

      scale.value = withDelay(
        delay,
        withTiming(1, { duration: 500, easing: Easing.out(Easing.poly(3)) }),
      );

      opacity.value = withDelay(
        delay,
        withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) }),
      );
    } else {
      scale.value = 0.85;
      opacity.value = 0;
    }
  }, [isPlaying, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.Text style={[styles.word, animatedStyle]}>
      {word}{' '}
    </Animated.Text>
  );
};

// ---------------------------------------------------------------------------
// ScaleFade
// ---------------------------------------------------------------------------

export const ScaleFade: React.FC<TextAnimationProps> = ({
  text,
  isPlaying,
  punctuationDelay = true,
}) => {
  const words = useMemo(() => splitWords(text), [text]);
  const delays = useMemo(
    () => computeWordDelays(words, 100, punctuationDelay),
    [words, punctuationDelay],
  );

  return (
    <View style={styles.row}>
      {words.map((word, i) => (
        <ScaleFadeWord
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

export default ScaleFade;
