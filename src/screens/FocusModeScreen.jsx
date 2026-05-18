import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  TextInput,
  AppState,
  Alert,
  ScrollView,
  Pressable,
} from "react-native";
import { Svg, Circle } from "react-native-svg";
import { Play, Pause } from "phosphor-react-native";
import * as Notifications from "expo-notifications";
import { colors, typography, spacing, preset } from "../theme";
import { useUser } from "../context/UserContext";

import {
  startFocus,
  endFocus,
  getQuestions,
  requestQuestions,
} from "../api/focus";
import { useRecord } from "../context/RecordContext";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// 타이머 크기
const CIRCLE_SIZE = 320;
const RADIUS = 140;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function FocusModeScreen() {
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [remainSeconds, setRemainSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isTimeModalVisible, setTimeModalVisible] = useState(false);
  const [inputMinutes, setInputMinutes] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null); // 선택된 기록
  const [recordModalVisible, setRecordModalVisible] = useState(false); // 기록 선택 모달

  const intervalRef = useRef(null);
  const endTimeRef = useRef(null);
  const appState = useRef(AppState.currentState);

  const { incrementFocusCount } = useUser();
  const { records } = useRecord();
  const [timerCompleted, setTimerCompleted] = useState(false);

  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  // 알림 권한 요청
  useEffect(() => {
    async function requestPermissions() {
      await Notifications.requestPermissionsAsync();
    }
    requestPermissions();
  }, []);

  // 앱 포그라운드/백그라운드 감지
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      // 백그라운드로 내려갈 때 — 타이머 실행 중이면 알림 발송
      if (
        appState.current === "active" &&
        nextAppState.match(/inactive|background/) &&
        isRunning &&
        selectedRecord
      ) {
        Notifications.scheduleNotificationAsync({
          content: {
            title: `${selectedRecord.mainTopic || selectedRecord.content} 생각 중이지 않으셨나요?`,
            body: "알곡 식히기 타이머가 실행 중이에요 🌽",
          },
          trigger: null,
        });
      }

      // 포그라운드로 돌아왔을 때 남은 시간 계산
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        if (endTimeRef.current && isRunning) {
          const now = Date.now();
          const remaining = Math.max(
            0,
            Math.round((endTimeRef.current - now) / 1000),
          );
          if (remaining <= 0) {
            setRemainSeconds(0);
            setIsRunning(false);
            endTimeRef.current = null;
          } else {
            setRemainSeconds(remaining);
          }
        }
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [isRunning, selectedRecord]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setRemainSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            setTotalSeconds(0);
            endTimeRef.current = null;
            setTimerCompleted(true); // incrementFocusCount 대신
            if (appState.current === "active") {
              Alert.alert("알곡 식히기 완료 🌽", "설정한 시간이 종료됐어요!");
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  useEffect(() => {
    if (timerCompleted) {
      incrementFocusCount();
      if (sessionId) {
        endFocus(sessionId).catch(() => console.log("집중 모드 종료 API 실패"));
        setSessionId(null);
      }
      setSelectedRecord(null);
      setQuestions([]);
      setQuestionIndex(0);
      setRemainSeconds(0);
      setTotalSeconds(0);
      setTimerCompleted(false);
    }
  }, [timerCompleted]);

  // 푸시 알림 예약
  const scheduleNotification = async (seconds) => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "알곡 식히기 완료 🌽",
        body: "설정한 시간이 종료됐어요!",
      },
      trigger: {
        type: "timeInterval",
        seconds: seconds,
        repeats: false,
      },
    });
  };

  // 푸시 알림 취소
  const cancelNotification = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  };

  const handlePlayPause = async () => {
    if (!selectedRecord) {
      Alert.alert("", "기록을 먼저 선택해주세요.");
      return;
    }
    if (totalSeconds === 0) {
      setTimeModalVisible(true);
      return;
    }
    if (!isRunning && remainSeconds > 0) {
      endTimeRef.current = Date.now() + remainSeconds * 1000;
      try {
        await scheduleNotification(remainSeconds);
      } catch (e) {
        console.log("알림 예약 실패:", e);
      }
      setRemainSeconds((prev) => prev - 1);
    } else {
      try {
        await cancelNotification();
      } catch (e) {
        console.log("알림 취소 실패:", e);
      }
      endTimeRef.current = null;
    }
    setIsRunning((prev) => !prev);
  };

  const handleSetTime = async () => {
    const minutes = parseInt(inputMinutes);
    if (isNaN(minutes) || minutes <= 0) return;
    const seconds = minutes * 60;
    setTotalSeconds(seconds);
    setRemainSeconds(seconds);
    setIsRunning(false);
    endTimeRef.current = null;
    cancelNotification();
    setTimeModalVisible(false);
    setInputMinutes("");

    // 알곡 식히기 시작 API
    try {
      const id = await startFocus(selectedRecord?.id, minutes);
      setSessionId(id);
    } catch (e) {
      console.log("알곡 식히기 시작 API 실패");
    }
  };
  const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const progress = totalSeconds > 0 ? remainSeconds / totalSeconds : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isRunning ? "#FFF9E6" : colors.background },
      ]}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>알곡 식히기</Text>

        {/* AI 질문 영역 */}
        {selectedRecord ? (
          <Pressable
            style={styles.questionBox}
            onPress={() => {
              if (questions.length > 0) {
                setQuestionIndex((prev) => (prev + 1) % questions.length);
              } else {
                setRecordModalVisible(true);
              }
            }}
            onLongPress={() => {
              Alert.alert("", "기록 선택을 해지할까요?", [
                { text: "취소", style: "cancel" },
                {
                  text: "해지",
                  style: "destructive",
                  onPress: () => {
                    setSelectedRecord(null);
                    setQuestions([]);
                    setQuestionIndex(0);
                  },
                },
              ]);
            }}
            delayLongPress={300}
          >
            <Text style={styles.questionText}>
              {isLoadingQuestions
                ? "AI 질문 생성 중..."
                : questions.length > 0
                  ? questions[questionIndex]?.content
                  : "기록을 선택하면 AI 질문이 생성돼요"}
            </Text>
          </Pressable>
        ) : (
          <TouchableOpacity
            style={styles.selectBox}
            onPress={() => setRecordModalVisible(true)}
          >
            <Text style={styles.selectText}>기록을 선택해주세요</Text>
          </TouchableOpacity>
        )}

        {/* 원형 타이머 */}
        <View style={styles.timerContainer}>
          <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
            {/* 배경 원 */}
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke={colors.surface}
              strokeWidth={14}
              fill="none"
            />
            {/* 프로그레스 원 — 위쪽에서 반시계 방향 */}
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke={colors.primary}
              strokeWidth={14}
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation={-90}
              originX={CIRCLE_SIZE / 2}
              originY={CIRCLE_SIZE / 2}
            />
          </Svg>

          {/* 시간 텍스트 */}
          <TouchableOpacity
            style={styles.timeTextContainer}
            onPress={() => {
              if (!isRunning) setTimeModalVisible(true);
            }}
          >
            <Text style={styles.timeText}>{formatTime(remainSeconds)}</Text>
          </TouchableOpacity>
        </View>

        {/* 재생/일시정지 버튼 */}
        <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
          {isRunning ? (
            <Pause size={28} color="#FFFFFF" weight="fill" />
          ) : (
            <Play size={28} color="#FFFFFF" weight="fill" />
          )}
        </TouchableOpacity>
      </View>

      {/* 기록 선택 모달 */}
      <Modal visible={recordModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setRecordModalVisible(false)}
          activeOpacity={1}
        >
          <TouchableOpacity activeOpacity={1}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>기록 선택</Text>
              <ScrollView
                style={{ maxHeight: 290 }}
                showsVerticalScrollIndicator={false}
              >
                {records.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.recordItem,
                      selectedRecord?.id === item.id &&
                        styles.recordItemSelected,
                    ]}
                    onPress={async () => {
                      if (selectedRecord?.id === item.id) {
                        setSelectedRecord(null);
                        setQuestions([]);
                      } else {
                        setSelectedRecord(item);
                        setIsLoadingQuestions(true);
                        setRecordModalVisible(false);

                        try {
                          // 1차 생성 요청
                          await requestQuestions(item.id, item.mainTopic || "");
                          const q = await getQuestions(item.id);
                          console.log("1차 질문 생성 성공:", JSON.stringify(q));
                          setQuestions(q);
                          setQuestionIndex(0);
                        } catch (e) {
                          console.log(
                            "1차 질문 생성 실패, 기존 질문 조회:",
                            e.message,
                          );
                          try {
                            // 기존 질문 조회
                            const existing = await getQuestions(item.id);
                            console.log(
                              "기존 질문 조회 성공:",
                              JSON.stringify(existing),
                            );
                            if (existing.length > 0) {
                              setQuestions(existing);
                              setQuestionIndex(0);
                            } else {
                              // 2차 생성 요청
                              try {
                                await requestQuestions(
                                  item.id,
                                  item.mainTopic || "",
                                );
                                const newQ = await getQuestions(item.id);
                                console.log(
                                  "2차 질문 생성 성공:",
                                  JSON.stringify(newQ),
                                );
                                setQuestions(newQ);
                                setQuestionIndex(0);
                              } catch (e2) {
                                console.log("2차 질문 생성 실패:", e2.message);
                              }
                            }
                          } catch (e3) {
                            console.log("기존 질문 조회 실패:", e3.message);
                          }
                        } finally {
                          setIsLoadingQuestions(false);
                        }
                      }
                      setRecordModalVisible(false);
                    }}
                  >
                    <Text style={styles.recordItemText} numberOfLines={2}>
                      {item.content}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 시간 설정 모달 */}
      <Modal visible={isTimeModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>시간 설정</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="분 단위로 입력 (예: 25)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              value={inputMinutes}
              onChangeText={setInputMinutes}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setTimeModalVisible(false)}>
                <Text style={styles.modalCancel}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSetTime}>
                <Text style={styles.modalConfirm}>확인</Text>
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
    alignItems: "center",
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
    color: colors.primary,
  },
  questionBox: {
    borderRadius: 999,
    paddingVertical: spacing.xl,
    paddingHorizontal: 45,
    marginBottom: spacing.md,
    width: "100%",
    alignItems: "center",
    ...preset.card,
    borderColor: colors.primary,
    borderWidth: 1.5,
    //height: 120, // 고정 높이
    justifyContent: "center",
  },
  questionText: {
    ...typography.body,
    color: colors.primary,
    textAlign: "center",
  },
  timerContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  timeTextContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  timeText: {
    fontSize: 52,
    fontFamily: "Pretendard-Bold",
    color: colors.primary,
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
    ...preset.card,
    backgroundColor: colors.primary,
    borderWidth: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: spacing.lg,
    width: "80%",
  },
  modalTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: 20,
    textAlign: "center",
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
  selectBox: {
    borderRadius: 999,
    paddingVertical: spacing.xl,
    paddingHorizontal: 45,
    marginBottom: spacing.md,
    width: "100%",
    alignItems: "center",
    borderColor: colors.border,
    borderWidth: 1.5,
    borderStyle: "dashed",
    //height: 120, // 고정 높이
    justifyContent: "center",
  },
  selectText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  recordItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 16,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
    marginHorizontal: 14,
  },
  recordItemSelected: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: "#FFF9E6",
  },
  recordItemText: {
    ...typography.body,
    color: colors.textPrimary,
  },
});
