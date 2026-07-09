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
  let charging: Bool?
  let connected: Bool?
  let enabled: Bool?
  let chargerFeatureHeating: Bool?
  let chargerFeatureSwitchDevice: Bool?
  let ui: LoadpointUI?
}

// MARK: - Modes / status

enum ChargeMode: String, CaseIterable {
  case off, pv, minpv, now
  var labelKey: String { "widget.mode.\(rawValue)" }
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
  let currentMode: ChargeMode?
  let modes: [ChargeMode]

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
    let modes: [ChargeMode] = switchDevice ? [.off, .pv, .now] : [.off, .pv, .minpv, .now]

    return LoadpointVM(
      title: title,
      status: status,
      statusKey: status.labelKey(heating: heating),
      heating: heating,
      metricValue: metricValue,
      metricUnit: metricUnit,
      fill: fill,
      power: splitValueUnit(Format.fmtW(lp.chargePower ?? 0, .auto)),
      currentMode: ChargeMode(rawValue: lp.mode ?? ""),
      modes: modes)
  }
}

private func clamp01(_ v: Double) -> Double { min(1, max(0, v)) }
