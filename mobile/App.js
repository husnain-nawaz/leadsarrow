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

// Production Hostinger Live Web URL (The exact mobile version of the website)
const WEB_APP_URL = 'https://aliceblue-kudu-967560.hostingersite.com';

export default function App() {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

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

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style="light" backgroundColor="#0b0f19" />

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
          <View style={styles.webViewWrapper}>
            <WebView
              ref={webViewRef}
              source={{ uri: WEB_APP_URL }}
              style={styles.webView}
              originWhitelist={['*']}
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
              cacheEnabled={true}
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
