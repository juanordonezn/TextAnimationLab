/**
 * Text Animation Lab
 * Showcase of 12 text animations with play controls, favorites,
 * custom text preview, punctuation delay, and drag-to-reorder.
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Play, Heart, Check } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withTiming,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Animations
import { SoftFade } from './animations/softFade';
import { LineSlide } from './animations/lineSlide';
import { ScaleFade } from './animations/scaleFade';
import { BlurReveal } from './animations/blurReveal';
import { SplitTiming } from './animations/splitTiming';
import { SkewPop } from './animations/skewPop';
import { WordShimmer } from './animations/wordShimmer';
import { LetterShimmer } from './animations/letterShimmer';
import { SlamIn } from './animations/slamIn';
import { RapidFire } from './animations/rapidFire';
import { ElasticSnap } from './animations/elasticSnap';
import { Typewriter } from './animations/typewriter';

// ============================================================================
// TYPES
// ============================================================================

interface AnimationEntry {
  id: string;
  label: string;
  defaultText: string;
  Component: React.ComponentType<{
    text: string;
    isPlaying: boolean;
    punctuationDelay?: boolean;
  }>;
  autoHideMs?: number;
}

// ============================================================================
// THEME
// ============================================================================

const THEME = {
  background: '#FFFFFF',
  surface: '#F9F9F9',
  surfaceHover: '#F3F3F3',
  border: '#EEEEEE',
  borderLight: '#E5E5E5',
  controlBg: '#F2F2F2',
  controlActive: '#333333',
  textPrimary: '#000000',
  textSecondary: '#999999',
  textMuted: '#CCCCCC',
  textLabel: '#AAAAAA',
  textSubtle: '#BBBBBB',
  textPlaceholder: '#DDDDDD',
  heartActive: '#FC2D50',
  clearButtonBg: '#666666',
} as const;

// ============================================================================
// ANIMATIONS REGISTRY
// ============================================================================

const ANIMATIONS: AnimationEntry[] = [
  { id: 'soft-fade', label: 'Soft Fade', defaultText: 'Words pop into place', Component: SoftFade },
  { id: 'line-slide', label: 'Line Slide', defaultText: 'Elegant motion creates focus', Component: LineSlide },
  { id: 'scale-fade', label: 'Scale Fade', defaultText: 'Grow from nothing gently', Component: ScaleFade },
  { id: 'blur-reveal', label: 'Blur Reveal', defaultText: 'Clarity unfolds with patience', Component: BlurReveal },
  { id: 'split-timing', label: 'Split Timing', defaultText: 'Rhythm defines how we read', Component: SplitTiming },
  { id: 'word-emphasis', label: 'Skew Pop', defaultText: 'Make the important stand', Component: SkewPop },
  { id: 'shimmer', label: 'Word Shimmer', defaultText: 'Light sweeps across surface', Component: WordShimmer },
  { id: 'shimmer-letters', label: 'Letter Shimmer', defaultText: 'Light sweeps across surface', Component: LetterShimmer },
  { id: 'slam-in', label: 'Slam In', defaultText: 'Crash through the silence', Component: SlamIn },
  { id: 'rapid-fire', label: 'Rapid Fire', defaultText: 'Speed reshapes perception', Component: RapidFire },
  { id: 'elastic-snap', label: 'Elastic Snap', defaultText: 'Bounce into the scene', Component: ElasticSnap },
  { id: 'typewriter', label: 'Typewriter', defaultText: 'Every letter has weight', Component: Typewriter },
];

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = '@animation_lab_likes';
const ORDER_STORAGE_KEY = '@animation_lab_order';
const AUTO_HIDE_MS = 4000;
const MAX_CHARS = 26;

// ============================================================================
// STATIC COMPONENTS
// ============================================================================

const ItemSeparator = React.memo(() => (
  <View style={styles.separator} />
));

// ============================================================================
// ANIMATION SECTION (memoized)
// ============================================================================

interface AnimationSectionProps {
  entry: AnimationEntry;
  number: number;
  isLiked: boolean;
  onToggleLike: (id: string) => void;
  customText: string;
  punctuationDelay: boolean;
  drag: () => void;
  isActive: boolean;
}

const AnimationSection = React.memo(function AnimationSection({
  entry,
  number,
  isLiked,
  onToggleLike,
  customText,
  punctuationDelay,
  drag,
  isActive,
}: AnimationSectionProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showComponent, setShowComponent] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fadeOpacity = useSharedValue(0);
  const { Component, label, id } = entry;
  const text = customText || entry.defaultText;

  const finishHide = useCallback(() => {
    setIsPlaying(false);
    setShowComponent(false);
  }, []);

  const handlePlay = useCallback(() => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);

    setIsPlaying(false);
    setShowComponent(false);
    fadeOpacity.value = 0;

    setTimeout(() => {
      setShowComponent(true);
      setIsPlaying(true);
      fadeOpacity.value = withTiming(1, { duration: 200 });

      hideTimeoutRef.current = setTimeout(() => {
        fadeOpacity.value = withTiming(
          0,
          { duration: 500, easing: Easing.in(Easing.quad) },
          (finished) => {
            if (finished) runOnJS(finishHide)();
          },
        );
        hideTimeoutRef.current = null;
      }, entry.autoHideMs ?? AUTO_HIDE_MS);
    }, 50);
  }, [fadeOpacity, finishHide]);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeOpacity.value,
  }));

  const numberStr = number < 10 ? `0${number}` : `${number}`;

  return (
    <ScaleDecorator activeScale={1.03}>
      <View style={[styles.section, isActive && styles.sectionActive]}>
        <View style={styles.topRow}>
          <Text style={styles.number}>{numberStr}</Text>
          <View style={styles.animationArea}>
            <Text style={styles.placeholderText}>{text}</Text>
            {showComponent && (
              <Animated.View
                style={[
                  styles.animationOverlay,
                  isActive && styles.animationOverlayActive,
                  fadeStyle,
                ]}
              >
                <Component text={text} isPlaying={isPlaying} punctuationDelay={punctuationDelay} />
              </Animated.View>
            )}
          </View>
          <TouchableOpacity
            style={styles.heartButton}
            onPress={() => onToggleLike(id)}
            activeOpacity={0.6}
          >
            <Heart
              size={18}
              color={isLiked ? THEME.heartActive : THEME.textMuted}
              fill={isLiked ? THEME.heartActive : 'transparent'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.playButton, isPlaying && styles.playButtonActive]}
            onPress={handlePlay}
            activeOpacity={0.7}
          >
            <Play size={12} color="#FFFFFF" fill="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.label}>{label}</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            onLongPress={drag}
            delayLongPress={150}
            style={styles.dragHandle}
            activeOpacity={0.5}
          >
            <View style={styles.dotGrid}>
              {[0, 1, 2].map(row => (
                <View key={row} style={styles.dotRow}>
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                </View>
              ))}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScaleDecorator>
  );
});

// ============================================================================
// MAIN SCREEN
// ============================================================================

function AnimationLabScreen() {
  const insets = useSafeAreaInsets();
  const [likes, setLikes] = useState<Set<string>>(new Set());
  const [filterLiked, setFilterLiked] = useState(false);
  const [customText, setCustomText] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [punctuationDelay, setPunctuationDelay] = useState(true);
  const [orderedAnimations, setOrderedAnimations] = useState(ANIMATIONS);
  const inputRef = useRef<TextInput>(null);

  // Scroll-driven header shadow
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerShadowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(scrollY.value, [0, 30], [0, 0.06], 'clamp'),
  }));

  // Load likes + order from storage
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        try { setLikes(new Set(JSON.parse(data))); } catch {}
      }
    });
    AsyncStorage.getItem(ORDER_STORAGE_KEY).then((data) => {
      if (data) {
        try {
          const ids: string[] = JSON.parse(data);
          const byId = new Map(ANIMATIONS.map(a => [a.id, a]));
          const sorted = ids.map(id => byId.get(id)).filter(Boolean) as AnimationEntry[];
          const savedSet = new Set(ids);
          ANIMATIONS.forEach(a => { if (!savedSet.has(a.id)) sorted.push(a); });
          setOrderedAnimations(sorted);
        } catch {}
      }
    });
  }, []);

  const saveLikes = useCallback((newLikes: Set<string>) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...newLikes]));
  }, []);

  const handleToggleLike = useCallback((id: string) => {
    setLikes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveLikes(next);
      return next;
    });
  }, [saveLikes]);

  const handleToggleFilter = useCallback(() => {
    setFilterLiked((prev) => !prev);
  }, []);

  const saveOrder = useCallback((list: AnimationEntry[]) => {
    AsyncStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(list.map(a => a.id)));
  }, []);

  const handleDragEnd = useCallback(({ data }: { data: AnimationEntry[] }) => {
    setOrderedAnimations(data);
    saveOrder(data);
  }, [saveOrder]);

  const filteredAnimations = filterLiked
    ? orderedAnimations.filter((a) => likes.has(a.id))
    : orderedAnimations;

  const indexMap = useMemo(() => {
    const map = new Map<string, number>();
    filteredAnimations.forEach((a, i) => map.set(a.id, i));
    return map;
  }, [filteredAnimations]);

  const likeCount = likes.size;

  const renderItem = useCallback(({ item, drag, isActive }: RenderItemParams<AnimationEntry>) => {
    const index = indexMap.get(item.id) ?? 0;
    return (
      <AnimationSection
        entry={item}
        number={index + 1}
        isLiked={likes.has(item.id)}
        onToggleLike={handleToggleLike}
        customText={customText}
        punctuationDelay={punctuationDelay}
        drag={drag}
        isActive={isActive}
      />
    );
  }, [likes, handleToggleLike, indexMap, customText, punctuationDelay]);

  const keyExtractor = useCallback((item: AnimationEntry) => item.id, []);

  const ListHeader = useMemo(() => (
    <View style={styles.scrollContent}>
      <View style={styles.customTextCard}>
        <View style={styles.customTextHeader}>
          <Text style={styles.customTextLabel}>Custom text</Text>
          <View style={{ flex: 1 }} />
          <Text style={styles.customTextCount}>
            {customText.length}/{MAX_CHARS}
          </Text>
          <TouchableOpacity
            style={[styles.customTextClear, customText.length === 0 && { opacity: 0 }]}
            onPress={() => {
              setCustomText('');
              inputRef.current?.blur();
            }}
            activeOpacity={0.6}
            disabled={customText.length === 0}
          >
            <X size={12} color="#FFFFFF" strokeWidth={3} />
          </TouchableOpacity>
        </View>
        <View style={styles.customTextInputRow}>
          <TextInput
            ref={inputRef}
            style={styles.customTextInput}
            value={customText}
            onChangeText={(t) => setCustomText(t.slice(0, MAX_CHARS))}
            placeholder="Type to preview on all animations..."
            placeholderTextColor={THEME.textMuted}
            maxLength={MAX_CHARS}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={() => inputRef.current?.blur()}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
          />
          {inputFocused && (
            <TouchableOpacity
              style={styles.customTextDone}
              onPress={() => inputRef.current?.blur()}
              activeOpacity={0.7}
            >
              <Check size={14} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.chipRow}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>Pause after punctuation</Text>
          <TouchableOpacity
            onPress={() => setPunctuationDelay(prev => !prev)}
            activeOpacity={0.7}
            style={[styles.toggle, punctuationDelay && styles.toggleActive]}
          >
            <Animated.View style={[styles.toggleThumb, punctuationDelay && styles.toggleThumbActive]} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ), [customText, punctuationDelay, inputFocused]);

  const ListEmpty = useMemo(() => (
    <View style={styles.emptyState}>
      <Heart size={32} color={THEME.textPlaceholder} />
      <Text style={styles.emptyText}>No liked animations yet</Text>
    </View>
  ), []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <Animated.View style={[styles.header, { paddingTop: insets.top + 8 }, headerShadowStyle]}>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Text Animation Lab</Text>
          <Text style={styles.subtitle}>
            {filterLiked
              ? `${filteredAnimations.length} liked`
              : `${ANIMATIONS.length} animations`}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.filterButton, filterLiked && styles.filterButtonActive]}
          onPress={handleToggleFilter}
          activeOpacity={0.7}
        >
          <Heart
            size={14}
            color={filterLiked ? '#FFFFFF' : THEME.textPrimary}
            fill={filterLiked ? '#FFFFFF' : 'transparent'}
          />
          {likeCount > 0 && (
            <Text style={[styles.filterCount, filterLiked && styles.filterCountActive]}>
              {likeCount}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>

      <DraggableFlatList
        data={filteredAnimations}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onDragEnd={handleDragEnd}
        onScrollOffsetChange={() => {}}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        ItemSeparatorComponent={ItemSeparator}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        activationDistance={10}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      />
    </View>
  );
}

// ============================================================================
// APP WRAPPER
// ============================================================================

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AnimationLabScreen />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: THEME.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  headerTitle: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: THEME.textSecondary,
    marginTop: 1,
  },
  customTextCard: {
    backgroundColor: THEME.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    marginBottom: 32,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: THEME.border,
  },
  customTextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 28,
    marginBottom: 8,
  },
  customTextLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.textSubtle,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  customTextInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 28,
  },
  customTextInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: THEME.textPrimary,
    padding: 0,
  },
  customTextClear: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.clearButtonBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  customTextCount: {
    fontSize: 11,
    fontWeight: '500',
    color: THEME.textMuted,
  },
  customTextDone: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: THEME.controlBg,
    marginTop: 4,
  },
  filterButtonActive: {
    backgroundColor: THEME.textPrimary,
  },
  filterCount: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.textPrimary,
  },
  filterCountActive: {
    color: '#FFFFFF',
  },
  section: {
    paddingVertical: 28,
    paddingHorizontal: 24,
    backgroundColor: THEME.background,
  },
  sectionActive: {
    backgroundColor: THEME.surfaceHover,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  number: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.textMuted,
    width: 24,
    letterSpacing: 0.5,
  },
  animationArea: {
    flex: 1,
    minHeight: 30,
    justifyContent: 'center',
  },
  animationOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    backgroundColor: THEME.background,
  },
  animationOverlayActive: {
    backgroundColor: THEME.surfaceHover,
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: '600',
    color: THEME.textPlaceholder,
  },
  heartButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 24,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 2,
  },
  playButtonActive: {
    backgroundColor: THEME.controlActive,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: THEME.textLabel,
    letterSpacing: 0.3,
  },
  dragHandle: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotGrid: {
    gap: 4,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.textMuted,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: THEME.borderLight,
    marginHorizontal: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    color: THEME.textMuted,
  },
  chipRow: {
    flexDirection: 'row',
    marginTop: -20,
    marginBottom: 24,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: THEME.border,
    backgroundColor: THEME.background,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.textPrimary,
  },
  toggle: {
    width: 36,
    height: 22,
    borderRadius: 11,
    backgroundColor: THEME.textMuted,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: THEME.textPrimary,
  },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
});
