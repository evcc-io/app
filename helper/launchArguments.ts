import { LaunchArguments } from "react-native-launch-arguments";

interface LaunchArgs {
  disableAnimations?: boolean;
  migrateFromLegacySingleConnectionStorage?: boolean;
}

export function disableAnimations(): boolean {
  return !!LaunchArguments.value<LaunchArgs>().disableAnimations;
}

export function migrateFromLegacySingleConnectionStorage(): boolean {
  return !!LaunchArguments.value<LaunchArgs>()
    .migrateFromLegacySingleConnectionStorage;
}
