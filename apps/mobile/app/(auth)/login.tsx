import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, Typography, Shadows } from '@/constants/Theme';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Details, 2: OTP/Password

  const handleNext = () => {
    if (step === 1) {
      if (!contact) return;
      setStep(2);
    } else {
      // Mock login logic
      login({
        id: Math.random().toString(36).substr(2, 9),
        name: name || 'Gully Player',
        email: contact.includes('@') ? contact : undefined,
        phone: !contact.includes('@') ? contact : undefined,
      });
      router.replace('/(tabs)');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Image
              source={require('../../assets/images/icon.png')}
              style={styles.logo}
            />
          </View>
          <Text style={styles.title}>GullyCric</Text>
          <Text style={styles.subtitle}>
            {mode === 'signup' ? 'Create your player profile' : 'Welcome back, player!'}
          </Text>
        </View>

        <View style={styles.form}>
          {step === 1 ? (
            <>
              {mode === 'signup' && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Display Name</Text>
                  <View style={styles.clayInput}>
                    <Ionicons name="person-outline" size={20} color={Colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your name"
                      value={name}
                      onChangeText={setName}
                    />
                  </View>
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email or Phone</Text>
                <View style={styles.clayInput}>
                  <Ionicons name="mail-outline" size={20} color={Colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter email or phone number"
                    value={contact}
                    onChangeText={setContact}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>
            </>
          ) : (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                {mode === 'signup' ? 'Create Password' : 'Password / OTP'}
              </Text>
              <View style={styles.clayInput}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder={mode === 'signup' ? "Choose a password" : "Enter password or OTP"}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
              <TouchableOpacity onPress={() => setStep(1)} style={styles.backLink}>
                <Text style={styles.backLinkText}>Change contact details</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>
              {step === 1 ? 'Continue' : mode === 'signup' ? 'Start Playing' : 'Login'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.textInverse} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setStep(1);
            }}
            style={styles.switchMode}
          >
            <Text style={styles.switchModeText}>
              {mode === 'signup'
                ? 'Already have an account? Login'
                : "Don't have an account? Sign up"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl * 2,
  },
  logoCircle: {
    width: 100,
    height: 100,
    backgroundColor: Colors.surface,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.glow,
  },
  logo: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  title: {
    fontFamily: Typography.fontBlack,
    fontSize: 32,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  form: {
    gap: Spacing.lg,
  },
  inputContainer: {
    gap: Spacing.xs,
  },
  label: {
    fontFamily: Typography.fontBold,
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  clayInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    height: 60,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  input: {
    flex: 1,
    fontFamily: Typography.fontFamily,
    fontSize: 16,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    height: 60,
    borderRadius: Radius.xl,
    gap: Spacing.sm,
    marginTop: Spacing.md,
    ...Shadows.glow,
  },
  primaryButtonText: {
    fontFamily: Typography.fontBold,
    fontSize: 18,
    color: Colors.textInverse,
  },
  switchMode: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  switchModeText: {
    fontFamily: Typography.fontBold,
    fontSize: 14,
    color: Colors.primary,
  },
  backLink: {
    marginTop: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  backLinkText: {
    fontFamily: Typography.fontFamily,
    fontSize: 12,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
});
