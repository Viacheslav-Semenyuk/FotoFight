import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { loggerService, LogEntry } from '../services/loggerService';
import { useResponsive, CONTENT_MAX_WIDTH } from '../hooks/useResponsive';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';

export default function LogsScreen() {
  const router = useRouter();
  const { isDesktop, isTablet } = useResponsive();
  const centerContent = isDesktop || isTablet;
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    // Load initial logs
    setLogs(loggerService.getLogs());

    // Subscribe to log updates
    const unsubscribe = loggerService.subscribe(() => {
      setLogs(loggerService.getLogs());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logs.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [logs.length, autoScroll]);

  const handleClearLogs = () => {
    Alert.alert(
      'Clear Logs',
      'Are you sure you want to clear all logs?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            loggerService.clearLogs();
            setLogs([]);
          },
        },
      ]
    );
  };

  const handleCopyLogs = async () => {
    try {
      const logsText = loggerService.getLogsAsString();
      await Clipboard.setStringAsync(logsText);
      Alert.alert('Success', 'Logs copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy logs to clipboard');
    }
  };

  const handleSaveLogs = async () => {
    try {
      const result = await loggerService.saveLogsToFile();
      
      if (result.success && result.filePath) {
        const formattedPath = loggerService.getFormattedFilePath(result.filePath);
        
        // Try to share the file
        try {
          // On Android, we can share the file directly
          if (Platform.OS === 'android') {
            // Check if file exists and get URI
            const fileInfo = await FileSystem.getInfoAsync(result.filePath);
            if (fileInfo.exists) {
              // Share the file using React Native Share API
              // Note: Share API might not work with file:// URIs on all platforms
              // So we'll show an alert with the path and offer to copy it
              Alert.alert(
                'Logs Saved',
                `Logs saved to:\n${formattedPath}\n\nYou can find the file in your device's file manager.`,
                [
                  {
                    text: 'Copy Path',
                    onPress: async () => {
                      await Clipboard.setStringAsync(result.filePath);
                      Alert.alert('Success', 'File path copied to clipboard');
                    },
                  },
                  {
                    text: 'OK',
                    style: 'default',
                  },
                ]
              );
            }
          } else {
            // On iOS, show path
            Alert.alert(
              'Logs Saved',
              `Logs saved to:\n${formattedPath}`,
              [
                {
                  text: 'Copy Path',
                  onPress: async () => {
                    await Clipboard.setStringAsync(result.filePath);
                    Alert.alert('Success', 'File path copied to clipboard');
                  },
                },
                {
                  text: 'OK',
                  style: 'default',
                },
              ]
            );
          }
        } catch (shareError) {
          // If sharing fails, just show the path
          Alert.alert(
            'Logs Saved',
            `Logs saved to:\n${formattedPath}\n\nPath copied to clipboard.`,
            [{ text: 'OK' }]
          );
          await Clipboard.setStringAsync(result.filePath);
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to save logs to file');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save logs: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const getLogLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return '#f44336';
      case 'warn':
        return '#ff9800';
      case 'log':
      default:
        return '#666';
    }
  };

  const getLogLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return 'close-circle';
      case 'warn':
        return 'warning';
      case 'log':
      default:
        return 'information-circle';
    }
  };

  // Filter logs based on search query
  const filteredLogs = logs.filter(log => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.message.toLowerCase().includes(query) ||
      log.level.toLowerCase().includes(query) ||
      log.timestamp.toISOString().toLowerCase().includes(query)
    );
  });

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.container,
          centerContent && styles.containerDesktop,
        ]}
      >
        <View
          style={[
            styles.header,
            centerContent && { maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center', width: '100%' },
          ]}
        >
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#262626" />
          </Pressable>
          <Text style={styles.title}>App Logs</Text>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.headerButton}
              onPress={() => setAutoScroll(!autoScroll)}
            >
              <Ionicons
                name={autoScroll ? 'lock-closed' : 'lock-open'}
                size={20}
                color={autoScroll ? '#4CAF50' : '#999'}
              />
            </Pressable>
            <Pressable style={styles.headerButton} onPress={handleCopyLogs}>
              <Ionicons name="copy-outline" size={20} color="#262626" />
            </Pressable>
            <Pressable style={styles.headerButton} onPress={handleSaveLogs}>
              <Ionicons name="download-outline" size={20} color="#4CAF50" />
            </Pressable>
            <Pressable style={styles.headerButton} onPress={handleClearLogs}>
              <Ionicons name="trash-outline" size={20} color="#c00" />
            </Pressable>
          </View>
        </View>

        {/* Search Bar */}
        <View
          style={[
            styles.searchContainer,
            centerContent && { maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center', width: '100%' },
          ]}
        >
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search logs..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable
              style={styles.clearSearchButton}
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </Pressable>
          )}
        </View>

        {/* Log Count */}
        <View
          style={[
            styles.logCountContainer,
            centerContent && { maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center', width: '100%' },
          ]}
        >
          <Text style={styles.logCountText}>
            {filteredLogs.length} of {logs.length} logs
            {searchQuery && ` (filtered)`}
          </Text>
        </View>

        {/* Logs List */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.logsContainer}
          contentContainerStyle={styles.logsContent}
          showsVerticalScrollIndicator={true}
          onScrollBeginDrag={() => setAutoScroll(false)}
        >
          {filteredLogs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No logs match your search' : 'No logs yet'}
              </Text>
            </View>
          ) : (
            filteredLogs.map((log) => (
              <View key={log.id} style={styles.logEntry}>
                <View style={styles.logHeader}>
                  <View style={styles.logLevelContainer}>
                    <Ionicons
                      name={getLogLevelIcon(log.level)}
                      size={16}
                      color={getLogLevelColor(log.level)}
                    />
                    <Text
                      style={[
                        styles.logLevel,
                        { color: getLogLevelColor(log.level) },
                      ]}
                    >
                      {log.level.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.logTimestamp}>
                    {log.timestamp.toLocaleTimeString()}
                  </Text>
                </View>
                <Text style={styles.logMessage}>{log.message}</Text>
                {log.data && log.data.length > 1 && (
                  <View style={styles.logDataContainer}>
                    <Text style={styles.logDataLabel}>Additional data:</Text>
                    <Text style={styles.logData}>
                      {JSON.stringify(log.data.slice(1), null, 2)}
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  container: {
    flex: 1,
    width: '100%',
  },
  containerDesktop: {
    alignSelf: 'center',
    maxWidth: CONTENT_MAX_WIDTH,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 8,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#262626',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#262626',
    paddingVertical: 12,
  },
  clearSearchButton: {
    padding: 4,
  },
  logCountContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  logCountText: {
    fontSize: 12,
    color: '#999',
  },
  logsContainer: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  logsContent: {
    padding: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  logEntry: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logLevel: {
    fontSize: 12,
    fontWeight: '600',
  },
  logTimestamp: {
    fontSize: 11,
    color: '#999',
  },
  logMessage: {
    fontSize: 14,
    color: '#262626',
    fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier',
    marginTop: 4,
  },
  logDataContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  logDataLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  logData: {
    fontSize: 12,
    color: '#666',
    fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier',
  },
});
