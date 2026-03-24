import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleProp } from 'react-native';

interface Props {
  children: React.ReactNode;
  loading: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function LoadingPulse({ children, loading, style }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (loading) {
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

  return <Animated.View style={[style, { opacity: loading ? opacity : 1 }]}>{children}</Animated.View>;
}
