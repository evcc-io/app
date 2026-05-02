import { Animated } from "react-native";
import { Text } from "@ui-kitten/components";
import { useState, useRef, useImperativeHandle, RefObject } from "react";

interface ShakyTextProps {
  text: string;
  ref: RefObject<ShakyTextHandle | null>;
}

export interface ShakyTextHandle {
  shake: () => void;
}

export default function ShakyText({ text, ref }: ShakyTextProps) {
  const [textStatus, setTextStatus] = useState("warning");
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useImperativeHandle(ref, () => ({
    shake() {
      setTextStatus("danger");
      startShake();
    },
  }));

  const startShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={{
        transform: [{ translateX: shakeAnim }],
      }}
    >
      <Text style={{ marginBottom: 32 }} status={textStatus} testID="shakyText">
        {text}
      </Text>
    </Animated.View>
  );
}
