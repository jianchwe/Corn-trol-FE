import { useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { colors, typography, spacing, preset } from "../theme";
import { Gear } from "phosphor-react-native";

import { useUser } from "../context/UserContext";
import { getMyStats, getMyProfile, updateMyProfile } from "../api/user";
import { logout, withdraw, changePassword } from "../api/auth";

const PROFILE_OPTIONS = ["🌱", "🪴", "🌽", "🍿"];

export default function ProfileScreen({ onLogout }) {
  const { nickname, setNickname, profileEmoji, setProfileEmoji, focusCount } =
    useUser();
  const [nicknameModalVisible, setNicknameModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [inputNickname, setInputNickname] = useState("");
  const [stats, setStats] = useState(null);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useFocusEffect(
    useCallback(() => {
      const fetchStats = async () => {
        try {
          const [statsData, profileData] = await Promise.all([
            getMyStats(),
            getMyProfile(),
          ]);
          setStats(statsData);
          setNickname(profileData.nickname);
        } catch (e) {}
      };
      fetchStats();
    }, []),
  );

  const handleNicknameSave = async () => {
    if (inputNickname.trim() === "") return;
    try {
      await updateMyProfile(inputNickname.trim());
    } catch (e) {}
    setNickname(inputNickname.trim());
    setInputNickname("");
    setNicknameModalVisible(false);
  };

  const handlePasswordChange = async () => {
    if (!currentPassword.trim() || !newPassword.trim()) return;
    try {
      await changePassword(currentPassword, newPassword);
      Alert.alert("", "비밀번호가 변경됐어요.");
      setCurrentPassword("");
      setNewPassword("");
      setPasswordModalVisible(false);
    } catch (e) {
      Alert.alert("", "비밀번호 변경에 실패했어요.");
    }
  };

  const handleLogout = async () => {
    Alert.alert("", "로그아웃 할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
          } catch (e) {}
          onLogout();
        },
      },
    ]);
  };

  const handleWithdraw = async () => {
    Alert.alert("", "정말 탈퇴할까요?\n모든 데이터가 삭제돼요.", [
      { text: "취소", style: "cancel" },
      {
        text: "탈퇴",
        style: "destructive",
        onPress: async () => {
          try {
            await withdraw();
          } catch (e) {}
          onLogout();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.cardContainer}>
          <Text style={styles.title}>콘 프로필</Text>
          <View style={styles.card}>
            {/* 설정 아이콘 */}
            <TouchableOpacity
              style={styles.settingsIcon}
              onPress={() => setSettingsModalVisible(true)}
            >
              <Gear size={25} color={colors.primary} />
            </TouchableOpacity>

            {/* 프로필 이모지 */}
            <TouchableOpacity
              style={styles.profile}
              onPress={() => setProfileModalVisible(true)}
            >
              <Text style={styles.profileEmoji}>{profileEmoji}</Text>
            </TouchableOpacity>

            {/* 닉네임 */}
            <TouchableOpacity
              style={styles.name}
              onPress={() => {
                setInputNickname(nickname);
                setNicknameModalVisible(true);
              }}
            >
              <Text style={styles.nameText}>{nickname}</Text>
            </TouchableOpacity>

            {/* 통계 */}
            <View style={styles.records}>
              <View style={styles.recordItem}>
                <Text style={styles.recordsScore}>
                  {stats ? stats.totalRecords : 0}
                </Text>
                <Text style={styles.recordsText}>팝콘 갯수</Text>
              </View>
              <View style={styles.line} />
              <View style={styles.recordItem}>
                <Text style={styles.recordsScore}>
                  {stats ? stats.totalFocusCount : focusCount}
                </Text>
                <Text style={styles.recordsText}>알곡 식히기 횟수</Text>
              </View>
              <View style={styles.line} />
              <View style={styles.recordItem}>
                <Text style={styles.recordsScore}>
                  {stats ? stats.totalConnections : 0}
                </Text>
                <Text style={styles.recordsText}>생각줄기</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 프로필 선택 모달 */}
      <Modal visible={profileModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setProfileModalVisible(false)}
          activeOpacity={1}
        >
          <TouchableOpacity activeOpacity={1}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>프로필 선택</Text>
              <View style={styles.profileRow}>
                {PROFILE_OPTIONS.map((profile) => (
                  <TouchableOpacity
                    key={profile}
                    style={[
                      styles.profileItem,
                      profileEmoji === profile && styles.profileItemSelected,
                    ]}
                    onPress={() => {
                      setProfileEmoji(profile);
                      setProfileModalVisible(false);
                    }}
                  >
                    <Text style={styles.profileOption}>{profile}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 닉네임 변경 모달 */}
      <Modal visible={nicknameModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>닉네임 변경</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="새 닉네임 입력"
              placeholderTextColor={colors.textSecondary}
              value={inputNickname}
              onChangeText={setInputNickname}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setNicknameModalVisible(false)}>
                <Text style={styles.modalCancel}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNicknameSave}>
                <Text style={styles.modalConfirm}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 설정 모달 */}
      <Modal visible={settingsModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setSettingsModalVisible(false)}
          activeOpacity={1}
        >
          <TouchableOpacity activeOpacity={1}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>설정</Text>
              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => {
                  setSettingsModalVisible(false);
                  setInputNickname(nickname);
                  setNicknameModalVisible(true);
                }}
              >
                <Text style={styles.settingItemText}>닉네임 변경</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => {
                  setSettingsModalVisible(false);
                  setPasswordModalVisible(true);
                }}
              >
                <Text style={styles.settingItemText}>비밀번호 변경</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => {
                  setSettingsModalVisible(false);
                  handleLogout();
                }}
              >
                <Text style={styles.settingItemText}>로그아웃</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => {
                  setSettingsModalVisible(false);
                  handleWithdraw();
                }}
              >
                <Text style={[styles.settingItemText, { color: "#FF5252" }]}>
                  회원탈퇴
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 비밀번호 변경 모달 */}
      <Modal visible={passwordModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>비밀번호 변경</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="현재 비밀번호"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <Text style={styles.passwordHint}>
              8~20자, 영문 대소문자·숫자·특수문자(@$!%*?&) 각 1개 이상
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="새 비밀번호"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                <Text style={styles.modalCancel}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handlePasswordChange}>
                <Text style={styles.modalConfirm}>변경</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  cardContainer: {
    flex: 1,
    justifyContent: "center",
  },
  card: {
    height: 450,
    ...preset.card,
    borderRadius: 30,
    padding: spacing.md,
    marginBottom: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF9E6",
    borderColor: "#F6EFDB",
  },
  profile: {
    width: 110,
    height: 110,
    borderRadius: 99,
    ...preset.card,
    borderWidth: 3,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  profileEmoji: {
    fontSize: 52,
  },
  name: {
    height: 35,
    borderRadius: 10,
    backgroundColor: colors.primary,
    marginTop: 18,
    justifyContent: "center",
  },
  nameText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Pretendard-SemiBold",
    textAlign: "center",
    marginHorizontal: 16,
  },
  records: {
    width: 310,
    height: 105,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderColor: colors.primary,
    borderWidth: 2,
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  recordItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  line: {
    width: 1,
    height: 45,
    backgroundColor: colors.border,
  },
  recordsScore: {
    fontSize: 32,
    fontFamily: "Pretendard-Bold",
    color: colors.primary,
    textAlign: "center",
  },
  recordsText: {
    ...typography.small,
    color: colors.textSecondary,
    textAlign: "center",
  },
  profileRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: spacing.md,
    gap: 5,
  },
  profileItem: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  profileItemSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  profileOption: {
    fontSize: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: spacing.lg,
    width: "80%",
  },
  modalTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  modalInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
  },
  modalCancel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  modalConfirm: {
    ...typography.body,
    color: colors.primary,
    fontWeight: "bold",
  },
  settingsIcon: {
    position: "absolute",
    top: 20,
    right: 20,
  },
  settingItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingItemText: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  passwordHint: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
});
