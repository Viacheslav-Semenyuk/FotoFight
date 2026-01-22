/**
 * Logger Service
 * Intercepts console.log, console.warn, and console.error
 * Stores logs in memory for display in the app
 * Can save logs to file on device for later analysis
 * 
 * IMPORTANT: This service MUST be imported early (in _layout.tsx) 
 * to intercept all console calls before they are executed.
 * 
 * To ensure logs work in release builds:
 * 1. Make sure babel.config.js doesn't remove console in production
 * 2. This service will capture all console.* calls that reach it
 * 3. Logs will be stored even if console output is suppressed
 */

import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { nativeLogger } from './nativeLogger';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'log' | 'warn' | 'error';
  message: string;
  data?: any;
}

class LoggerService {
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000; // Maximum number of logs to keep
  private originalConsole: {
    log: typeof console.log;
    warn: typeof console.warn;
    error: typeof console.error;
  };
  private listeners: Set<() => void> = new Set();
  private isInterceptionSetup: boolean = false;

  constructor() {
    // Store original console methods BEFORE any overrides
    // This ensures we can always call the original console
    this.originalConsole = {
      log: console.log.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
    };

    // Override console methods immediately
    // This MUST happen early to intercept all console calls
    this.setupConsoleInterception();
    
    // Log initialization (this will be the first log captured)
    this.originalConsole.log('[LoggerService] Initialized - intercepting console calls');
    
    // Also log to our intercepted console to verify it works
    console.log('[LoggerService] Console interception active');
  }

  private setupConsoleInterception() {
    console.log = (...args: any[]) => {
      this.addLog('log', args);
      this.originalConsole.log(...args);
    };

    console.warn = (...args: any[]) => {
      this.addLog('warn', args);
      this.originalConsole.warn(...args);
    };

    console.error = (...args: any[]) => {
      this.addLog('error', args);
      this.originalConsole.error(...args);
    };
  }

  private addLog(level: 'log' | 'warn' | 'error', args: any[]) {
    try {
      // Format message
      const message = args
        .map(arg => {
          if (typeof arg === 'string') {
            return arg;
          }
          if (arg instanceof Error) {
            return `${arg.name}: ${arg.message}\n${arg.stack || ''}`;
          }
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        })
        .join(' ');

      const logEntry: LogEntry = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        level,
        message,
        data: args.length > 1 ? args : undefined,
      };

      // Add to logs array immediately (synchronous)
      this.logs.push(logEntry);

      // Keep only the last maxLogs entries
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(-this.maxLogs);
      }

      // Notify listeners (synchronous)
      this.notifyListeners();

      // Additional logging methods for Android release builds
      if (Platform.OS === 'android') {
        // Method 1: Use console.error for ALL logs on Android (it usually always works in release)
        // This ensures logs are visible in logcat even when console.log doesn't work
        try {
          if (level === 'error') {
            // Error level - use console.error (highest priority)
            this.originalConsole.error(message, ...args.slice(1));
          } else if (level === 'warn') {
            // Warn level - use console.error with prefix
            this.originalConsole.error(`[WARN] ${message}`, ...args.slice(1));
          } else {
            // Log/Info level - use console.error with prefix (ensures visibility in release)
            this.originalConsole.error(`[LOG] ${message}`, ...args.slice(1));
          }
        } catch (e) {
          // Fallback if console.error fails
        }

        // Method 2: Try native logger if available
        try {
          const tag = this.extractTag(message) || 'ReactNativeJS';
          const logMessage = this.extractMessage(message);
          
          if (nativeLogger && nativeLogger.isNativeAvailable && nativeLogger.isNativeAvailable()) {
            if (level === 'error') {
              nativeLogger.error(tag, logMessage, logEntry.data);
            } else if (level === 'warn') {
              nativeLogger.warn(tag, logMessage, logEntry.data);
            } else {
              nativeLogger.info(tag, logMessage, logEntry.data);
            }
          }
        } catch (e) {
          // Native logger might not be available, that's ok
        }

        // Method 3: Add to global buffer for early access
        try {
          const globalAny = global as any;
          if (!globalAny.__APP_LOGS__) {
            globalAny.__APP_LOGS__ = [];
          }
          globalAny.__APP_LOGS__.push({
            timestamp: logEntry.timestamp.toISOString(),
            level: level.toUpperCase(),
            message: message,
          });
          // Keep only last 200 entries in global buffer
          if (globalAny.__APP_LOGS__.length > 200) {
            globalAny.__APP_LOGS__.shift();
          }
        } catch (e) {
          // Silent fail for global buffer
        }
      }

      // Auto-save on error if enabled
      if (this.autoSaveOnError && level === 'error') {
        // Save asynchronously without blocking
        this.saveLogsToFile().catch(err => {
          this.originalConsole.error('[LoggerService] Auto-save failed:', err);
        });
      }
    } catch (error) {
      // Fallback to original console if logging fails
      this.originalConsole.error('LoggerService: Failed to add log', error);
    }
  }

  /**
   * Extract tag from log message (format: [Tag] message)
   */
  private extractTag(message: string): string | null {
    const match = message.match(/^\[([^\]]+)\]/);
    return match ? match[1] : null;
  }

  /**
   * Extract message without tag
   */
  private extractMessage(message: string): string {
    const match = message.match(/^\[([^\]]+)\]\s*(.*)$/);
    return match ? match[2] : message;
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        this.originalConsole.error('LoggerService: Listener error', error);
      }
    });
  }

  /**
   * Get all logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs as formatted string
   */
  getLogsAsString(): string {
    return this.logs
      .map(log => {
        const timestamp = log.timestamp.toISOString();
        const level = log.level.toUpperCase().padEnd(5);
        return `[${timestamp}] ${level} ${log.message}`;
      })
      .join('\n');
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
    this.notifyListeners();
  }

  /**
   * Subscribe to log updates
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get log count
   */
  getLogCount(): number {
    return this.logs.length;
  }

  /**
   * Save logs to file on device
   * Returns the file path where logs were saved
   */
  async saveLogsToFile(): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      // Log that we're starting to save
      this.originalConsole.log(`[LoggerService] Starting to save ${this.logs.length} logs to file...`);
      
      const logsText = this.getLogsAsString();
      
      // Add header with metadata
      const header = `=== Foto Fight App Logs ===
Generated: ${new Date().toISOString()}
Total Logs: ${this.logs.length}
Platform: ${Platform.OS}
========================================

`;
      
      const fullLogsText = header + logsText;
      
      // Create filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `fotofight-logs-${timestamp}.txt`;
      
      // Get directory for saving files
      // On Android: use documentDirectory or cacheDirectory
      // On iOS: use documentDirectory
      const directory = Platform.OS === 'android' 
        ? FileSystem.documentDirectory || FileSystem.cacheDirectory
        : FileSystem.documentDirectory;
      
      if (!directory) {
        throw new Error('No directory available for saving logs');
      }

      const filePath = `${directory}${filename}`;
      
      // Write file
      await FileSystem.writeAsStringAsync(filePath, fullLogsText, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      this.originalConsole.log(`[LoggerService] Logs saved to: ${filePath}`);
      this.originalConsole.log(`[LoggerService] File size: ${fullLogsText.length} bytes`);
      
      return {
        success: true,
        filePath,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.originalConsole.error('[LoggerService] Failed to save logs to file:', errorMessage);
      if (errorStack) {
        this.originalConsole.error('[LoggerService] Error stack:', errorStack);
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get the directory where logs are saved
   */
  getLogsDirectory(): string | null {
    if (Platform.OS === 'android') {
      return FileSystem.documentDirectory || FileSystem.cacheDirectory || null;
    }
    return FileSystem.documentDirectory || null;
  }

  /**
   * Get formatted file path for display (user-friendly)
   */
  getFormattedFilePath(filePath: string): string {
    if (Platform.OS === 'android') {
      // On Android, show path relative to Downloads or Documents
      // Full path might be: /data/user/0/com.fotofight.app/files/fotofight-logs-...
      // Show just the filename or a user-friendly path
      const filename = filePath.split('/').pop() || filePath;
      return `Downloads/${filename}`; // User-friendly path
    }
    // On iOS, show just the filename
    return filePath.split('/').pop() || filePath;
  }

  /**
   * Auto-save logs when error occurs (optional feature)
   */
  private autoSaveOnError: boolean = false;
  
  setAutoSaveOnError(enabled: boolean) {
    this.autoSaveOnError = enabled;
  }

  /**
   * Check if auto-save on error is enabled
   */
  isAutoSaveOnErrorEnabled(): boolean {
    return this.autoSaveOnError;
  }
}

// Export singleton instance
export const loggerService = new LoggerService();
