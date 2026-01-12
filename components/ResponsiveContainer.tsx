import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useResponsive, CONTENT_MAX_WIDTH } from '../hooks/useResponsive';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  fullWidth?: boolean;
}

export default function ResponsiveContainer({
  children,
  style,
  contentStyle,
  fullWidth = false,
}: ResponsiveContainerProps) {
  const { isDesktop, isTablet } = useResponsive();
  const centerContent = (isDesktop || isTablet) && !fullWidth;

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.content,
          centerContent && styles.centeredContent,
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  content: {
    flex: 1,
    width: '100%',
  },
  centeredContent: {
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
});
