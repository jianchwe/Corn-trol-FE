import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { colors, typography, spacing } from "../theme";
import { login } from "../api/auth";
import { useUser } from "../context/UserContext";
import { getMyProfile } from "../api/user";

export default function LoginScreen({ navigation, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { setNickname } = useUser();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("", "이메일과 비밀번호를 입력해주세요.");
      return;
    }
    try {
      setLoading(true);
      await login(email, password);
      const profile = await getMyProfile();
      setNickname(profile.nickname);
      onLoginSuccess();
    } catch (e) {
      Alert.alert("", "이메일 또는 비밀번호가 올바르지 않아요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inner}
      >
        <Text style={styles.title}>Corn-trol</Text>
        <Text style={styles.subtitle}>팝콘브레인을 잡아요 🌽</Text>

        <TextInput
          style={styles.input}
          placeholder="이메일"
          placeholderTextColor={colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="비밀번호"
          placeholderTextColor={colors.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>
            {loading ? "로그인 중..." : "로그인"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signupButton}
          onPress={() => navigation.navigate("Signup")}
        >
          <Text style={styles.signupButtonText}>회원가입</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: "center",
  },
  title: {
    fontSize: 40,
    fontFamily: "Pretendard-Bold",
    color: colors.primary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl * 2,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  loginButtonText: {
    ...typography.body,
    fontFamily: "Pretendard-Bold",
    color: "#FFFFFF",
  },
  signupButton: {
    alignItems: "center",
    padding: spacing.sm,
  },
  signupButtonText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
