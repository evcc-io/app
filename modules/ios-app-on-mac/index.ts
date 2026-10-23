import { requireOptionalNativeModule } from "expo";

// True when the iPad build runs on macOS ("Designed for iPad").
export const isIosAppOnMac: boolean =
  requireOptionalNativeModule<{ isIosAppOnMac: boolean }>("IosAppOnMac")
    ?.isIosAppOnMac ?? false;
