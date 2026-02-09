# Text Animation Lab

A collection of 12 production-ready text animations for React Native, built with [Reanimated](https://docs.swmansion.com/react-native-reanimated/).

Each animation is a **single self-contained file** — no shared dependencies, no setup. Copy the file you want into your project and use it.

https://github.com/user-attachments/assets/REPLACE_WITH_VIDEO_ID

## Animations

| # | Animation | Type | Description |
|---|-----------|------|-------------|
| 1 | **Soft Fade** | char | Letters fade in with crescendo scale toward punctuation |
| 2 | **Line Slide** | word | Words slide from right to center with tight stagger |
| 3 | **Scale Fade** | word | Words grow from 0.85 to full size with fade |
| 4 | **Blur Reveal** | word | Text starts blurred and focuses word by word |
| 5 | **Split Timing** | word | First 60% of words enter, pause, then the rest complete |
| 6 | **Skew Pop** | word | Words appear, then one word gets skew + color emphasis |
| 7 | **Word Shimmer** | word | Words slide in with a continuous color shimmer wave |
| 8 | **Letter Shimmer** | char | Letters slide in with a continuous color shimmer wave |
| 9 | **Slam In** | word | Words slam from right with overshoot bounce |
| 10 | **Rapid Fire** | word | Words appear aggressively fast |
| 11 | **Elastic Snap** | word | Words snap into position with elastic spring |
| 12 | **Typewriter** | char | Characters appear one by one with blinking cursor |

## Quick Start

### Use a single animation

1. Copy any file from `animations/` into your project
2. Import and use:

```tsx
import { SoftFade } from './softFade';

<SoftFade text="Hello world" isPlaying={true} />
```

That's it. Each file is fully self-contained.

### Run the showcase app

```bash
git clone https://github.com/juanordonezn/TextAnimationLab.git
cd TextAnimationLab
npm install
npx expo run:ios          # iOS (requires macOS + Xcode)
npx expo run:android      # Android (requires Android Studio)
```

## Props

Every animation accepts the same interface:

```typescript
interface TextAnimationProps {
  text: string;                  // The text to animate
  isPlaying: boolean;            // true = play, false = reset
  punctuationDelay?: boolean;    // Pause after . , ! ? (default varies)
}
```

## Customization

Each file has a `CONFIG` object at the top. Edit it to match your design:

```typescript
const CONFIG = {
  fontSize: 20,
  fontWeight: '600',
  color: '#000000',
  accentColor: '#FC2D50',     // Shimmer/emphasis color (some animations)
  punctPauseLong: 300,         // Pause after . ! ? (ms)
  punctPauseShort: 150,        // Pause after , (ms)
};
```

## Requirements

- React Native
- [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/) (v3 or v4)

No other dependencies. No Expo-specific APIs.

## File Structure

```
TextAnimationLab/
├── animations/
│   ├── softFade.tsx          # 195 lines
│   ├── lineSlide.tsx         # 163 lines
│   ├── scaleFade.tsx         # 163 lines
│   ├── blurReveal.tsx        # 176 lines
│   ├── splitTiming.tsx       # 177 lines
│   ├── skewPop.tsx           # 209 lines
│   ├── wordShimmer.tsx       # 210 lines
│   ├── letterShimmer.tsx     # 221 lines
│   ├── slamIn.tsx            # 162 lines
│   ├── rapidFire.tsx         # 154 lines
│   ├── elasticSnap.tsx       # 165 lines
│   └── typewriter.tsx        # 154 lines
├── App.tsx                    # Showcase app
├── package.json
└── ...
```

## License

MIT
