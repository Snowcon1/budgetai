import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { colors } from '../constants/colors';
import { theme } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { parseReceipt } from '../utils/parseReceipt';
import ResultCard from '../components/ResultCard';
import LoadingPulse from '../components/LoadingPulse';
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
  const { addTransaction, isDemo } = useAppStore();

  const processImage = async (uri: string) => {
    setIsProcessing(true);
    try {
      let base64 = '';
      if (!isDemo) {
        base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: 'base64',
        });
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

  const handleSave = (data: { merchant: string; total: number; category: Category; date: string }) => {
    const transaction: Transaction = {
      id: 'txn_' + Date.now().toString(),
      merchant: data.merchant,
      amount: -data.total,
      category: data.category,
      date: new Date().toISOString().split('T')[0],
      account_id: 'acct_checking_001',
      is_manual: true,
      is_receipt: true,
    };
    addTransaction(transaction);
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
          <View style={styles.overlay}>
            <View style={styles.receiptGuide}>
              <Text style={styles.guideText}>📷 Receipt Scanner</Text>
              <Text style={styles.guideSubtext}>Demo Mode — tap below to simulate a scan</Text>
            </View>
          </View>
        </View>
      ) : (
        <CameraView ref={cameraRef} style={styles.camera} facing="back">
          <View style={styles.overlay}>
            <View style={styles.receiptGuide} />
          </View>
        </CameraView>
      )}

      {isProcessing && (
        <View style={styles.processingOverlay}>
          <LoadingPulse loading>
            <View style={styles.processingContent}>
              <ActivityIndicator size="large" color={colors.accentBlue} />
              <Text style={styles.processingText}>Analyzing receipt...</Text>
            </View>
          </LoadingPulse>
        </View>
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
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptGuide: {
    width: 280,
    height: 380,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 16,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideText: {
    color: colors.textPrimary,
    fontSize: theme.fontSize.xl,
    fontWeight: '600',
    marginBottom: 8,
  },
  guideSubtext: {
    color: colors.textSecondary,
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
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
    color: colors.textPrimary,
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContent: {
    alignItems: 'center',
  },
  processingText: {
    color: colors.textPrimary,
    fontSize: theme.fontSize.md,
    marginTop: 16,
    fontWeight: '500',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.screenPadding,
  },
  permissionText: {
    color: colors.textPrimary,
    fontSize: theme.fontSize.md,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: colors.accentBlue,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: 30,
    marginBottom: 12,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
  libraryButton: {
    paddingVertical: 10,
  },
  libraryButtonText: {
    color: colors.accentBlue,
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
  },
});
