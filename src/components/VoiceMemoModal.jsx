import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Animated,
} from "react-native";
import { Audio } from "expo-av";
import { Microphone } from "phosphor-react-native";
import { colors, typography, spacing, preset } from "../theme";

import { uploadMedia } from "../api/media";
import { createRecord } from "../api/records";
import { requestAnalysis } from "../api/analysis";
import { useRecord } from "../context/RecordContext";
import { recommendConnection, createConnection } from "../api/connection";

const BAR_COUNT = 26;

export default function VoiceMemoModal({ visible, onClose, onSave }) {
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef(null);
  const barAnimations = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(4)),
  ).current;
  const historyRef = useRef(Array(BAR_COUNT).fill(0));
  const slideAnim = useRef(new Animated.Value(300)).current;

  const { setLastSaved } = useRecord();
  const [isSaving, setIsSaving] = useState(false);
  const lastRecordingUriRef = useRef(null);

  // 모달 슬라이드 애니메이션
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
        android: {
          extension: ".wav",
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: ".wav",
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
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
    } catch (err) {}
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) return null;
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setIsRecording(false);
      resetBars();
      lastRecordingUriRef.current = uri;
      return uri;
    } catch (err) {
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

  const handleClose = () => {
    if (isRecording) {
      stopRecording();
    }
    resetBars();
    historyRef.current = Array(BAR_COUNT).fill(0);
    lastRecordingUriRef.current = null;
    onClose();
  };

  const handleSave = async () => {
    if (isSaving) return;
    let uri = null;
    if (isRecording) {
      uri = await stopRecording();
    } else {
      uri = lastRecordingUriRef.current;
    }
    setIsSaving(true);
    handleClose();
    try {
      if (uri) {
        const mediaResult = await uploadMedia(uri);
        const recordId = await createRecord(
          mediaResult.text,
          "VOICE",
          mediaResult.url,
        );
        try {
          await requestAnalysis(recordId);
        } catch (e) {}
        try {
          const recommendResult = await recommendConnection(recordId);
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
        setLastSaved(Date.now());
      }
    } catch (e) {
      Alert.alert("", "저장에 실패했어요.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={handleClose} />
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
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
  micCircle: {
    width: 230,
    height: 230,
    borderRadius: 130,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
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
  },
});
