import { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import IconSearch from "@material-symbols/svg-400/rounded/search.svg";
import StatusCircle from "components/StatusCircle";
import { useThemeColors } from "utils/theme";
import { testingEnvironment } from "helper/launchArguments";

const RING_COUNT = 3;
const RING_DURATION = 1800;

function PulseRing({ delay, color }: { delay: number; color: string }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (testingEnvironment()) {
      progress.setValue(0.5);
      return;
    }
    const animation = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: RING_DURATION,
        delay,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [progress, delay]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        width: 240,
        height: 240,
        borderRadius: 120,
        borderWidth: 2,
        borderColor: color,
        opacity: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.9, 0],
        }),
        transform: [
          {
            scale: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.55, 1.5],
            }),
          },
        ],
      }}
    />
  );
}

// branded searching animation: pulsing radar rings around the tinted circle
export default function SearchPulse() {
  const colors = useThemeColors();
  return (
    <View
      style={{
        width: 240,
        height: 240,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {Array.from({ length: RING_COUNT }, (_, i) => (
        <PulseRing
          key={i}
          delay={(i * RING_DURATION) / RING_COUNT}
          color={colors.primary}
        />
      ))}
      <StatusCircle color={colors.primaryTint} style={{ marginBottom: 0 }}>
        <IconSearch width={60} height={60} fill={colors.onPrimaryTint} />
      </StatusCircle>
    </View>
  );
}
