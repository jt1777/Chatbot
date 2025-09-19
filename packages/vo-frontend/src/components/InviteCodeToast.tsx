import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Clipboard } from 'react-native';
import { BaseToast, BaseToastProps } from 'react-native-toast-message';

interface InviteCodeToastProps extends BaseToastProps {
  props: {
    inviteCode: string;
  };
}

export const InviteCodeToast = (props: InviteCodeToastProps) => {
  const { text1, text2, props: customProps } = props;
  const { inviteCode } = customProps;
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await Clipboard.setString(inviteCode);
      setIsCopied(true);
      // Reset the copied state after 2 seconds
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy invite code:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.toastContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{text1}</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              // Hide the toast
              const Toast = require('react-native-toast-message').default;
              Toast.hide();
            }}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.message}>{text2}</Text>
        
        <View style={styles.inviteCodeContainer}>
          <Text style={styles.inviteCodeLabel}>Invite Code:</Text>
          <View style={styles.inviteCodeBox}>
            <Text style={styles.inviteCodeText}>{inviteCode}</Text>
          </View>
          <TouchableOpacity
            style={[styles.copyButton, isCopied && styles.copyButtonCopied]}
            onPress={handleCopyCode}
          >
            <Text style={styles.copyButtonText}>
              {isCopied ? '✓ Copied!' : '📋 Copy Code'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.instruction}>
          Share this code with the person you want to invite. They'll need to use the exact email address and this code to join your organization.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  toastContent: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  message: {
    fontSize: 16,
    color: 'white',
    marginBottom: 16,
  },
  inviteCodeContainer: {
    marginBottom: 16,
  },
  inviteCodeLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  inviteCodeBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  inviteCodeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    letterSpacing: 1,
  },
  copyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  copyButtonCopied: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
    borderColor: 'rgba(34, 197, 94, 0.5)',
  },
  copyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  instruction: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 16,
    textAlign: 'center',
  },
});
