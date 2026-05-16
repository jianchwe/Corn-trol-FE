import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
} from "react-native";
import { Audio } from "expo-av";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Microphone } from "phosphor-react-native";
import { colors, typography, spacing, preset } from "../theme";

import { useRecord } from "../context/RecordContext";

const BAR_COUNT = 26;

export default function VoiceMemoModal({ visible, onClose, onSave }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef(null);
  const barAnimations = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(4)),
  ).current;
  const historyRef = useRef(Array(BAR_COUNT).fill(0));
  const slideAnim = useRef(new Animated.Value(300)).current;

  const { addRecord } = useRecord();

  // 슬라이드 애니메이션 — visible 바뀔 때마다 실행
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

  // 모달 닫힐 때 녹음 정리
  useEffect(() => {
    if (!visible && isRecording) {
      stopRecording();
    }
  }, [visible]);

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}.${m}.${d}`;
  };

  const updateBars = (metering) => {
    const normalized = Math.max(0, Math.min(1, (metering + 30) / 30));

    // 새 값을 오른쪽에 추가하고 왼쪽으로 밀기
    const newHistory = [...historyRef.current.slice(1), normalized];
    historyRef.current = newHistory;

    const maxHeight = 130;
    const minHeight = 4;

    barAnimations.forEach((anim, index) => {
      const height = minHeight + (maxHeight - minHeight) * newHistory[index];

      Animated.spring(anim, {
        toValue: height,
        useNativeDriver: false,
        speed: 60,
        bounciness: 0,
      }).start();
    });
  };

  const resetBars = () => {
    barAnimations.forEach((anim) => {
      Animated.spring(anim, {
        toValue: 4,
        useNativeDriver: false,
        speed: 10,
      }).start();
    });
  };

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        alert("마이크 권한이 필요해요.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        isMeteringEnabled: true,
      });

      recording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording && status.metering !== undefined) {
          updateBars(status.metering);
        }
      });

      recording.setProgressUpdateInterval(100);
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (err) {
      console.error("녹음 시작 실패:", err);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) return null;
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setIsRecording(false);
      resetBars();
      return uri;
    } catch (err) {
      console.error("녹음 중지 실패:", err);
      return null;
    }
  };

  const handleMicPress = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const handleSave = async () => {
    let uri = null;
    if (isRecording) {
      uri = await stopRecording();
    }
    addRecord({
      content: uri ? "음성 기록" : "",
      type: "voice",
      date: currentDate,
      uri: uri,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          {/* 날짜 */}
          <TouchableOpacity onPress={() => setDatePickerVisible(true)}>
            <Text style={styles.date}>{formatDate(currentDate)}</Text>
          </TouchableOpacity>

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

          {/* 마이크 버튼 + 파형 */}
          <TouchableOpacity
            style={[styles.micCircle, isRecording && styles.micCircleActive]}
            onPress={handleMicPress}
          >
            {isRecording ? (
              <View style={styles.waveContainer}>
                {barAnimations.map((anim, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.bar,
                      { height: anim, backgroundColor: "#FFFFFF" },
                    ]}
                  />
                ))}
              </View>
            ) : (
              <Microphone size={120} color={colors.primary} />
            )}
          </TouchableOpacity>

          <Text style={styles.recordingText}>
            {isRecording ? "눌러서 중지" : "눌러서 녹음 시작"}
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.backButton}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
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
    alignItems: "center",
  },
  date: {
    ...typography.h2,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  micCircle: {
    width: 230,
    height: 230,
    borderRadius: 130,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    //overflow: "hidden",
    ...preset.card,
    borderWidth: 0,
  },
  micCircleActive: {
    backgroundColor: colors.primary,
  },
  waveContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    height: 100,
  },
  bar: {
    width: 3,
    borderRadius: 2,
    minHeight: 4,
  },
  recordingText: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
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
    //paddingRight: 30,
  },
});
