import { LaunchArguments } from "react-native-launch-arguments";

interface LaunchArgs {
  hostIp?: string;
  disableAnimations?: boolean;
}

export function disableAnimations(): boolean {
  return !!LaunchArguments.value<LaunchArgs>().disableAnimations;
}

export function getHostIp(): string {
  return LaunchArguments.value<LaunchArgs>().hostIp || "localhost";
}
