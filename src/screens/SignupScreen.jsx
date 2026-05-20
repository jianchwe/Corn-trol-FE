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
  ScrollView,
} from "react-native";
import { colors, typography, spacing } from "../theme";
import { sendVerificationEmail, verifyEmail, signup } from "../api/auth";

export default function SignupScreen({ navigation }) {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendEmail = async () => {
    if (!email.trim()) {
      Alert.alert("", "이메일을 입력해주세요.");
      return;
    }
    try {
      setLoading(true);
      await sendVerificationEmail(email);
      setIsEmailSent(true);
      Alert.alert("", "인증번호가 발송되었어요.");
    } catch (e) {
      Alert.alert("", "이메일 발송에 실패했어요.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!code.trim()) {
      Alert.alert("", "인증번호를 입력해주세요.");
      return;
    }
    try {
      setLoading(true);
      await verifyEmail(email, code);
      setIsEmailVerified(true);
      Alert.alert("", "이메일 인증이 완료됐어요.");
    } catch (e) {
      Alert.alert("", "인증번호가 올바르지 않아요.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!nickname.trim() || !email.trim() || !password.trim()) {
      Alert.alert("", "모든 항목을 입력해주세요.");
      return;
    }
    if (!isEmailVerified) {
      Alert.alert("", "이메일 인증을 완료해주세요.");
      return;
    }
    try {
      setLoading(true);
      await signup(email, password, nickname);
      Alert.alert("", "회원가입이 완료됐어요!", [
        { text: "확인", onPress: () => navigation.navigate("Login") },
      ]);
    } catch (e) {
      const errorMessage =
        e.response?.data?.message || "회원가입에 실패했어요.";
      Alert.alert("", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inner}>
            <Text style={styles.title}>회원가입</Text>

            {/* 닉네임 */}
            <Text style={styles.label}>닉네임</Text>
            <TextInput
              style={styles.input}
              placeholder="닉네임 입력"
              placeholderTextColor={colors.textSecondary}
              value={nickname}
              onChangeText={setNickname}
            />

            {/* 이메일 */}
            <Text style={styles.label}>이메일</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="이메일 입력"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.smallButton}
                onPress={handleSendEmail}
                disabled={loading}
              >
                <Text style={styles.smallButtonText}>
                  {isEmailSent ? "재발송" : "발송"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 인증번호 */}
            {isEmailSent && (
              <>
                <Text style={styles.label}>인증번호</Text>
                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    placeholder="인증번호 입력"
                    placeholderTextColor={colors.textSecondary}
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                  />
                  <TouchableOpacity
                    style={[
                      styles.smallButton,
                      isEmailVerified && styles.smallButtonVerified,
                    ]}
                    onPress={handleVerifyEmail}
                    disabled={isEmailVerified || loading}
                  >
                    <Text style={styles.smallButtonText}>
                      {isEmailVerified ? "완료" : "확인"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* 비밀번호 */}
            <Text style={styles.label}>비밀번호</Text>
            <Text style={styles.hint}>
              8~20자, 영문 대소문자, 숫자, 특수문자(@$!%*?&) 각 1개 이상
            </Text>
            <TextInput
              style={styles.input}
              placeholder="비밀번호 입력"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={styles.signupButton}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={styles.signupButtonText}>
                {loading ? "처리 중..." : "회원가입"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.loginButtonText}>이미 계정이 있어요</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    paddingVertical: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  label: {
    ...typography.body,
    fontFamily: "Pretendard-SemiBold",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  hint: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  smallButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  smallButtonVerified: {
    backgroundColor: colors.border,
  },
  smallButtonText: {
    ...typography.body,
    color: "#FFFFFF",
    fontFamily: "Pretendard-SemiBold",
  },
  signupButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  signupButtonText: {
    ...typography.body,
    fontFamily: "Pretendard-Bold",
    color: "#FFFFFF",
  },
  loginButton: {
    alignItems: "center",
    padding: spacing.sm,
  },
  loginButtonText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
