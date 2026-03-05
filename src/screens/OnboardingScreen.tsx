/**
 * FinVista — Ultra-Premium Onboarding Intro Slider
 * Elite financial mastery journey / رحلة التحكم المالي الراقية
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Animated,
  StatusBar,
  Platform,
  ViewToken,
} from 'react-native';
import Svg, {
  Circle,
  Path,
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  G,
  Ellipse,
  Rect,
  Polygon,
  Line,
} from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { SPACING } from '../constants/theme';
import { resolveIcon } from '../constants/icons';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  bg: '#080D1A',
  bgCard: '#0F1526',
  gold: '#F0B429',
  goldSoft: '#F7D070',
  goldDim: '#8B6914',
  white: '#F9FAFB',
  whiteOff: '#CBD5E1',
  whiteMuted: '#64748B',
  blue: '#3B82F6',
  teal: '#14B8A6',
  purple: '#7C3AED',
  slide1Glow: '#1E3A8A',
  slide2Glow: '#134E4A',
  slide3Glow: '#78350F',
};

// ─── Slide Data ───────────────────────────────────────────────────────────────
const SLIDES = [
  {
    id: '1',
    number: '01',
    glowColor: C.slide1Glow,
    dotColor: C.blue,
    concept: 'AWARENESS',
    title: 'Take control of your\nmoney, effortlessly.',
    subtitle: 'Your journey to financial clarity starts here — with purpose, precision, and elegance.',
  },
  {
    id: '2',
    number: '02',
    glowColor: C.slide2Glow,
    dotColor: C.teal,
    concept: 'EMPOWERMENT',
    title: 'Track, manage, and\ngrow with confidence.',
    subtitle: 'Intelligent insights and seamless tools to put the power of wealth firmly in your hands.',
  },
  {
    id: '3',
    number: '03',
    glowColor: C.slide3Glow,
    dotColor: C.gold,
    concept: 'ACHIEVEMENT',
    title: 'Secure, smart, and\nluxurious financial growth.',
    subtitle: 'Elevate your financial legacy. This is where ambition meets achievement.',
  },
];

// ─── SVG Artworks ─────────────────────────────────────────────────────────────

/** Slide 1 — Coin (Awareness) */
function Artwork1() {
  const cx = SW / 2;
  const cy = SH * 0.21;
  const R = SW * 0.165;
  return (
    <Svg width={SW} height={SH * 0.35} viewBox={`0 0 ${SW} ${SH * 0.42}`}>
      <Defs>
        <RadialGradient id="a1glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#1D4ED8" stopOpacity="0.3" />
          <Stop offset="100%" stopColor="#080D1A" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="a1coin" cx="40%" cy="32%" r="65%">
          <Stop offset="0%" stopColor="#FFD166" />
          <Stop offset="55%" stopColor="#F0B429" />
          <Stop offset="100%" stopColor="#92650A" />
        </RadialGradient>
        <RadialGradient id="a1inner" cx="45%" cy="38%" r="55%">
          <Stop offset="0%" stopColor="#FFF8E0" stopOpacity="0.55" />
          <Stop offset="100%" stopColor="#F0B429" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* Ambient glow */}
      <Ellipse cx={cx} cy={cy} rx={SW * 0.62} ry={SH * 0.25} fill="url(#a1glow)" />

      {/* Single orbit ring */}
      <Circle cx={cx} cy={cy} r={R + SW * 0.085} stroke="#3B82F6" strokeWidth="1" fill="none"
        strokeDasharray="5 10" opacity="0.4" />
      {/* Four accent dots on ring */}
      {[0, 90, 180, 270].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const dr = R + SW * 0.085;
        return (
          <Circle key={i} cx={cx + dr * Math.cos(rad)} cy={cy + dr * Math.sin(rad)}
            r={i % 2 === 0 ? 3.5 : 2.5}
            fill={i % 2 === 0 ? C.gold : '#60A5FA'}
            opacity={i % 2 === 0 ? 0.95 : 0.65} />
        );
      })}

      {/* Coin */}
      <Circle cx={cx} cy={cy} r={R} fill="url(#a1coin)" />
      <Circle cx={cx} cy={cy} r={R - SW * 0.014} stroke="#FFD166" strokeWidth="1.5" fill="none" opacity="0.45" />
      <Circle cx={cx} cy={cy} r={R - SW * 0.03} fill="url(#a1inner)" />

      {/* $ vertical bar */}
      <Line x1={cx} y1={cy - R * 0.78} x2={cx} y2={cy + R * 0.78}
        stroke={C.bg} strokeWidth="4" strokeLinecap="round" />
      {/* $ curves */}
      <Path
        d={`M${cx + R * 0.42} ${cy - R * 0.36}
           Q${cx - R * 0.52} ${cy - R * 0.72} ${cx - R * 0.42} ${cy - R * 0.1}
           Q${cx + R * 0.52} ${cy + R * 0.14} ${cx + R * 0.42} ${cy + R * 0.38}
           Q${cx - R * 0.52} ${cy + R * 0.72} ${cx - R * 0.42} ${cy + R * 0.1}`}
        stroke={C.bg} strokeWidth="4" fill="none"
        strokeLinecap="round" strokeLinejoin="round" />

      {/* 3 sparkle crosses */}
      {[
        { x: SW * 0.14, y: SH * 0.07, s: 4 },
        { x: SW * 0.84, y: SH * 0.06, s: 3.5 },
        { x: SW * 0.5,  y: SH * 0.025, s: 3 },
      ].map((p, i) => (
        <G key={i}>
          <Line x1={p.x - p.s} y1={p.y} x2={p.x + p.s} y2={p.y} stroke={C.gold} strokeWidth="1.8" strokeLinecap="round" />
          <Line x1={p.x} y1={p.y - p.s} x2={p.x} y2={p.y + p.s} stroke={C.gold} strokeWidth="1.8" strokeLinecap="round" />
        </G>
      ))}
    </Svg>
  );
}

/** Slide 2 — Chart (Empowerment) */
function Artwork2() {
  const bars = [0.42, 0.6, 0.5, 0.78, 0.96];
  const chartW = SW * 0.68;
  const chartH = SH * 0.22;
  const chartX = (SW - chartW) / 2;
  const chartY = SH * 0.21 - chartH / 2;
  const gap = 10;
  const barW = chartW / bars.length - gap;
  const midX = (i: number) => chartX + i * (chartW / bars.length) + barW / 2;
  const topY  = (v: number) => chartY + chartH - v * chartH;
  const trendPath = bars.map((v, i) => `${i === 0 ? 'M' : 'L'}${midX(i)} ${topY(v)}`).join(' ');

  return (
    <Svg width={SW} height={SH * 0.35} viewBox={`0 0 ${SW} ${SH * 0.42}`}>
      <Defs>
        <RadialGradient id="a2glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#0F766E" stopOpacity="0.3" />
          <Stop offset="100%" stopColor="#080D1A" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id="a2barT" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#14B8A6" stopOpacity="0.85" />
          <Stop offset="100%" stopColor="#14B8A6" stopOpacity="0.08" />
        </LinearGradient>
        <LinearGradient id="a2barG" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#F0B429" stopOpacity="0.95" />
          <Stop offset="100%" stopColor="#F0B429" stopOpacity="0.1" />
        </LinearGradient>
        <LinearGradient id="a2trend" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#6EE7B7" stopOpacity="0.4" />
          <Stop offset="100%" stopColor="#F0B429" stopOpacity="1" />
        </LinearGradient>
      </Defs>

      {/* Ambient glow */}
      <Ellipse cx={SW / 2} cy={SH * 0.21} rx={SW * 0.6} ry={SH * 0.22} fill="url(#a2glow)" />

      {/* Single baseline */}
      <Line x1={chartX} y1={chartY + chartH} x2={chartX + chartW} y2={chartY + chartH}
        stroke="#14B8A6" strokeWidth="0.8" opacity="0.25" />

      {/* Bars */}
      {bars.map((v, i) => {
        const bh = v * chartH;
        const isLast = i === bars.length - 1;
        return (
          <Rect key={i}
            x={chartX + i * (chartW / bars.length) + gap / 2}
            y={chartY + chartH - bh}
            width={barW} height={bh}
            fill={isLast ? 'url(#a2barG)' : 'url(#a2barT)'}
            rx={5} />
        );
      })}

      {/* Trend line */}
      <Path d={trendPath} stroke="url(#a2trend)" strokeWidth="2.5"
        fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots on trend */}
      {bars.map((v, i) => (
        <Circle key={i} cx={midX(i)} cy={topY(v)}
          r={i === bars.length - 1 ? 6 : 3.5}
          fill={i === bars.length - 1 ? C.gold : '#14B8A6'}
          opacity={i === bars.length - 1 ? 1 : 0.65} />
      ))}

      {/* Up-arrow above last bar */}
      {(() => {
        const ax = midX(bars.length - 1);
        const ay = topY(bars[bars.length - 1]) - 20;
        return (
          <Path
            d={`M${ax} ${ay + 7} L${ax} ${ay - 7} M${ax - 5} ${ay - 2} L${ax} ${ay - 7} L${ax + 5} ${ay - 2}`}
            stroke={C.gold} strokeWidth="2.2" fill="none"
            strokeLinecap="round" strokeLinejoin="round" />
        );
      })()}

      {/* 3 sparkles */}
      {[
        { x: SW * 0.1,  y: SH * 0.06,  s: 4,   c: C.gold },
        { x: SW * 0.88, y: SH * 0.07,  s: 3.5, c: '#14B8A6' },
        { x: SW * 0.5,  y: SH * 0.025, s: 3,   c: C.gold },
      ].map((p, i) => (
        <G key={i}>
          <Line x1={p.x - p.s} y1={p.y} x2={p.x + p.s} y2={p.y} stroke={p.c} strokeWidth="1.8" strokeLinecap="round" />
          <Line x1={p.x} y1={p.y - p.s} x2={p.x} y2={p.y + p.s} stroke={p.c} strokeWidth="1.8" strokeLinecap="round" />
        </G>
      ))}
    </Svg>
  );
}

/** Slide 3 — Crown (Achievement) */
function Artwork3() {
  const cx = SW / 2;
  const cy = SH * 0.21;
  const cr = SW * 0.145;

  // Crown path
  const bx = cx - cr * 1.35;
  const by = cy + cr * 0.62;
  const bw = cr * 2.7;
  const bh = cr * 0.5;
  const crownPts = [
    `${bx},${by}`,
    `${bx},${cy - cr * 0.45}`,
    `${cx - cr * 0.78},${cy + cr * 0.12}`,
    `${cx},${cy - cr * 1.05}`,
    `${cx + cr * 0.78},${cy + cr * 0.12}`,
    `${bx + bw},${cy - cr * 0.45}`,
    `${bx + bw},${by}`,
  ].join(' ');

  return (
    <Svg width={SW} height={SH * 0.35} viewBox={`0 0 ${SW} ${SH * 0.42}`}>
      <Defs>
        <RadialGradient id="a3glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#92400E" stopOpacity="0.35" />
          <Stop offset="100%" stopColor="#080D1A" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id="a3crown" x1="20%" y1="0%" x2="80%" y2="100%">
          <Stop offset="0%" stopColor="#FFD166" />
          <Stop offset="60%" stopColor="#F0B429" />
          <Stop offset="100%" stopColor="#92650A" />
        </LinearGradient>
        <LinearGradient id="a3halo" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={C.gold} stopOpacity="0" />
          <Stop offset="50%" stopColor={C.gold} stopOpacity="0.55" />
          <Stop offset="100%" stopColor={C.gold} stopOpacity="0" />
        </LinearGradient>
      </Defs>

      {/* Ambient glow */}
      <Ellipse cx={cx} cy={cy} rx={SW * 0.62} ry={SH * 0.25} fill="url(#a3glow)" />

      {/* Halo beneath crown */}
      <Ellipse cx={cx} cy={by + bh * 0.5} rx={cr * 1.85} ry={cr * 0.2}
        stroke="url(#a3halo)" strokeWidth="1.5" fill="none" opacity="0.65" />

      {/* Crown */}
      <Polygon points={crownPts} fill="url(#a3crown)" />
      {/* Crown base bar */}
      <Rect x={bx} y={by} width={bw} height={bh} fill={C.gold} rx={4} />
      <Rect x={bx + 2} y={by + 2} width={bw - 4} height={7} fill="#FFD166" rx={3} opacity="0.45" />

      {/* 3 sparkles */}
      {[
        { x: SW * 0.1,  y: SH * 0.055, s: 4.5, c: C.gold },
        { x: SW * 0.88, y: SH * 0.065, s: 4,   c: C.gold },
        { x: SW * 0.5,  y: SH * 0.02,  s: 3.5, c: C.gold },
      ].map((p, i) => (
        <G key={i}>
          <Line x1={p.x - p.s} y1={p.y} x2={p.x + p.s} y2={p.y} stroke={p.c} strokeWidth="1.8" strokeLinecap="round" />
          <Line x1={p.x} y1={p.y - p.s} x2={p.x} y2={p.y + p.s} stroke={p.c} strokeWidth="1.8" strokeLinecap="round" />
        </G>
      ))}
    </Svg>
  );
}

const ARTWORKS = [Artwork1, Artwork2, Artwork3];

// ─── Animated Dot ─────────────────────────────────────────────────────────────
function AnimatedDot({ active, color }: { active: boolean; color: string }) {
  const widthAnim = useRef(new Animated.Value(active ? 24 : 7)).current;
  const opacityAnim = useRef(new Animated.Value(active ? 1 : 0.35)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(widthAnim, {
        toValue: active ? 24 : 7,
        useNativeDriver: false,
        damping: 14,
        stiffness: 160,
      }),
      Animated.timing(opacityAnim, {
        toValue: active ? 1 : 0.35,
        duration: 260,
        useNativeDriver: false,
      }),
    ]).start();
  }, [active, widthAnim, opacityAnim]);

  return (
    <Animated.View
      style={{
        width: widthAnim,
        height: 7,
        borderRadius: 4,
        backgroundColor: active ? color : C.whiteMuted,
        opacity: opacityAnim,
        marginHorizontal: 4,
      }}
    />
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Per-slide fade/translate animations
  const fadeAnims = useRef(SLIDES.map(() => new Animated.Value(1))).current;
  const translateAnims = useRef(SLIDES.map(() => new Animated.Value(0))).current;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false },
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const idx = viewableItems[0].index ?? 0;
        setCurrentIndex(idx);
        // Fade in content of new slide
        fadeAnims[idx].setValue(0);
        translateAnims[idx].setValue(20);
        Animated.parallel([
          Animated.timing(fadeAnims[idx], {
            toValue: 1,
            duration: 420,
            useNativeDriver: true,
          }),
          Animated.spring(translateAnims[idx], {
            toValue: 0,
            damping: 18,
            stiffness: 120,
            useNativeDriver: true,
          }),
        ]).start();
      }
    },
    [fadeAnims, translateAnims],
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 55 });

  const goNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  };

  const handleGetStarted = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    navigation.replace('MainTabs');
  };

  const renderSlide = useCallback(
    ({ item, index }: { item: (typeof SLIDES)[number]; index: number }) => {
      const ArtComponent = ARTWORKS[index];
      const accentColor = item.dotColor;

      return (
        <View style={[styles.slide, { width: SW }]}>
          {/* Artwork zone */}
          <View style={styles.artworkZone}>
            <ArtComponent />
          </View>

          {/* Content zone */}
          <Animated.View
            style={[
              styles.contentZone,
              {
                opacity: fadeAnims[index],
                transform: [{ translateX: translateAnims[index] }],
              },
            ]}>
            {/* Slide counter + concept label */}
            <View style={styles.conceptRow}>
              <Text style={styles.slideCounter}>{item.number}</Text>
              <View style={styles.conceptDash} />
              <Text style={[styles.conceptLabel, { color: accentColor }]}>
                {item.concept}
              </Text>
            </View>

            {/* Accent line */}
            <View style={[styles.accentLine, { backgroundColor: accentColor }]} />

            {/* Title */}
            <Text style={styles.slideTitle}>{item.title}</Text>

            {/* Subtitle */}
            <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
          </Animated.View>
        </View>
      );
    },
    [fadeAnims, translateAnims],
  );

  const activeDotColor = SLIDES[currentIndex].dotColor;
  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} translucent={false} />

      {/* Subtle top gradient overlay */}
      <View style={styles.topFade} pointerEvents="none" />

      {/* Logo */}
      <View style={styles.topBar}>
        <View style={styles.logoWrap}>
          <Image
            source={require('../../android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png')}
            style={styles.logoMark}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>FinVista</Text>
        </View>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
        renderItem={renderSlide}
        bounces={false}
        style={styles.flatList}
        contentContainerStyle={{ flexGrow: 1 }}
      />

      {/* Bottom nav */}
      <View style={styles.bottomNav}>
        {/* Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((s, i) => (
            <AnimatedDot key={s.id} active={i === currentIndex} color={activeDotColor} />
          ))}
        </View>

        {/* CTA */}
        {isLast ? (
          <TouchableOpacity style={styles.ctaButton} onPress={handleGetStarted} activeOpacity={0.85}>
            <View style={styles.ctaInner}>
              <Text style={styles.ctaText}>Get Started</Text>
              <View style={styles.ctaArrow}>
                <FontAwesomeIcon icon={resolveIcon('faArrowRight')} size={15} style={styles.ctaArrowText} />
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.bottomRow}>
            {/* Skip */}
            <TouchableOpacity onPress={handleGetStarted} style={styles.skipBtn} activeOpacity={0.7}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>

            {/* Next button */}
            <TouchableOpacity style={styles.nextBtn} onPress={goNext} activeOpacity={0.85}>
              <View style={[styles.nextBtnInner, { borderColor: activeDotColor }]}>
                <FontAwesomeIcon icon={resolveIcon('faArrowRight')} size={16} color={activeDotColor} />
              </View>
              <View style={[styles.nextBtnGlow, { backgroundColor: activeDotColor }]} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Bottom safe area fill */}
      <View style={styles.bottomSafe} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
    paddingVertical: SPACING.lg
  },
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 1,
    // Simulated top gradient using border technique
    backgroundColor: 'transparent',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 12,
    zIndex: 10,
  },
  logoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoMark: {
    width: 32,
    height: 32,
    borderRadius: 8,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 6,
  },
  logoText: {
    fontSize: 17,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 0.5,
  },
  flatList: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
  },
  artworkZone: {
    width: SW,
    height: SH * 0.4,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentZone: {
    flex: 1,
    width: SW,
    paddingHorizontal: 28,
  },
  conceptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 0,
  },
  slideCounter: {
    fontSize: 11,
    fontWeight: '700',
    color: C.whiteMuted,
    letterSpacing: 2,
    marginRight: 10,
  },
  conceptDash: {
    width: 18,
    height: 1.5,
    backgroundColor: C.whiteMuted,
    opacity: 0.4,
    marginRight: 10,
  },
  conceptLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3.5,
  },
  accentLine: {
    width: 36,
    height: 3,
    borderRadius: 2,
    marginBottom: 18,
    opacity: 0.85,
  },
  slideTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: C.white,
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  slideSubtitle: {
    fontSize: 14.5,
    fontWeight: '400',
    color: C.whiteOff,
    lineHeight: 23,
    opacity: 0.72,
    maxWidth: SW * 0.82,
  },
  bottomNav: {
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 4,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  skipBtn: {
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '500',
    color: C.whiteMuted,
    letterSpacing: 0.3,
  },
  nextBtn: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  nextBtnText: {
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 28,
  },
  nextBtnGlow: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    opacity: 0.08,
    zIndex: -1,
  },
  ctaButton: {
    marginBottom: 8,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: C.gold,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
  ctaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 28,
    gap: 14,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0B0F1E',
    letterSpacing: 0.5,
  },
  ctaArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaArrowText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0B0F1E',
  },
  bottomSafe: {
    height: Platform.OS === 'android' ? 16 : 8,
  },
});
