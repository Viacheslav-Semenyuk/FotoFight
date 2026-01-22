/**
 * Native Logger Service
 * Provides native Android logging that always works in release builds
 * Uses Android Log API which guarantees output to logcat
 */

import { NativeModules, Platform } from 'react-native';

const { NativeLogger } = NativeModules;

interface NativeLoggerInterface {
  log(level: string, tag: string, message: string): void;
  logWithData(level: string, tag: string, message: string, data: string): void;
}

class NativeLoggerService {
  private isAvailable: boolean = false;
  private module: NativeLoggerInterface | null = null;

  constructor() {
    // Check if native module is available
    // On Android with native module: available
    // On iOS or web: not available, fallback to console
    if (Platform.OS === 'android' && NativeLogger) {
      this.isAvailable = true;
      this.module = NativeLogger as NativeLoggerInterface;
    }
  }

  /**
   * Log to native Android logcat (guaranteed to work in release builds)
   * Falls back to console.log if native module is not available
   */
  log(level: 'log' | 'warn' | 'error' | 'info' | 'debug', tag: string, message: string, data?: any) {
    if (this.isAvailable && this.module) {
      // Format data if provided
      const dataString = data ? JSON.stringify(data, null, 2) : '';
      
      if (dataString) {
        this.module.logWithData(level.toUpperCase(), tag, message, dataString);
      } else {
        this.module.log(level.toUpperCase(), tag, message);
      }
    } else {
      // Fallback to console if native module not available (iOS, web, or module not loaded)
      const consoleMethod = level === 'error' ? console.error : 
                           level === 'warn' ? console.warn : 
                           level === 'info' ? console.info : 
                           console.log;
      consoleMethod(`[${tag}] ${message}`, data || '');
    }
  }

  /**
   * Log error (highest priority, always visible in logcat)
   */
  error(tag: string, message: string, data?: any) {
    this.log('error', tag, message, data);
  }

  /**
   * Log warning
   */
  warn(tag: string, message: string, data?: any) {
    this.log('warn', tag, message, data);
  }

  /**
   * Log info
   */
  info(tag: string, message: string, data?: any) {
    this.log('info', tag, message, data);
  }

  /**
   * Log debug (lowest priority)
   */
  debug(tag: string, message: string, data?: any) {
    this.log('debug', tag, message, data);
  }

  /**
   * Check if native logging is available
   */
  isNativeAvailable(): boolean {
    return this.isAvailable;
  }
}

export const nativeLogger = new NativeLoggerService();
export default nativeLogger;
