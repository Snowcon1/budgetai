import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, StyleProp, Dimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  children?: React.ReactNode;
  loading: boolean;
  style?: StyleProp<ViewStyle>;
  rows?: number;
}

function ShimmerRow({ width = '100%', height = 16, marginBottom = 10 }: { width?: string | number; height?: number; marginBottom?: number }) {
  const { colors } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1400,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  return (
    <View style={[{ backgroundColor: colors.bg.elevated, borderRadius: 6, overflow: 'hidden', height, marginBottom, width: width as any }]}>
      <Animated.View
        style={[{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: 80,
          backgroundColor: colors.border.default + '80',
          borderRadius: 6,
          transform: [{ translateX }],
        }]}
      />
    </View>
  );
}

export function SkeletonTransactionRow() {
  const { colors } = useTheme();
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bg.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    }}>
      <View style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.bg.elevated,
        marginRight: 12,
      }} />
      <View style={{ flex: 1 }}>
        <ShimmerRow width="60%" height={14} marginBottom={6} />
        <ShimmerRow width="40%" height={10} marginBottom={0} />
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <ShimmerRow width={52} height={14} marginBottom={6} />
        <ShimmerRow width={36} height={10} marginBottom={0} />
      </View>
    </View>
  );
}

export default function LoadingPulse({ children, loading, style, rows }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (loading && !rows) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      opacity.setValue(1);
    }
  }, [loading]);

  if (loading && rows) {
    return (
      <View style={style}>
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonTransactionRow key={i} />
        ))}
      </View>
    );
  }

  return <Animated.View style={[style, { opacity: loading ? opacity : 1 }]}>{children}</Animated.View>;
}
