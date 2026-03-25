import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';

// Only import WebView on native — avoids the "not supported" error on web
const WebView = Platform.OS !== 'web'
  ? require('react-native-webview').WebView
  : null;

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

interface Props {
  navigation: { goBack: () => void };
}

function buildPlaidLinkHtml(linkToken: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #0F172A;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #fff;
  }
  #loading { text-align: center; }
  .icon { font-size: 48px; margin-bottom: 16px; }
  p { color: #94A3B8; font-size: 16px; }
</style>
</head>
<body>
<div id="loading">
  <div class="icon">🏦</div>
  <p>Connecting to your bank...</p>
</div>
<script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"></script>
<script>
function sendMsg(data) {
  var msg = JSON.stringify(data);
  try {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(msg);
    } else if (window.parent && window.parent !== window) {
      window.parent.postMessage(msg, '*');
    }
  } catch(e) { console.log('postMessage error', e); }
}

try {
  var handler = Plaid.create({
    token: '${linkToken}',
    onSuccess: function(publicToken, metadata) {
      sendMsg({
        type: 'success',
        publicToken: publicToken,
        institutionName: metadata.institution ? metadata.institution.name : '',
        institutionId: metadata.institution ? metadata.institution.institution_id : ''
      });
    },
    onExit: function(err, metadata) {
      sendMsg({ type: 'exit', error: err ? err.error_message : null });
    },
    onLoad: function() {
      document.getElementById('loading').style.display = 'none';
      handler.open();
    },
    onEvent: function(eventName, metadata) {}
  });
  handler.open();
} catch(e) {
  sendMsg({ type: 'error', error: e.message });
}
</script>
</body>
</html>`;
}

// Inject and open Plaid Link directly in the browser (web only)
function openPlaidLinkWeb(
  linkToken: string,
  onSuccess: (publicToken: string, institutionName: string, institutionId: string) => void,
  onExit: () => void
) {
  const existing = document.getElementById('plaid-link-script');
  if (existing) existing.remove();

  const script = document.createElement('script');
  script.id = 'plaid-link-script';
  script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
  script.onload = () => {
    // @ts-ignore
    const handler = window.Plaid.create({
      token: linkToken,
      onSuccess: (publicToken: string, metadata: any) => {
        onSuccess(
          publicToken,
          metadata?.institution?.name ?? '',
          metadata?.institution?.institution_id ?? ''
        );
      },
      onExit: () => onExit(),
    });
    handler.open();
  };
  document.head.appendChild(script);
}

export default function PlaidConnectScreen({ navigation }: Props) {
  const [phase, setPhase] = useState<'intro' | 'linking' | 'syncing'>('intro');
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { userId, connectPlaid } = useAppStore();

  const handlePlaidSuccess = async (publicToken: string, institutionName: string, institutionId: string) => {
    setPhase('syncing');
    setLinkToken(null);
    try {
      await connectPlaid(publicToken, institutionName, institutionId);
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sync failed');
      setPhase('intro');
    }
  };

  const startLink = async () => {
    setError(null);
    setPhase('linking');
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/plaid-create-link-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId ?? 'guest' }),
      });
      const data = await res.json();
      if (!res.ok || !data.link_token) {
        throw new Error(data.error ?? 'Failed to create link token');
      }

      if (Platform.OS === 'web') {
        // On web: open Plaid Link JS directly in the browser
        openPlaidLinkWeb(
          data.link_token,
          handlePlaidSuccess,
          () => setPhase('intro')
        );
        // Keep phase as 'linking' but no WebView needed — Plaid overlays the page
      } else {
        setLinkToken(data.link_token);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to connect');
      setPhase('intro');
    }
  };

  const handleWebViewMessage = async (event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'success') {
        await handlePlaidSuccess(msg.publicToken, msg.institutionName, msg.institutionId);
      } else if (msg.type === 'exit') {
        setPhase('intro');
        setLinkToken(null);
      } else if (msg.type === 'error') {
        setError(msg.error);
        setPhase('intro');
        setLinkToken(null);
      }
    } catch {
      setPhase('intro');
      setLinkToken(null);
    }
  };

  // Syncing state
  if (phase === 'syncing') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent.blue} />
        <Text style={styles.syncTitle}>Syncing your accounts</Text>
        <Text style={styles.syncSub}>Importing transactions from your bank…</Text>
      </View>
    );
  }

  // Native WebView phase — Plaid Link open
  if (phase === 'linking' && linkToken && Platform.OS !== 'web' && WebView) {
    return (
      <View style={styles.flex}>
        <View style={styles.webViewHeader}>
          <TouchableOpacity onPress={() => { setPhase('intro'); setLinkToken(null); }}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.webViewTitle}>Connect Bank</Text>
          <View style={{ width: 60 }} />
        </View>
        <WebView
          source={{ html: buildPlaidLinkHtml(linkToken) }}
          onMessage={handleWebViewMessage}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
          style={styles.webView}
        />
      </View>
    );
  }

  // Loading link token (web shows spinner while Plaid Link overlay loads)
  if (phase === 'linking') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent.blue} />
        <Text style={styles.syncSub}>Opening Plaid Link…</Text>
      </View>
    );
  }

  // Intro screen
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🏦</Text>
      <Text style={styles.title}>Connect Your Bank</Text>
      <Text style={styles.subtitle}>
        Securely link your accounts via Plaid to get real spending insights.
      </Text>

      <View style={styles.featureList}>
        {[
          { icon: '🔒', text: 'Bank-level 256-bit encryption' },
          { icon: '👁️', text: 'Read-only access — we can\'t move money' },
          { icon: '⚡', text: 'Transactions sync automatically' },
        ].map((f) => (
          <View key={f.text} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.connectButton} onPress={startLink}>
        <Text style={styles.connectButtonText}>Connect My Bank</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipButton} onPress={() => navigation.goBack()}>
        <Text style={styles.skipText}>Maybe later</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg.primary },
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  icon: { fontSize: 56, marginBottom: 16 },
  title: { ...typography.title, color: colors.text.primary, textAlign: 'center', marginBottom: 12 },
  subtitle: {
    ...typography.body,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  featureList: {
    width: '100%',
    backgroundColor: colors.bg.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: 20,
    gap: 16,
    marginBottom: 28,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureIcon: { fontSize: 22 },
  featureText: { ...typography.body, color: colors.text.secondary, flex: 1 },
  errorBox: {
    backgroundColor: colors.accent.redGlow ?? '#FF000020',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.accent.red,
    padding: 14,
    width: '100%',
    marginBottom: 16,
  },
  errorText: { ...typography.label, color: colors.accent.red, textAlign: 'center' },
  connectButton: {
    backgroundColor: colors.accent.blue,
    borderRadius: 14,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: colors.accent.blue,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    marginBottom: 14,
  },
  connectButtonText: { color: '#fff', ...typography.subheading, fontWeight: '600' },
  skipButton: { paddingVertical: 10 },
  skipText: { ...typography.label, color: colors.text.muted },
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    backgroundColor: colors.bg.primary,
  },
  cancelText: { ...typography.label, color: colors.accent.blue, width: 60 },
  webViewTitle: { ...typography.heading, color: colors.text.primary },
  webView: { flex: 1, backgroundColor: colors.bg.primary },
  syncTitle: { ...typography.title, color: colors.text.primary },
  syncSub: { ...typography.body, color: colors.text.muted },
});
