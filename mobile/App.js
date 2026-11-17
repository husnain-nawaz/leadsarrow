import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  BackHandler,
  Platform,
  Text,
  TouchableOpacity
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';

// Production Hostinger Live Web URL (flagged as native Android app mode — no landing page, dedicated login screen)
const WEB_APP_URL = 'https://aliceblue-kudu-967560.hostingersite.com/?app=android';
const NATIVE_APP_INJECT_SCRIPT = `
  window.__LEADSARROW_NATIVE_APP__ = true;
  try { sessionStorage.setItem('leadsarrow_native_app', '1'); } catch (e) {}
  try {
    var applyNoZoom = function () {
      var meta = document.querySelector('meta[name="viewport"]');
      if (!meta && document.head) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'viewport');
        document.head.appendChild(meta);
      }
      if (meta) {
        meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no');
      }
      if (document.documentElement) document.documentElement.style.touchAction = 'pan-x pan-y';
      if (document.body) document.body.style.touchAction = 'pan-x pan-y';
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyNoZoom);
    } else {
      applyNoZoom();
    }
  } catch (e) {}
  true;
`;

export default function App() {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(true);

  const handleWebViewMessage = (event) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      if (payload?.type === 'THEME_CHANGE') {
        setIsDarkTheme(payload.theme === 'dark');
      }
    } catch {}
  };

  // Handle Android hardware back button
  useEffect(() => {
    if (Platform.OS === 'android') {
      const onBackPress = () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true; // prevent exit
        }
        return false; // let system handle (exit or background)
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }
  }, [canGoBack]);

  const handleReload = () => {
    setHasError(false);
    setLoading(true);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  const themeBg = isDarkTheme ? '#0b0f19' : '#f8fafc';

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: themeBg }]} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style={isDarkTheme ? 'light' : 'dark'} backgroundColor={themeBg} />

        {hasError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Unable to connect to LeadsArrow</Text>
            <Text style={styles.errorSubtitle}>
              Please check your internet connection and try again.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleReload}>
              <Text style={styles.retryButtonText}>Retry Connection</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.webViewWrapper, { backgroundColor: themeBg }]}>
            <WebView
              ref={webViewRef}
              source={{ uri: WEB_APP_URL }}
              style={[styles.webView, { backgroundColor: themeBg }]}
              originWhitelist={['*']}
              applicationNameForUserAgent="LeadsArrowAndroidApp/1.0"
              injectedJavaScriptBeforeContentLoaded={NATIVE_APP_INJECT_SCRIPT}
              onMessage={handleWebViewMessage}
              onNavigationStateChange={(navState) => {
                setCanGoBack(navState.canGoBack);
              }}
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              onError={(syntheticEvent) => {
                console.warn('WebView error:', syntheticEvent.nativeEvent);
                setHasError(true);
              }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#ea580c" />
                  <Text style={styles.loadingText}>Loading LeadsArrow...</Text>
                </View>
              )}
              allowsBackForwardNavigationGestures={true}
              forceDarkOn={false}
              setBuiltInZoomControls={false}
              setDisplayZoomControls={false}
              scalesPageToFit={false}
              textZoom={100}
              pullToRefreshEnabled={true}
              cacheEnabled={true}
              cacheMode="LOAD_DEFAULT"
            />
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f19'
  },
  webViewWrapper: {
    flex: 1,
    backgroundColor: '#0b0f19'
  },
  webView: {
    flex: 1,
    backgroundColor: '#0b0f19'
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0b0f19',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500'
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0b0f19',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  errorTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center'
  },
  errorSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24
  },
  retryButton: {
    backgroundColor: '#ea580c',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700'
  }
});
