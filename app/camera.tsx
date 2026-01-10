import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { useState, useRef } from 'react';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';

export default function CameraScreen() {
  const router = useRouter();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const result = await cameraRef.current.takePictureAsync();
        if (result?.uri) {
          setPhoto(result.uri);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const handleSubmit = () => {
    if (!photo) return;
    
    // TODO: Upload photo to backend
    // For now, just show success and navigate back
    Alert.alert(
      'Photo Submitted!',
      'Your photo has been submitted. Points will be awarded after verification.',
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  };

  const handleRetake = () => {
    setPhoto(null);
  };

  if (photo) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photo }} style={styles.preview} />
        <View style={styles.controls}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleRetake}>
            <Text style={styles.secondaryButtonText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Submit Photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView 
        ref={cameraRef}
        style={styles.camera} 
        facing={facing}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.flipButton}
            onPress={() => setFacing(current => current === 'back' ? 'front' : 'back')}
          >
            <Text style={styles.flipButtonText}>Flip</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
      <View style={styles.controls}>
        <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 20,
  },
  flipButton: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 5,
  },
  flipButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  controls: {
    backgroundColor: '#000',
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#FF6B6B',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF6B6B',
  },
  preview: {
    flex: 1,
    resizeMode: 'contain',
  },
  primaryButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#fff',
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 25,
  },
});
