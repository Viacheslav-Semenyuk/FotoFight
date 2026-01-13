import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';

interface PopoverProps {
  visible: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<View>;
  children: React.ReactNode;
}

export default function Popover({ visible, onClose, anchorRef, children }: PopoverProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (visible && anchorRef.current) {
      // Small delay to ensure layout is complete
      const timer = setTimeout(() => {
        if (anchorRef.current) {
          // Measure anchor position
          anchorRef.current.measureInWindow((x, y, width, height) => {
            const screenWidth = Dimensions.get('window').width;
            const screenHeight = Dimensions.get('window').height;
            const popoverWidth = 200; // Approximate width
            const popoverHeight = 150; // Approximate height
            
            // Position popover to the right and below avatar (bottom-right)
            // Adjust if it would go off screen
            let left = x + width + 8; // 8px gap from avatar (right side)
            let top = y + height + 8; // 8px gap from avatar (below)
            
            // If popover would go off right edge, position to the left
            if (left + popoverWidth > screenWidth - 16) {
              left = x - popoverWidth - 8; // Position to the left
            }
            
            // Ensure popover doesn't go off left edge
            if (left < 16) {
              left = 16;
            }
            
            // If popover would go off bottom edge, position above avatar
            if (top + popoverHeight > screenHeight - 16) {
              top = y - popoverHeight - 8; // Position above avatar
            }
            
            // Ensure popover doesn't go off top edge
            if (top < 16) {
              top = 16;
            }
            
            setPosition({ top, left });
          });
        }
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [visible, anchorRef]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.popover,
            {
              top: position.top,
              left: position.left,
            },
          ]}
          onPress={(e) => {
            // Prevent closing when clicking inside popover
            e.stopPropagation();
          }}
        >
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  popover: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
  },
});
