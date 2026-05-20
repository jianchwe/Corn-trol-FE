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
import { colors, typography, spacing, preset } from "../theme";

import { createRecord } from "../api/records";
import { requestAnalysis } from "../api/analysis";
import { useRecord } from "../context/RecordContext";
import { recommendConnection, createConnection } from "../api/connection";

export default function TextMemoModal({ visible, onClose, onSave }) {
  const [content, setContent] = useState("");
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
      setLastSaved(Date.now());
      try {
        await requestAnalysis(result);
      } catch (e) {}
      try {
        const recommendResult = await recommendConnection(result);
        if (
          recommendResult?.sourceRecordId &&
          recommendResult?.targetRecordId
        ) {
          try {
            await createConnection(
              recommendResult.sourceRecordId,
              recommendResult.targetRecordId,
            );
          } catch (e) {}
        }
      } catch (e) {}
    } catch (e) {
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

        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          <TextInput
            style={styles.input}
            placeholder="당신의 생각을 기록해보세요."
            placeholderTextColor={colors.textSecondary}
            multiline
            value={content}
            onChangeText={setContent}
            keyboardAppearance="light"
          />
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
    ...StyleSheet.absoluteFillObject,
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
});
