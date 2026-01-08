import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';

import { ScreenContainer } from '../components/ScreenContainer';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../../theme/colors';
import {
  registerUser,
  passwordStrengthLabel,
  passwordStrengthScore,
  normalizeEmail,
} from '../storage/authStore';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strength = useMemo(() => passwordStrengthScore(form.password), [form.password]);

  const canSubmit = useMemo(() => {
    if (busy) return false;
    if (!form.email.trim()) return false;
    if (!form.password) return false;
    if (form.password !== form.confirm) return false;
    return true;
  }, [busy, form.email, form.password, form.confirm]);

  return (
    <ScreenContainer contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title} allowFontScaling>
          Register
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
            autoCapitalize="none"
            autoCorrect={false}
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

        <View style={styles.strengthRow}>
          <Text style={styles.strengthLabel} allowFontScaling>
            {form.password ? `Strength: ${passwordStrengthLabel(strength)}` : ''}
          </Text>
          <View style={styles.strengthBars}>
            {Array.from({ length: 4 }).map((_, idx) => {
              const active = idx < strength;
              return <View key={idx} style={[styles.strengthBar, active && styles.strengthBarActive]} />;
            })}
          </View>
        </View>

        <Text style={styles.ruleText} allowFontScaling>
          Password requires 8+ characters, 1 capital, and 1 special character.
        </Text>

        <Text style={styles.label} allowFontScaling>
          Confirm Password
        </Text>
        <View style={styles.inputWrap}>
          <TextInput
            value={form.confirm}
            onChangeText={(t) => setForm((p) => ({ ...p, confirm: t }))}
            secureTextEntry={!showConfirm}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.inputInner}
            accessibilityLabel="Confirm password"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showConfirm ? 'Hide password confirmation' : 'Show password confirmation'}
            onPress={() => setShowConfirm((v) => !v)}
            hitSlop={8}
            style={({ pressed }) => [styles.peekBtn, pressed && styles.peekBtnPressed]}
          >
            <MaterialIcons
              name={showConfirm ? 'visibility-off' : 'visibility'}
              size={22}
              color={colors.text}
            />
          </Pressable>
        </View>

        <PrimaryButton
          title={busy ? 'Creating Account' : 'Create Account'}
          onPress={async () => {
            if (!canSubmit) return;
            setBusy(true);
            try {
              await registerUser({ email: form.email, password: form.password });
              Alert.alert('Account created', 'You can sign in now.', [
                { text: 'OK', onPress: () => navigation.replace('Login') },
              ]);
            } catch (e: any) {
              const msg = typeof e?.message === 'string' ? e.message : 'Registration failed.';
              Alert.alert('Register', msg);
            } finally {
              setBusy(false);
            }
          }}
          disabled={!canSubmit}
        />

        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Back to sign in"
          onPress={() => navigation.replace('Login')}
          style={({ pressed }) => [styles.linkBtn, pressed && styles.linkBtnPressed]}
        >
          <Text style={styles.linkText} allowFontScaling>
            Back to Sign In
          </Text>
        </Pressable>
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
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  strengthLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 6,
  },
  strengthBar: {
    width: 16,
    height: 6,
    borderRadius: 999,
    borderColor: colors.primary,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  strengthBarActive: {
    backgroundColor: colors.button,
  },
  ruleText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  linkBtn: {
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: 'center',
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
