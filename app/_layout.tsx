// IMPORTANT: Import early logger FIRST, before anything else that might log
import '../services/earlyLogger';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AuthProvider } from '../contexts/AuthContext';

// Global error handler for unhandled errors and promise rejections
const setupGlobalErrorHandlers = () => {
  // Handle unhandled JavaScript errors
  // ErrorUtils is a global object in React Native
  const ErrorUtils = (global as any).ErrorUtils;
  
  if (ErrorUtils) {
    const originalErrorHandler = ErrorUtils.getGlobalHandler();
    
    ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      const errorInfo = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        isFatal,
        timestamp: new Date().toISOString(),
      };
      
      console.error('[GlobalErrorHandler] Unhandled error:', errorInfo);
      
      // Try to save logs immediately on fatal error
      if (isFatal) {
        try {
          const { loggerService } = require('../services/loggerService');
          // Save synchronously if possible, or at least try
          loggerService.saveLogsToFile().catch((saveError: any) => {
            // If save fails, at least log it
            console.error('[GlobalErrorHandler] Failed to save logs on crash:', saveError);
          });
        } catch (requireError) {
          // If require fails, we can't do anything
          console.error('[GlobalErrorHandler] Failed to require loggerService:', requireError);
        }
      }
      
      // Call original handler to maintain default behavior
      if (originalErrorHandler) {
        originalErrorHandler(error, isFatal);
      }
    });
  }

  // Handle unhandled promise rejections
  if (typeof global !== 'undefined') {
    const originalUnhandledRejection = (global as any).onunhandledrejection;
    
    (global as any).onunhandledrejection = (event: PromiseRejectionEvent) => {
      console.error('[GlobalErrorHandler] Unhandled promise rejection:', {
        reason: event.reason,
        error: event.reason instanceof Error ? {
          name: event.reason.name,
          message: event.reason.message,
          stack: event.reason.stack,
        } : event.reason,
        timestamp: new Date().toISOString(),
      });
      
      // Call original handler if it exists
      if (originalUnhandledRejection) {
        originalUnhandledRejection(event);
      }
    };
  }
};

export default function RootLayout() {
  useEffect(() => {
    // Setup global error handlers when app starts
    setupGlobalErrorHandlers();
    console.log('[RootLayout] Global error handlers initialized');
    
    // Enable auto-save on error to capture crashes
    const { loggerService } = require('../services/loggerService');
    loggerService.setAutoSaveOnError(true);
    console.log('[RootLayout] Auto-save on error enabled');
  }, []);

  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#000',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="auth/callback" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false,
          }} 
        />
      </Stack>
    </AuthProvider>
  );
}
