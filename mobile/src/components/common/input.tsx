import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { ChevronDown, Lightbulb } from 'lucide-react-native';
import { Colors, Radii, Spacing, Typography } from '../../constants/theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  maxLength?: number;
  showCharCount?: boolean;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  maxLength,
  showCharCount = false,
  containerStyle,
  value = '',
  onFocus,
  onBlur,
  style,
  multiline,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          multiline ? styles.textareaWrapper : null,
          isFocused ? styles.focusedWrapper : null,
          error ? styles.errorWrapper : null,
        ]}
      >
        <TextInput
          placeholderTextColor={Colors.textLight}
          value={value}
          maxLength={maxLength}
          multiline={multiline}
          style={[styles.input, multiline ? styles.textarea : null, style]}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
      </View>
      <View style={styles.metaRow}>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        {showCharCount && maxLength ? (
          <Text style={styles.charCount}>
            {value?.length || 0}/{maxLength}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

export interface SelectDropdownProps {
  label?: string;
  value: string;
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
  containerStyle?: ViewStyle;
}

export const SelectDropdown: React.FC<SelectDropdownProps> = ({
  label,
  value,
  options,
  onSelect,
  containerStyle,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setIsOpen(!isOpen)}
        style={[styles.inputWrapper, styles.selectTrigger]}
      >
        <Text style={selectedOption ? styles.selectText : styles.placeholderText}>
          {selectedOption ? selectedOption.label : 'Select an option'}
        </Text>
        <ChevronDown size={18} color={Colors.textMuted} />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.dropdownMenu}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => {
                onSelect(option.value);
                setIsOpen(false);
              }}
              style={[
                styles.dropdownItem,
                option.value === value && styles.selectedDropdownItem,
              ]}
            >
              <Text
                style={[
                  styles.dropdownItemText,
                  option.value === value && styles.selectedDropdownItemText,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

export const TipCallout: React.FC<{ text: string; style?: ViewStyle }> = ({ text, style }) => (
  <View style={[styles.tipContainer, style]}>
    <Lightbulb size={20} color={Colors.primary} style={styles.tipIcon} />
    <Text style={styles.tipText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: Spacing.xs + 2,
  },
  inputWrapper: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    height: 48,
    justifyContent: 'center',
  },
  textareaWrapper: {
    height: 100,
    paddingVertical: Spacing.sm,
  },
  focusedWrapper: {
    borderColor: Colors.primary,
  },
  errorWrapper: {
    borderColor: Colors.error,
  },
  input: {
    fontSize: Typography.sizes.base,
    color: Colors.text,
    padding: 0,
  },
  textarea: {
    textAlignVertical: 'top',
    height: '100%',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  errorText: {
    fontSize: Typography.sizes.xs,
    color: Colors.error,
    fontWeight: Typography.weights.medium,
  },
  charCount: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    textAlign: 'right',
  },
  selectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    fontSize: Typography.sizes.base,
    color: Colors.text,
  },
  placeholderText: {
    fontSize: Typography.sizes.base,
    color: Colors.textLight,
  },
  dropdownMenu: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    marginTop: 4,
    overflow: 'hidden',
    zIndex: 1000,
  },
  dropdownItem: {
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  selectedDropdownItem: {
    backgroundColor: Colors.primaryBg,
  },
  dropdownItemText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text,
  },
  selectedDropdownItemText: {
    color: Colors.primary,
    fontWeight: Typography.weights.semibold,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryBg,
    borderColor: Colors.primaryBorder,
    borderWidth: 1,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginVertical: Spacing.md,
  },
  tipIcon: {
    marginRight: Spacing.sm,
    flexShrink: 0,
  },
  tipText: {
    fontSize: Typography.sizes.sm,
    color: '#065F46',
    flex: 1,
    lineHeight: 18,
  },
});
