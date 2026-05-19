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
//import DateTimePickerModal from "react-native-modal-datetime-picker"; // 날짜 선택 - 없음
import { colors, typography, spacing, preset } from "../theme";

import { createRecord } from "../api/records";
import { requestAnalysis } from "../api/analysis";
import { useRecord } from "../context/RecordContext";
import { recommendConnection, createConnection } from "../api/connection";

export default function TextMemoModal({ visible, onClose, onSave }) {
  const [content, setContent] = useState("");
  //const [currentDate, setCurrentDate] = useState(new Date()); // 날짜 선택 - 없음
  //const [isDatePickerVisible, setDatePickerVisible] = useState(false);  // 날짜 선택 - 없음

  const slideAnim = useRef(new Animated.Value(300)).current;
  const [isSaving, setIsSaving] = useState(false);

  const { setLastSaved } = useRecord();

  const handleClose = () => {
    setContent("");
    onClose();
  };

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
    if (isSaving) return;
    if (content.trim() === "") {
      Alert.alert("", "내용을 입력해주세요.");
      return;
    }
    setIsSaving(true);
    handleClose();
    try {
      const result = await createRecord(content, "TEXT");
      console.log("저장 성공:", result);
      setLastSaved(Date.now());
      try {
        const analysisResult = await requestAnalysis(result);
        console.log("분석 요청 성공");
        //console.log("분석 요청 성공:", JSON.stringify(analysisResult));
      } catch (e) {
        console.log("분석 요청 실패:", e.response?.data, e.message);
      }
      // 연결 추천 요청
      try {
        const recommendResult = await recommendConnection(result);
        console.log("연결 추천 요청 성공:", JSON.stringify(recommendResult));
        // 추천 결과로 연결 생성
        if (
          recommendResult?.sourceRecordId &&
          recommendResult?.targetRecordId
        ) {
          try {
            await createConnection(
              recommendResult.sourceRecordId,
              recommendResult.targetRecordId,
            );
            console.log("연결 생성 성공");
          } catch (e) {
            console.log("연결 생성 실패:", e.message);
          }
        }
      } catch (e) {
        console.log("연결 추천 요청 실패:", e.response?.data, e.message);
      }
    } catch (e) {
      console.log("저장 실패:", e.message);
      Alert.alert("", "저장에 실패했어요.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        {/* 위쪽 어두운 영역 — 누르면 닫힘 */}
        <TouchableOpacity style={styles.backdrop} onPress={handleClose} />

        {/* 바텀시트 */}
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          {/* 날짜
          <TouchableOpacity onPress={() => setDatePickerVisible(true)}>
            <Text style={styles.date}>{formatDate(currentDate)}</Text>
          </TouchableOpacity> */}

          {/* 달력
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
          /> */}

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
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.backButton}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} disabled={isSaving}>
              <Text style={[styles.saveButton, isSaving && { opacity: 0.4 }]}>
                저장
              </Text>
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
