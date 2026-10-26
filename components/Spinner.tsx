import { useEffect } from "react";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useThemeColors } from "utils/theme";
import { testingEnvironment } from "helper/launchArguments";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 48;
const EASE = Easing.bezierFn(0.42, 0, 0.58, 1);
// dash cycle: 1.5s in three keyframes (grow, travel, hold), rotation 2s linear
const GROW = 712;
const HOLD = 76;
const CYCLE = 2 * GROW + HOLD;

// "ring-resize" by Utkarsh Verma (svg-spinners, MIT): arc grows while
// traveling around a ring. Static under Detox so the idle-sync doesn't hang.
export default function Spinner() {
  const colors = useThemeColors();
  const time = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (testingEnvironment()) return;
    // one clock for dash and offset: separate loops drift apart, since
    // every step starts on the next frame and loses the overshoot
    time.value = withRepeat(
      withTiming(CYCLE, { duration: CYCLE, easing: Easing.linear }),
      -1,
    );
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
    );
  }, [time, rotation]);

  const animatedProps = useAnimatedProps(() => {
    const grow = EASE(Math.min(time.value / GROW, 1));
    const travel = EASE(Math.min(Math.max(time.value / GROW - 1, 0), 1));
    return {
      strokeDasharray: [42 * grow, 150],
      strokeDashoffset: -16 * grow - 43 * travel,
    };
  });

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
