import React, { useEffect, useRef, useState } from 'react';
import { Text, TextStyle } from 'react-native';

interface Props {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  style?: TextStyle | TextStyle[];
  formatFn?: (v: number) => string;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export default function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 800,
  style,
  formatFn,
}: Props) {
  const [displayed, setDisplayed] = useState(value);
  const fromRef = useRef(value);
  const frameRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const from = fromRef.current;
    if (from === value) return;

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!mountedRef.current) return;
      if (startTimeRef.current === null) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const current = from + (value - from) * eased;
      setDisplayed(current);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        fromRef.current = value;
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration]);

  const formatted = formatFn
    ? formatFn(displayed)
    : decimals > 0
    ? displayed.toFixed(decimals)
    : Math.round(displayed).toLocaleString('en-US');

  return (
    <Text style={style}>
      {prefix}{formatted}{suffix}
    </Text>
  );
}
