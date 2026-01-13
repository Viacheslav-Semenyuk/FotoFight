import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from './BottomSheet';
import Popover from './Popover';
import { useResponsive } from '../hooks/useResponsive';

interface AvatarMenuProps {
  visible: boolean;
  onClose: () => void;
  onChangeAvatar: () => void;
  onRemoveAvatar: () => void;
  hasAvatar: boolean;
  anchorRef?: React.RefObject<View>;
}

export default function AvatarMenu({
  visible,
  onClose,
  onChangeAvatar,
  onRemoveAvatar,
  hasAvatar,
  anchorRef,
}: AvatarMenuProps) {
  const { isMobile } = useResponsive();
  const isWeb = Platform.OS === 'web';

  const handleChangeAvatar = () => {
    onClose();
    onChangeAvatar();
  };

  const handleRemoveAvatar = () => {
    onClose();
    onRemoveAvatar();
  };

  const menuContent = (
    <View style={styles.menuContent}>
      <Pressable
        style={styles.menuOption}
        onPress={handleChangeAvatar}
      >
        <Ionicons name="image-outline" size={20} color="#262626" />
        <Text style={styles.menuOptionText}>Change Avatar</Text>
      </Pressable>
      
      {hasAvatar && (
        <Pressable
          style={[styles.menuOption, styles.menuOptionDanger]}
          onPress={handleRemoveAvatar}
        >
          <Ionicons name="trash-outline" size={20} color="#ff3b30" />
          <Text style={[styles.menuOptionText, styles.menuOptionTextDanger]}>
            Remove Avatar
          </Text>
        </Pressable>
      )}
      
      <Pressable
        style={styles.menuOption}
        onPress={onClose}
      >
        <Text style={styles.menuOptionText}>Cancel</Text>
      </Pressable>
    </View>
  );

  // For mobile devices, use Bottom Sheet
  if (isMobile && !isWeb) {
    return (
      <BottomSheet visible={visible} onClose={onClose}>
        {menuContent}
      </BottomSheet>
    );
  }

  // For web and desktop, use Popover
  if (anchorRef) {
    return (
      <Popover visible={visible} onClose={onClose} anchorRef={anchorRef}>
        {menuContent}
      </Popover>
    );
  }

  // Fallback: if no anchorRef provided on web, use Bottom Sheet
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {menuContent}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  menuContent: {
    paddingVertical: 8,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuOptionDanger: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 4,
  },
  menuOptionText: {
    fontSize: 16,
    color: '#262626',
  },
  menuOptionTextDanger: {
    color: '#ff3b30',
  },
});
