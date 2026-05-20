import { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
  Alert,
} from "react-native";
import { colors, typography, spacing, preset } from "../theme";
import { Trash } from "phosphor-react-native";

export default function RecordCard({ content, date, onDelete, onEdit }) {
  const pan = useRef(new Animated.Value(0)).current;
  const longPressTimer = useRef(null);
  const onEditRef = useRef(onEdit);

  useEffect(() => {
    onEditRef.current = onEdit;
  }, [onEdit]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        longPressTimer.current = setTimeout(() => {
          Alert.alert("", "이 기록을 어떻게 할까요?", [
            {
              text: "수정",
              onPress: () => onEditRef.current && onEditRef.current(),
            },
            {
              text: "삭제",
              onPress: () => handleDelete(),
              style: "destructive",
            },
            { text: "취소", style: "cancel" },
          ]);
        }, 500);
      },
      onPanResponderMove: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > 10) {
          clearTimeout(longPressTimer.current);
        }
        if (gestureState.dx < 0) {
          pan.setValue(Math.max(gestureState.dx, -62));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        clearTimeout(longPressTimer.current);
        if (gestureState.dx < -50) {
          Animated.spring(pan, {
            toValue: -62,
            useNativeDriver: true,
          }).start();
        } else {
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  const handleDelete = () => {
    Animated.timing(pan, {
      toValue: -400,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onDelete && onDelete());
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Trash size={22} color="#FFFFFF" weight="fill" />
      </TouchableOpacity>

      <Animated.View
        style={[styles.card, { transform: [{ translateX: pan }] }]}
        {...panResponder.panHandlers}
      >
        {date && <Text style={styles.date}>{date}</Text>}
        <Text style={styles.content}>{content}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    marginBottom: spacing.sm,
  },
  deleteButton: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 55,
    backgroundColor: "#FF5252",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    ...preset.card,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
  },
  date: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  content: {
    ...typography.body,
    color: colors.textPrimary,
  },
});
