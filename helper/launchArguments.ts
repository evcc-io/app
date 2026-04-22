import { LaunchArguments } from "react-native-launch-arguments";

interface LaunchArgs {
  disableAnimations?: boolean;
  testLegacyServerConfig?: boolean;
}

export function disableAnimations(): boolean {
  return !!LaunchArguments.value<LaunchArgs>().disableAnimations;
}

export function testLegacyServerConfig(): boolean {
  return !!LaunchArguments.value<LaunchArgs>().testLegacyServerConfig;
}
