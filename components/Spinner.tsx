import { useEffect } from "react";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useThemeColors } from "utils/theme";
import { testingEnvironment } from "helper/launchArguments";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 48;
const EASING = Easing.bezier(0.42, 0, 0.58, 1);
// dash cycle: 1.5s in three keyframes (grow, travel, hold), rotation 2s linear
const GROW = 712;
const HOLD = 76;

// "ring-resize" by Utkarsh Verma (svg-spinners, MIT): arc grows while
// traveling around a ring. Static under Detox so the idle-sync doesn't hang.
export default function Spinner() {
  const colors = useThemeColors();
  const dash = useSharedValue(0);
  const offset = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (testingEnvironment()) return;
    dash.value = withRepeat(
      withSequence(
        withTiming(42, { duration: GROW, easing: EASING }),
        withTiming(42, { duration: GROW + HOLD }),
      ),
      -1,
    );
    offset.value = withRepeat(
      withSequence(
        withTiming(-16, { duration: GROW, easing: EASING }),
        withTiming(-59, { duration: GROW, easing: EASING }),
        withTiming(-59, { duration: HOLD }),
      ),
      -1,
    );
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
    );
  }, [dash, offset, rotation]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDasharray: [dash.value, 150],
    strokeDashoffset: offset.value,
  }));

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  if (testingEnvironment()) {
    return (
      <Svg width={SIZE} height={SIZE} viewBox="0 0 24 24">
        <Circle
          cx={12}
          cy={12}
          r={9.5}
          fill="none"
          stroke={colors.primary}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray={[42, 150]}
          strokeDashoffset={-16}
        />
      </Svg>
    );
  }

  return (
    <Animated.View style={rotationStyle}>
      <Svg width={SIZE} height={SIZE} viewBox="0 0 24 24">
        <AnimatedCircle
          cx={12}
          cy={12}
          r={9.5}
          fill="none"
          stroke={colors.primary}
          strokeWidth={2.5}
          strokeLinecap="round"
          animatedProps={animatedProps}
        />
      </Svg>
    </Animated.View>
  );
}
