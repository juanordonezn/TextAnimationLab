/**
 * Skew Pop — Words appear, then the 3rd word gets skew + color emphasis.
 *
 * Self-contained — copy this file to your project.
 * Requires: react-native-reanimated
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
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
// SkewPopWord
// ---------------------------------------------------------------------------

interface SkewPopWordProps {
  word: string;
  delay: number;
  isPlaying: boolean;
  isEmphasis: boolean;
}

const SkewPopWord: React.FC<SkewPopWordProps> = ({
  word,
  delay,
  isPlaying,
  isEmphasis,
}) => {
  const opacity = useSharedValue(0);
  const skewX = useSharedValue(0);
  const colorProgress = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      opacity.value = 0;
      skewX.value = 0;
      colorProgress.value = 0;

      opacity.value = withDelay(
        delay,
        withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) }),
      );

      if (isEmphasis) {
        skewX.value = withDelay(
          600,
          withSequence(
            withTiming(-12, {
              duration: 200,
              easing: Easing.out(Easing.quad),
            }),
            withTiming(0, {
              duration: 400,
              easing: Easing.out(Easing.elastic(1.5)),
            }),
          ),
        );

        colorProgress.value = withDelay(
          600,
          withTiming(1, { duration: 400 }),
        );
      }
    } else {
      opacity.value = 0;
      skewX.value = 0;
      colorProgress.value = 0;
    }
  }, [isPlaying, delay, isEmphasis]);

  const animatedStyle = useAnimatedStyle(() => {
    const color = isEmphasis
      ? interpolateColor(
          colorProgress.value,
          [0, 1],
          [CONFIG.color, CONFIG.accentColor],
        )
      : CONFIG.color;

    return {
      opacity: opacity.value,
      color,
      transform: [{ skewX: `${skewX.value}deg` }],
    };
  });

  return (
    <Animated.Text
      style={[
        styles.word,
        isEmphasis && styles.emphasisWeight,
        animatedStyle,
      ]}
    >
      {word}{' '}
    </Animated.Text>
  );
};

// ---------------------------------------------------------------------------
// SkewPop
// ---------------------------------------------------------------------------

export const SkewPop: React.FC<TextAnimationProps> = ({
  text,
  isPlaying,
  punctuationDelay = true,
}) => {
  const words = useMemo(() => splitWords(text), [text]);
  const delays = useMemo(
    () => computeWordDelays(words, 80, punctuationDelay),
    [words, punctuationDelay],
  );
  const emphasisIndex = Math.min(2, words.length - 1);

  return (
    <View style={styles.row}>
      {words.map((word, i) => (
        <SkewPopWord
          key={`${i}-${word}`}
          word={word}
          delay={delays[i]}
          isPlaying={isPlaying}
          isEmphasis={i === emphasisIndex}
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
  emphasisWeight: {
    fontWeight: '800' as const,
  },
});

export default SkewPop;
