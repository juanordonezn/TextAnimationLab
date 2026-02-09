/**
 * Line Slide — Words slide from right to center with tight stagger.
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
// LineSlideWord
// ---------------------------------------------------------------------------

interface LineSlideWordProps {
  word: string;
  delay: number;
  isPlaying: boolean;
}

const LineSlideWord: React.FC<LineSlideWordProps> = ({
  word,
  delay,
  isPlaying,
}) => {
  const translateX = useSharedValue(200);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      translateX.value = 200;
      opacity.value = 0;

      translateX.value = withDelay(
        delay,
        withTiming(0, { duration: 800, easing: Easing.out(Easing.poly(5)) }),
      );

      opacity.value = withDelay(
        delay,
        withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }),
      );
    } else {
      translateX.value = 200;
      opacity.value = 0;
    }
  }, [isPlaying, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.Text style={[styles.word, animatedStyle]}>
      {word}{' '}
    </Animated.Text>
  );
};

// ---------------------------------------------------------------------------
// LineSlide
// ---------------------------------------------------------------------------

export const LineSlide: React.FC<TextAnimationProps> = ({
  text,
  isPlaying,
  punctuationDelay = true,
}) => {
  const words = useMemo(() => splitWords(text), [text]);
  const delays = useMemo(
    () => computeWordDelays(words, 30, punctuationDelay),
    [words, punctuationDelay],
  );

  return (
    <View style={styles.row}>
      {words.map((word, i) => (
        <LineSlideWord
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

export default LineSlide;
