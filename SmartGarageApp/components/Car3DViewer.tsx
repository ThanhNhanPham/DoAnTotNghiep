import React, { useState } from 'react';
import { View, StyleSheet, DimensionValue, ActivityIndicator, Image } from 'react-native';
import { WebView } from 'react-native-webview';

interface Car3DViewerProps {
  width?: DimensionValue;
  height?: DimensionValue;
}

export default function Car3DViewer({ width = '100%', height = 220 }: Car3DViewerProps) {
  const [loading, setLoading] = useState(true);

  // Fallback image source - using the provided asset
  const fallbackImage = require('@/assets/images/smart_garage_3d_car.png');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js"></script>
        <style>
          body, html { 
            margin: 0; 
            padding: 0; 
            background: transparent; 
            overflow: hidden; 
            height: 100vh; 
            width: 100vw;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          #motion-wrapper {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            animation: floating 4s ease-in-out infinite;
          }
          model-viewer {
            width: 100%;
            height: 100%;
            background-color: transparent;
            --poster-color: transparent;
            /* Filter to make the model darker and more high-contrast */
            filter: brightness(0.7) contrast(1.2) saturate(1.2);
          }
          @keyframes floating {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-25px); }
          }
        </style>
      </head>
      <body>
        <div id="motion-wrapper">
          <model-viewer
            id="car-viewer"
            src="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/ToyCar/glTF-Binary/ToyCar.glb"
            alt="Smart Garage 3D Car"
            auto-rotate
            camera-controls
            interaction-prompt="none"
            shadow-intensity="2"
            exposure="0.8"
            environment-image="neutral"
            camera-orbit="0deg 75deg 105%"
            field-of-view="30deg"
          ></model-viewer>
        </div>
        <script>
          const modelViewer = document.querySelector('#car-viewer');
          
          // Force rotation even if auto-rotate is blocked
          let angle = 0;
          setInterval(() => {
            angle += 0.5;
            if (angle >= 360) angle = 0;
            modelViewer.cameraOrbit = \`\${angle}deg 75deg 105%\`;
          }, 16); // ~60fps movement

          modelViewer.addEventListener('load', () => {
             window.ReactNativeWebView.postMessage('loaded');
          });
        </script>
      </body>
    </html>
  `;

  return (
    <View style={[styles.container, { width, height }]}>
      {/* Fallback Image is behind the WebView */}
      <View style={StyleSheet.absoluteFill}>
        <Image 
          source={fallbackImage} 
          style={styles.fallback} 
          resizeMode="contain"
        />
      </View>

      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent, baseUrl: 'https://modelviewer.dev' }}
        style={styles.webview} // Always visible to debug
        scrollEnabled={false}
        bounces={false}
        onMessage={(event) => {
          if (event.nativeEvent.data === 'loaded') {
            setLoading(false);
          }
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        transparent={true}
        onError={(e) => console.log('WebView Error:', e.nativeEvent.description)}
      />

      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator color="#6366F1" size="small" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webview: {
    backgroundColor: 'transparent',
    width: '100%',
    height: '100%',
  },
  fallback: {
    width: '100%',
    height: '100%',
    opacity: 0.6, // Subtle hint of the image behind
  },
  loader: {
    position: 'absolute',
    bottom: 20,
  },
});
