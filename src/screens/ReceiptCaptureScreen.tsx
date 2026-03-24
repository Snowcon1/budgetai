import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { colors } from '../constants/colors';
import { typography } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { parseReceipt } from '../utils/parseReceipt';
import ResultCard from '../components/ResultCard';
import { Category, Transaction } from '../types';

interface Props {
  navigation: { goBack: () => void };
}

export default function ReceiptCaptureScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<{
    merchant: string;
    total: number;
    category: Category;
    date: string;
  } | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const { addTransaction, isDemo, accounts } = useAppStore();

  // Guide rectangle pulse
  const guideScale = useRef(new Animated.Value(1)).current;
  // Processing overlay
  const processingFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(guideScale, { toValue: 1.015, duration: 1500, useNativeDriver: true }),
        Animated.timing(guideScale, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  useEffect(() => {
    if (isProcessing) {
      Animated.timing(processingFade, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    } else {
      processingFade.setValue(0);
    }
  }, [isProcessing]);

  const processImage = async (uri: string) => {
    setIsProcessing(true);
    try {
      let base64 = '';
      if (!isDemo) {
        base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      }
      const result = await parseReceipt(base64, isDemo);
      setParsedData({
        merchant: result.merchant,
        total: result.total,
        category: result.category,
        date: result.date,
      });
    } catch (error) {
      setParsedData({
        merchant: 'Unknown Store',
        total: 0,
        category: 'Other',
        date: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTakePhoto = async () => {
    if (isDemo) {
      await processImage('');
      return;
    }
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ base64: false });
      if (photo?.uri) {
        await processImage(photo.uri);
      }
    }
  };

  const handlePickImage = async () => {
    if (isDemo) {
      await processImage('');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await processImage(result.assets[0].uri);
    }
  };

  const handleSave = async (data: { merchant: string; total: number; category: Category; date: string }) => {
    const checkingAccount = accounts.find((a) => a.type === 'checking') ?? accounts[0];
    const transaction: Transaction = {
      id: 'txn_' + Date.now().toString(),
      merchant: data.merchant,
      amount: -data.total,
      category: data.category,
      date: new Date().toISOString().split('T')[0],
      account_id: checkingAccount?.id ?? '',
      is_manual: true,
      is_receipt: true,
    };
    await addTransaction(transaction);
    navigation.goBack();
  };

  const handleRetake = () => {
    setParsedData(null);
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted && !isDemo) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionIcon}>📷</Text>
        <Text style={styles.permissionText}>Camera access is needed to scan receipts.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.libraryButton} onPress={handlePickImage}>
          <Text style={styles.libraryButtonText}>Choose from Library</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isDemo ? (
        <View style={styles.demoCameraView}>
          <Animated.View style={[styles.guideRect, { transform: [{ scale: guideScale }] }]}>
            {/* Corner markers */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            <Text style={styles.guideText}>📷 Receipt Scanner</Text>
            <Text style={styles.guideSubtext}>Demo Mode — tap below to simulate a scan</Text>
          </Animated.View>
        </View>
      ) : (
        <CameraView ref={cameraRef} style={styles.camera} facing="back">
          <View style={styles.overlay}>
            <Animated.View style={[styles.guideRect, { transform: [{ scale: guideScale }] }]}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </Animated.View>
          </View>
        </CameraView>
      )}

      {isProcessing && (
        <Animated.View style={[styles.processingOverlay, { opacity: processingFade }]}>
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color={colors.accent.blue} />
            <Text style={styles.processingText}>Analyzing receipt...</Text>
            <Text style={styles.processingSubtext}>Powered by GPT-4o</Text>
          </View>
        </Animated.View>
      )}

      {parsedData && (
        <ResultCard data={parsedData} onSave={handleSave} onRetake={handleRetake} />
      )}

      {!parsedData && !isProcessing && (
        <View style={styles.controls}>
          <TouchableOpacity style={styles.captureButton} onPress={handleTakePhoto}>
            <View style={styles.captureInner} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePickImage}>
            <Text style={styles.libraryText}>Choose from Library</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const CORNER_SIZE = 20;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  demoCameraView: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideRect: {
    width: 280,
    height: 380,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: colors.accent.blue,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderBottomRightRadius: 4,
  },
  guideText: {
    ...typography.heading,
    color: colors.text.primary,
    marginBottom: 8,
  },
  guideSubtext: {
    ...typography.label,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  controls: {
    position: 'absolute',
    bottom: 44,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fff',
  },
  libraryText: {
    ...typography.label,
    color: colors.text.primary,
  },
  closeButton: {
    position: 'absolute',
    top: 52,
    left: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  closeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingCard: {
    backgroundColor: colors.bg.elevated,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  processingText: {
    ...typography.subheading,
    color: colors.text.primary,
    marginTop: 14,
  },
  processingSubtext: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: 4,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  permissionIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  permissionText: {
    ...typography.subheading,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: colors.accent.blue,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 30,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#fff',
    ...typography.subheading,
    fontWeight: '600',
  },
  libraryButton: {
    paddingVertical: 10,
  },
  libraryButtonText: {
    ...typography.label,
    color: colors.accent.blue,
  },
});
