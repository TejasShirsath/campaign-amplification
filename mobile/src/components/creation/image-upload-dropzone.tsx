import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { UploadCloud, RefreshCw, Trash2, Copy, AlertCircle, CheckCircle } from 'lucide-react-native';
import { Colors, Radii, Spacing, Typography } from '../../constants/theme';
import { uploadImageFile } from '../../api/uploads';
import { resolveImageUrl } from '../../constants/config';

interface ImageUploadDropzoneProps {
  label?: string;
  subtitle?: string;
  value?: string;
  onChange: (url: string) => void;
  target?: 'cover' | 'ad';
  aspect?: [number, number];
  canReuseCover?: boolean;
  coverImageUrl?: string;
  disabled?: boolean;
  compact?: boolean;
}

export const ImageUploadDropzone: React.FC<ImageUploadDropzoneProps> = ({
  label,
  subtitle,
  value,
  onChange,
  target = 'cover',
  aspect = target === 'cover' ? [16, 9] : [1, 1],
  canReuseCover = false,
  coverImageUrl,
  disabled = false,
  compact = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localPreviewUri, setLocalPreviewUri] = useState<string | null>(null);

  // If value is cleared from outside, reset local preview
  useEffect(() => {
    if (!value) {
      setLocalPreviewUri(null);
    }
  }, [value]);

  const handlePickImage = async () => {
    if (disabled || uploading) return;
    setError(null);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to upload campaign visuals.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect,
        quality: 0.85,
        base64: true,
      });

      if (result.canceled || !result.assets || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];

      // Validate file size (15MB limit)
      if (asset.fileSize && asset.fileSize > 15 * 1024 * 1024) {
        setError('Image must be smaller than 15MB');
        return;
      }

      // 1. Immediately store and display local image URI
      setLocalPreviewUri(asset.uri);
      onChange(asset.uri);
      setUploading(true);

      // 2. Upload to backend
      const uploadRes = await uploadImageFile(asset);
      if (uploadRes?.url) {
        onChange(uploadRes.url);
      }
    } catch (err: any) {
      console.warn('Image upload error:', err);
      setError(err?.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setError(null);
    setLocalPreviewUri(null);
    onChange('');
  };

  const handleReuseCover = () => {
    if (coverImageUrl) {
      setError(null);
      setLocalPreviewUri(null);
      onChange(coverImageUrl);
    }
  };

  const displayUri = resolveImageUrl(localPreviewUri || value);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      {/* When Image is Present */}
      {value || localPreviewUri ? (
        <View style={styles.previewContainer}>
          <View style={[styles.imageWrapper, compact && styles.imageWrapperCompact]}>
            <ExpoImage
              source={{ uri: displayUri }}
              style={styles.image}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              onError={(err) => {
                console.warn('[ImageUploadDropzone] Failed to display image:', displayUri, err);
              }}
            />
            {uploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.uploadingOverlayText}>Saving upload...</Text>
              </View>
            )}
          </View>

          <View style={styles.actionOverlay}>
            <TouchableOpacity
              style={styles.changeBtn}
              activeOpacity={0.8}
              disabled={disabled || uploading}
              onPress={handlePickImage}
            >
              <RefreshCw size={13} color="#FFFFFF" />
              <Text style={styles.changeBtnText}>Change</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.removeBtn}
              activeOpacity={0.8}
              disabled={disabled || uploading}
              onPress={handleRemove}
            >
              <Trash2 size={13} color="#EF4444" />
              <Text style={styles.removeBtnText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : uploading ? (
        <View style={styles.uploadingBox}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.uploadingText}>Uploading image...</Text>
        </View>
      ) : (
        /* Empty Upload Dropzone */
        <View>
          <TouchableOpacity
            style={[styles.dropzone, compact && styles.dropzoneCompact]}
            activeOpacity={0.7}
            disabled={disabled}
            onPress={handlePickImage}
          >
            <View style={[styles.iconCircle, compact && styles.iconCircleCompact]}>
              <UploadCloud size={compact ? 20 : 24} color={Colors.primary} />
            </View>
            <View style={compact ? styles.textColCompact : styles.textCol}>
              <Text style={compact ? styles.titleCompact : styles.title}>
                {target === 'cover' ? 'Upload cover image' : 'Upload creative image'}
              </Text>
              <Text style={styles.subtext}>JPG, PNG, or WebP up to 15MB</Text>
            </View>
          </TouchableOpacity>

          {/* Quick Option to Reuse Cover Image (for Ad Creative) */}
          {canReuseCover && coverImageUrl ? (
            <TouchableOpacity
              style={styles.reuseCoverBtn}
              activeOpacity={0.8}
              onPress={handleReuseCover}
            >
              <Copy size={13} color={Colors.primary} />
              <Text style={styles.reuseCoverBtnText}>Reuse campaign cover image as ad creative</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {/* Error feedback */}
      {error ? (
        <View style={styles.errorBox}>
          <AlertCircle size={14} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    lineHeight: 16,
  },
  dropzone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#99F6E4',
    backgroundColor: '#F0FDFA',
    borderRadius: Radii.lg,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dropzoneCompact: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleCompact: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  textCol: {
    alignItems: 'center',
  },
  textColCompact: {
    flex: 1,
  },
  title: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: '#0F766E',
    marginBottom: 2,
  },
  titleCompact: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: '#0F766E',
  },
  subtext: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  reuseCoverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.primaryBg,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  reuseCoverBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
  previewContainer: {
    borderRadius: Radii.lg,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: 180,
    backgroundColor: '#E5E7EB',
  },
  imageWrapperCompact: {
    height: 150,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadingOverlayText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: '#FFFFFF',
  },
  actionOverlay: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 10,
  },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radii.md,
    backgroundColor: Colors.primary,
  },
  changeBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: '#FFFFFF',
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.md,
    backgroundColor: '#FEE2E2',
  },
  removeBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: '#EF4444',
  },
  uploadingBox: {
    borderRadius: Radii.lg,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  uploadingText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radii.md,
    marginTop: 6,
  },
  errorText: {
    fontSize: Typography.sizes.xs,
    color: '#DC2626',
    fontWeight: Typography.weights.medium,
  },
});
