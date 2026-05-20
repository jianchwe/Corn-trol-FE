import { useState, useMemo, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { colors, typography, spacing, preset } from "../theme";
import { Microphone, Pencil } from "phosphor-react-native";

import TextMemoModal from "../components/TextMemoModal";
import VoiceMemoModal from "../components/VoiceMemoModal";

import { CaretLeft, CaretRight } from "phosphor-react-native";
import PopCorn1 from "../../assets/PopCorn_1.svg";
import PopCorn2 from "../../assets/PopCorn_2.svg";
import PopCornBox from "../../assets/PopCornBox.svg";

import { useUser } from "../context/UserContext";
import { useRecord } from "../context/RecordContext";
import { getRecords } from "../api/records";

const POPCORN_POSITIONS = [
  { x: -100, y: 0, rotation: -10 }, // 하단1
  { x: -40, y: -10, rotation: 5 }, // 하단2
  { x: 40, y: -5, rotation: 15 }, // 하단3
  { x: 100, y: 0, rotation: 15 }, // 하단4
  { x: -80, y: 60, rotation: 10 }, // 중단1
  { x: -10, y: 50, rotation: 50 }, // 중단2
  { x: 70, y: 55, rotation: -5 }, // 중단3
  { x: -35, y: 115, rotation: -35 }, // 상단1
  { x: 35, y: 110, rotation: 50 }, // 상단2
];

export default function PopcornScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [textModalVisible, setTextModalVisible] = useState(false);
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);

  const { nickname } = useUser();
  const { lastUpdated, lastSaved } = useRecord();
  const [apiRecordCount, setApiRecordCount] = useState(null);

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}.${m}.${d}`;
  };

  useFocusEffect(
    useCallback(() => {
      const fetchCount = async () => {
        try {
          const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
          const data = await getRecords(0, 100, dateStr);
          setApiRecordCount(data.totalElements);
        } catch (e) {
          setApiRecordCount(null);
        }
      };
      fetchCount();
    }, [currentDate, lastUpdated, lastSaved]),
  );

  const todayCount = apiRecordCount !== null ? apiRecordCount : 0;

  const popcornPieces = useMemo(
    () =>
      Array.from({ length: Math.min(todayCount, 9) }, (_, i) => ({
        id: i,
        isType1: i % 2 === 0,
        ...POPCORN_POSITIONS[i],
      })),
    [todayCount],
  );

  const goToPrevDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    setCurrentDate(prev);
  };

  const goToNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        {/* 닉네임 배너 */}
        <View style={styles.nicknameBanner}>
          <Text style={styles.nicknameText}>{nickname}의 팝콘통</Text>
        </View>

        {/* 날짜 네비게이터 */}
        <View style={styles.dateRow}>
          <TouchableOpacity onPress={goToPrevDay}>
            <CaretLeft size={20} color={colors.textSecondary} weight="bold" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setDatePickerVisible(true)}>
            <Text style={styles.date}>{formatDate(currentDate)}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={goToNextDay}>
            <CaretRight size={20} color={colors.textSecondary} weight="bold" />
          </TouchableOpacity>
        </View>

        {/* 달력 모달 */}
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

        <View style={styles.cardShadow}>
          <View style={styles.card}>
            {/* 팝콘알 쌓기 */}
            {popcornPieces.map((piece) => {
              const Popcorn = piece.isType1 ? PopCorn1 : PopCorn2;
              return (
                <View
                  key={piece.id}
                  style={{
                    position: "absolute",
                    bottom: 80 + piece.y,
                    alignSelf: "center",
                    transform: [
                      { translateX: piece.x },
                      { rotate: `${piece.rotation}deg` },
                    ],
                  }}
                >
                  <Popcorn width={100} height={100} />
                </View>
              );
            })}

            {/* 팝콘 통 */}
            <PopCornBox
              width="130%"
              height={320}
              style={{ position: "absolute", bottom: -50 }}
            />
          </View>
        </View>

        {/* 버튼 영역 */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => setVoiceModalVisible(true)}
        >
          <View style={styles.iconCircle}>
            <Microphone size={40} color={colors.primary} />
          </View>
          <Text
            style={styles.buttonText}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            당신의 생각을 녹음으로 기록해요!
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => setTextModalVisible(true)}
        >
          <View style={styles.iconCircle}>
            <Pencil size={40} color={colors.primary} />
          </View>
          <Text
            style={styles.buttonText}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            당신의 생각을 텍스트로 기록해요!
          </Text>
        </TouchableOpacity>

        {/* 텍스트 모달 */}
        <TextMemoModal
          visible={textModalVisible}
          onClose={() => setTextModalVisible(false)}
          onSave={() => {}}
        />

        {/* 음성 모달 */}
        <VoiceMemoModal
          visible={voiceModalVisible}
          onClose={() => setVoiceModalVisible(false)}
          onSave={() => {}}
        />
      </View>
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
  nicknameBanner: {
    backgroundColor: "#FFF9E6",
    borderRadius: 99,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignSelf: "center",
    marginBottom: 20,
  },
  nicknameText: {
    ...typography.h1,
    color: colors.primary,
    textAlign: "center",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    gap: 40,
  },
  date: {
    ...typography.h2,
    color: colors.textPrimary,
    width: 130,
    textAlign: "center",
  },
  cardShadow: {
    borderRadius: 16,
    marginBottom: spacing.lg,
    ...preset.card,
  },
  card: {
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    height: 320,
    overflow: "hidden",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    ...preset.card,
    borderWidth: 0,
    backgroundColor: colors.primary,
    borderRadius: 50,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    ...preset.card,
    borderWidth: 0,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 18,
    fontFamily: "Pretendard-SemiBold",
    color: "#FFFFFF",
    flex: 1,
  },
});
