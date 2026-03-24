import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Svg, { Circle, Rect, Path } from 'react-native-svg';
import { colors } from '../constants/colors';
import { theme } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';

const { width } = Dimensions.get('window');

interface OnboardingStep {
  headline: string;
  description: string;
  illustration: React.ReactNode;
}

function Illustration1() {
  return (
    <Svg width={200} height={200} viewBox="0 0 200 200">
      <Circle cx={100} cy={100} r={80} fill={colors.accentBlue + '20'} />
      <Circle cx={100} cy={100} r={55} fill={colors.accentBlue + '40'} />
      <Rect x={75} y={60} width={50} height={70} rx={8} fill={colors.accentBlue} />
      <Rect x={85} y={75} width={30} height={4} rx={2} fill="#fff" />
      <Rect x={85} y={85} width={22} height={4} rx={2} fill="#fff" />
      <Rect x={85} y={95} width={26} height={4} rx={2} fill="#fff" />
      <Circle cx={100} cy={115} r={6} fill={colors.green} />
    </Svg>
  );
}

function Illustration2() {
  return (
    <Svg width={200} height={200} viewBox="0 0 200 200">
      <Circle cx={100} cy={100} r={80} fill={colors.green + '20'} />
      <Circle cx={70} cy={90} r={25} fill={colors.surface} stroke={colors.green} strokeWidth={3} />
      <Circle cx={130} cy={90} r={25} fill={colors.surface} stroke={colors.accentBlue} strokeWidth={3} />
      <Path d="M 70 90 L 130 90" stroke={colors.amber} strokeWidth={3} strokeDasharray="5,5" />
      <Circle cx={100} cy={130} r={18} fill={colors.green + '40'} />
      <Path d="M 92 130 L 98 136 L 110 124" stroke={colors.green} strokeWidth={3} fill="none" />
    </Svg>
  );
}

function Illustration3() {
  return (
    <Svg width={200} height={200} viewBox="0 0 200 200">
      <Circle cx={100} cy={100} r={80} fill={colors.accentBlueLight + '20'} />
      <Rect x={60} y={55} width={80} height={90} rx={16} fill={colors.surface} />
      <Circle cx={85} cy={80} r={8} fill={colors.accentBlue} />
      <Rect x={100} y={76} width={30} height={8} rx={4} fill={colors.border} />
      <Rect x={70} y={100} width={60} height={8} rx={4} fill={colors.accentBlue + '60'} />
      <Rect x={70} y={114} width={45} height={8} rx={4} fill={colors.accentBlue + '40'} />
      <Rect x={70} y={128} width={52} height={8} rx={4} fill={colors.accentBlue + '30'} />
    </Svg>
  );
}

const steps: OnboardingStep[] = [
  {
    headline: 'Your money, finally making sense',
    description: 'SnapBudget gives you a complete picture of your finances with smart insights powered by AI.',
    illustration: <Illustration1 />,
  },
  {
    headline: 'Zero setup. Just connect.',
    description: 'Link your bank accounts securely and we automatically categorize every transaction.',
    illustration: <Illustration2 />,
  },
  {
    headline: 'Ask your financial coach anything',
    description: 'Get personalized advice based on your actual spending, goals, and habits.',
    illustration: <Illustration3 />,
  },
];

interface Props {
  navigation: { replace: (screen: string) => void; navigate: (screen: string) => void };
}

export default function OnboardingScreen({ navigation }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const initDemo = useAppStore((s) => s.initDemo);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentStep(index);
  };

  const handleDemo = () => {
    initDemo();
    navigation.replace('MainTabs');
  };

  const handleConnect = () => {
    navigation.navigate('Auth');
  };

  const isLastStep = currentStep === steps.length - 1;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={steps}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={styles.illustrationContainer}>{item.illustration}</View>
            <Text style={styles.headline}>{item.headline}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}
      />
      <View style={styles.footer}>
        <View style={styles.dots}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentStep && styles.dotActive]}
            />
          ))}
        </View>
        {isLastStep ? (
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleDemo}>
              <Text style={styles.secondaryButtonText}>Try Demo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={handleConnect}>
              <Text style={styles.primaryButtonText}>Connect My Accounts</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => {
              flatListRef.current?.scrollToIndex({ index: currentStep + 1, animated: true });
            }}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.screenPadding,
  },
  illustrationContainer: {
    marginBottom: 40,
  },
  headline: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: theme.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  footer: {
    paddingHorizontal: theme.screenPadding,
    paddingBottom: 50,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: colors.accentBlue,
    width: 24,
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.accentBlue,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.accentBlue,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.accentBlue,
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: colors.accentBlue,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
});
