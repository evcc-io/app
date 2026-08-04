import Foundation

// MARK: - API decodable (subset of /api/state .loadpoints[])

struct LoadpointUI: Decodable {
  let minTemp: Double?
  let maxTemp: Double?
}

struct Loadpoint: Decodable {
  let title: String?
  let vehicleTitle: String?
  let vehicleSoc: Double?
  let effectiveLimitSoc: Double?
  let chargePower: Double?
  let sessionEnergy: Double?
  let chargedEnergy: Double?
  let mode: String?
  let alwaysCharge: String?
  let charging: Bool?
  let connected: Bool?
  let enabled: Bool?
  let chargerFeatureHeating: Bool?
  let chargerFeatureSwitchDevice: Bool?
  let chargerFeatureContinuous: Bool?
  let ui: LoadpointUI?
}

// MARK: - Modes / status

enum ChargeMode: String {
  case off, pv, minpv, now, smart
}

// A selectable mode with its device-class-specific label.
struct ModeItem: Hashable {
  let rawValue: String
  let labelKey: String
}

enum LoadpointStatus: String {
  case disconnected, connected, waitForVehicle, finished, charging, heating
  var active: Bool { self == .charging || self == .heating }  // colored status dot

  // heating devices use evcc's heatingStatus.* wording; others vehicleStatus.*.
  func labelKey(heating: Bool) -> String {
    switch self {
    case .heating: return "widget.lpheat.charging"
    case .connected: return heating ? "widget.lpheat.connected" : "widget.lpstatus.connected"
    case .waitForVehicle: return heating ? "widget.lpheat.waitForVehicle" : "widget.lpstatus.waitForVehicle"
    default: return "widget.lpstatus.\(rawValue)"  // disconnected / finished / charging
    }
  }
}

// MARK: - View model

struct LoadpointVM {
  let title: String
  let status: LoadpointStatus
  let statusKey: String
  let heating: Bool
  let metricValue: String
  let metricUnit: String
  let fill: Double?  // 0…1 progress; nil = no bar (kWh-only)
  let power: (value: String, unit: String)
  let currentMode: ModeItem?
  let modes: [ModeItem]
  let alwaysChargeActive: Bool

  static func build(from lp: Loadpoint) -> LoadpointVM {
    let heating = lp.chargerFeatureHeating == true
    let connected = lp.connected == true
    let charging = lp.charging == true
    let enabled = lp.enabled == true
    let soc = lp.vehicleSoc ?? 0
    let limit = lp.effectiveLimitSoc ?? 0

    let status: LoadpointStatus
    if !connected {
      status = .disconnected
    } else if charging {
      status = heating ? .heating : .charging
    } else if enabled {
      status = (limit > 0 && soc >= limit) ? .finished : .waitForVehicle
    } else {
      status = .connected
    }

    let vt = lp.vehicleTitle?.trimmingCharacters(in: .whitespaces) ?? ""
    let title = vt.isEmpty ? (lp.title ?? "") : vt

    let metricValue: String
    let metricUnit: String
    let fill: Double?
    if heating {
      metricValue = Format.fmtNumber(soc, 1)
      metricUnit = "°C"
      let minT = lp.ui?.minTemp ?? 0
      let maxT = lp.ui?.maxTemp ?? 100
      fill = maxT > minT ? clamp01((soc - minT) / (maxT - minT)) : nil
    } else if soc > 0 {
      metricValue = Format.fmtNumber(soc, 0)
      metricUnit = "%"
      fill = clamp01(soc / 100)
    } else {
      let kWh = (lp.chargedEnergy ?? lp.sessionEnergy ?? 0) / 1000
      metricValue = Format.fmtNumber(kWh, 1)
      metricUnit = "kWh"
      fill = nil
    }

    let switchDevice = lp.chargerFeatureSwitchDevice == true
    let continuous = lp.chargerFeatureContinuous == true
    // alwaysCharge exists since the smart-mode redesign; its presence tells
    // new servers (off/smart/now) from old ones (off/pv/minpv/now).
    let smartModeServer = lp.alwaysCharge != nil

    func item(_ mode: ChargeMode) -> ModeItem {
      var key = "widget.mode.\(mode.rawValue)"
      if smartModeServer {
        if mode == .off, continuous { key = "widget.mode.normal" }
        if mode == .now {
          if continuous { key = "widget.mode.boost" } else if switchDevice { key = "widget.mode.on" }
        }
      }
      return ModeItem(rawValue: mode.rawValue, labelKey: key)
    }

    let modeList: [ChargeMode] =
      smartModeServer
      ? [.off, .smart, .now]
      : switchDevice ? [.off, .pv, .now] : [.off, .pv, .minpv, .now]

    return LoadpointVM(
      title: title,
      status: status,
      statusKey: status.labelKey(heating: heating),
      heating: heating,
      metricValue: metricValue,
      metricUnit: metricUnit,
      fill: fill,
      power: splitValueUnit(Format.fmtW(lp.chargePower ?? 0, .auto)),
      currentMode: ChargeMode(rawValue: lp.mode ?? "").map(item),
      modes: modeList.map(item),
      alwaysChargeActive: lp.alwaysCharge == "on" || lp.alwaysCharge == "once")
  }
}

private func clamp01(_ v: Double) -> Double { min(1, max(0, v)) }
