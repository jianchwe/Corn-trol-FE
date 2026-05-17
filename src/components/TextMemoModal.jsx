import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { colors, typography, spacing, preset } from "../theme";
import { useRecord } from "../context/RecordContext";

import { createRecord } from "../api/records";

export default function TextMemoModal({ visible, onClose, onSave }) {
  const [content, setContent] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  const slideAnim = useRef(new Animated.Value(300)).current;

  const { addRecord } = useRecord();

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [visible]);

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}.${m}.${d}`;
  };

  const handleSave = async () => {
    if (content.trim() === "") {
      Alert.alert("", "내용을 입력해주세요.");
      return;
    }
    try {
      await createRecord(content, "TEXT");
      addRecord({
        content: content,
        type: "text",
        date: currentDate,
      });
      setContent("");
      onClose();
    } catch (e) {
      // 서버 연결 X -> 로컬에만 저장
      addRecord({
        content: content,
        type: "text",
        date: currentDate,
      });
      setContent("");
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        {/* 위쪽 어두운 영역 — 누르면 닫힘 */}
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />

        {/* 바텀시트 */}
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          {/* 날짜 */}
          <TouchableOpacity onPress={() => setDatePickerVisible(true)}>
            <Text style={styles.date}>{formatDate(currentDate)}</Text>
          </TouchableOpacity>

          {/* 달력 */}
          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            date={currentDate}
            display="inline"
            onConfirm={(date) => {
              setCurrentDate(date);
              setDatePickerVisible(false);
            }}
            onCancel={() => setDatePickerVisible(false)}
          />

          {/* 텍스트 입력 */}
          <TextInput
            style={styles.input}
            placeholder="당신의 생각을 기록해보세요."
            placeholderTextColor={colors.textSecondary}
            multiline
            value={content}
            onChangeText={setContent}
            keyboardAppearance="light" // ← 불투명 키보드로 설정 - expo에서는 그대로 보임
          />

          {/* 버튼 */}
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.backButton}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject, // 절대위치 전체 화면
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: spacing.xl,
    paddingBottom: 40,
  },
  date: {
    ...typography.h2,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  input: {
    ...preset.card,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    height: 210,
    textAlignVertical: "top",
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    ...typography.body,
    fontFamily: "Pretendard-SemiBold",
    color: colors.textSecondary,
  },
  saveButton: {
    ...typography.body,
    fontFamily: "Pretendard-SemiBold",
    color: colors.primary,
  },
  keyboardBackground: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 350,
    backgroundColor: "#FFFFFF",
  },
});
