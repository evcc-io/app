import { LaunchArguments } from "react-native-launch-arguments";

interface LaunchArgs {
  disableAnimations?: boolean;
}

export function disableAnimations(): boolean {
  return !!LaunchArguments.value<LaunchArgs>().disableAnimations;
}
