import { LaunchArguments } from "react-native-launch-arguments";

interface LaunchArgs {
  testingEnvironment?: boolean;
  testLegacyServerConfig?: boolean;
  testIndexedServerConfig?: boolean;
}

export function testingEnvironment(): boolean {
  return !!LaunchArguments.value<LaunchArgs>().testingEnvironment;
}

export function testLegacyServerConfig(): boolean {
  return !!LaunchArguments.value<LaunchArgs>().testLegacyServerConfig;
}

export function testIndexedServerConfig(): boolean {
  return !!LaunchArguments.value<LaunchArgs>().testIndexedServerConfig;
}
