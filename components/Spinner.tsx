import { useEffect } from "react";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useThemeColors } from "utils/theme";
import { testingEnvironment } from "helper/launchArguments";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 64;
const DURATION = 1800;
const RADIUS_EASING = Easing.bezier(0.165, 0.84, 0.44, 1);
const OPACITY_EASING = Easing.bezier(0.3, 0.61, 0.355, 1);

function PuffCircle({ delay, color }: { delay: number; color: string }) {
  const radius = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    radius.value = withDelay(
      delay,
      withRepeat(
        withTiming(20, { duration: DURATION, easing: RADIUS_EASING }),
        -1,
      ),
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0, { duration: DURATION, easing: OPACITY_EASING }),
        -1,
      ),
    );
  }, [radius, opacity, delay]);

  const animatedProps = useAnimatedProps(() => ({
    r: radius.value,
    strokeOpacity: opacity.value,
  }));

  return (
    <AnimatedCircle
      cx={22}
      cy={22}
      fill="none"
      stroke={color}
      strokeWidth={2}
      animatedProps={animatedProps}
    />
  );
}

// "puff" loader by Sam Herbert (SVG-Loaders, MIT): two expanding, fading
// rings. Static under Detox so the idle-sync doesn't hang.
export default function Spinner() {
  const colors = useThemeColors();

  if (testingEnvironment()) {
    return (
      <Svg width={SIZE} height={SIZE} viewBox="0 0 44 44">
        <Circle
          cx={22}
          cy={22}
          r={10}
          fill="none"
          stroke={colors.primary}
          strokeWidth={2}
          strokeOpacity={0.5}
        />
      </Svg>
    );
  }

  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 44 44">
      <PuffCircle delay={0} color={colors.primary} />
      <PuffCircle delay={DURATION / 2} color={colors.primary} />
    </Svg>
  );
}
