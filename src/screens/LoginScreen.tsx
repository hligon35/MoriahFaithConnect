import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';

import { ScreenContainer } from '../components/ScreenContainer';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../../theme/colors';
import { useAuth } from '../state/AuthContext';
import { useAdmin } from '../state/AdminContext';
import type { RootStackParamList } from '../navigation/types';
import { normalizeEmail } from '../storage/authStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { signInWithPassword, signInWithBiometric } = useAuth();
  const { setAdminEnabled, setAdminViewOnly } = useAdmin();
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const canSubmit = useMemo(() => {
    return !!form.email.trim() && !!form.password.trim() && !busy;
  }, [form.email, form.password, busy]);

  useEffect(() => {
    (async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasHardware && enrolled);

      if (!hasHardware || !enrolled) return;

      // Auto prompt once when the screen opens.
      try {
        setBusy(true);
        const res = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Sign in',
          fallbackLabel: 'Use passcode',
          cancelLabel: 'Cancel',
        });
        if (res.success) {
          try {
            const authed = await signInWithBiometric();
            const isAdmin = authed.role === 'admin';
            await setAdminEnabled(isAdmin);
            await setAdminViewOnly(isAdmin);
          } catch (e: any) {
            const msg = typeof e?.message === 'string' ? e.message : 'Biometric sign-in failed.';
            Alert.alert('Sign In', msg);
          }
        }
      } finally {
        setBusy(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBiometric = async () => {
    try {
      setBusy(true);
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Sign in',
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
      });
      if (res.success) {
        try {
          const authed = await signInWithBiometric();
          const isAdmin = authed.role === 'admin';
          await setAdminEnabled(isAdmin);
          await setAdminViewOnly(isAdmin);
        } catch (e: any) {
          const msg = typeof e?.message === 'string' ? e.message : 'Biometric sign-in failed.';
          Alert.alert('Sign In', msg);
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer
      contentContainerStyle={styles.container}
      backgroundSource={require('../../assets/background.png')}
    >
      <View style={styles.card}>
        <Text style={styles.title} allowFontScaling>
          Sign In
        </Text>
        <View style={styles.divider} />

        <Text style={styles.label} allowFontScaling>
          Email
        </Text>
        <TextInput
          value={form.email}
          onChangeText={(t) => setForm((p) => ({ ...p, email: t }))}
          onBlur={() => setForm((p) => ({ ...p, email: normalizeEmail(p.email) }))}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          style={styles.input}
          accessibilityLabel="Email"
        />

        <Text style={styles.label} allowFontScaling>
          Password
        </Text>
        <View style={styles.inputWrap}>
          <TextInput
            value={form.password}
            onChangeText={(t) => setForm((p) => ({ ...p, password: t }))}
            secureTextEntry={!showPassword}
            style={styles.inputInner}
            accessibilityLabel="Password"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            onPress={() => setShowPassword((v) => !v)}
            hitSlop={8}
            style={({ pressed }) => [styles.peekBtn, pressed && styles.peekBtnPressed]}
          >
            <MaterialIcons
              name={showPassword ? 'visibility-off' : 'visibility'}
              size={22}
              color={colors.text}
            />
          </Pressable>
        </View>

        <PrimaryButton
          title={busy ? 'Signing In' : 'Sign In'}
          onPress={async () => {
            if (!form.email.trim() || !form.password.trim()) return;

            setBusy(true);
            try {
              const authed = await signInWithPassword({ email: form.email, password: form.password });
              const isAdmin = authed.role === 'admin';
              await setAdminEnabled(isAdmin);
              await setAdminViewOnly(isAdmin);
            } catch (e: any) {
              const msg = typeof e?.message === 'string' ? e.message : 'Sign in failed.';
              Alert.alert('Sign In', msg);
            } finally {
              setBusy(false);
            }
          }}
          disabled={!canSubmit}
        />

        {biometricAvailable && (
          <PrimaryButton
            title={busy ? 'Signing In' : 'Biometric Sign In'}
            onPress={handleBiometric}
            disabled={busy}
          />
        )}

        <View style={styles.linksRow}>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Register"
            onPress={() => navigation.navigate('Register')}
            style={({ pressed }) => [styles.linkBtn, pressed && styles.linkBtnPressed]}
          >
            <Text style={styles.linkText} allowFontScaling>
              Register
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Forgot password"
            onPress={() => navigation.navigate('ForgotPassword')}
            style={({ pressed }) => [styles.linkBtn, pressed && styles.linkBtnPressed]}
          >
            <Text style={styles.linkText} allowFontScaling>
              Forgot Password
            </Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  card: {
    backgroundColor: colors.highlight,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  divider: {
    alignSelf: 'center',
    width: '60%',
    height: 1,
    backgroundColor: colors.text,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  inputWrap: {
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  inputInner: {
    flex: 1,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  peekBtn: {
    paddingLeft: 10,
    paddingVertical: 6,
  },
  peekBtnPressed: {
    opacity: 0.85,
  },
  input: {
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  linkBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  linkBtnPressed: {
    opacity: 0.85,
  },
  linkText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
});
