import ExpoModulesCore

public class IosAppOnMacModule: Module {
  public func definition() -> ModuleDefinition {
    Name("IosAppOnMac")
    Constant("isIosAppOnMac") { ProcessInfo.processInfo.isiOSAppOnMac }
  }
}
