import SwiftUI

/// Site energy flow: production, consumption, grid, battery.
struct OverviewPage: View {
  @ObservedObject var model: SiteModel

  var body: some View {
    Group {
      if let s = model.state {
        ScrollView {
          VStack(spacing: 6) {
            FlowRow(symbol: "sun.max.fill", color: .evccDarkGreen,
                    label: L.t("watch.flow.pv"), watts: s.pvPower ?? 0)
            FlowRow(symbol: "house.fill", color: .bsGrayMedium,
                    label: L.t("watch.flow.home"), watts: s.homePower ?? 0)
            gridRow(s.gridPower ?? 0)
            if let soc = s.batterySoc {
              batteryRow(soc: soc, watts: s.batteryPower ?? 0)
            }
            StaleFooter(model: model)
          }
        }
        .opacity(model.unreachable ? 0.5 : 1)
      } else if model.unreachable {
        MessagePage(symbol: "wifi.slash", title: L.t("widget.unreachable.title"),
                    message: L.t("widget.unreachable.body"), detail: model.errorDetail)
      } else {
        ProgressView()
      }
    }
    .containerBackground(Color.evccDarkGreen.gradient.opacity(0.25), for: .tabView)
  }

  // evcc: positive grid power = import, positive battery power = discharge.
  private func gridRow(_ watts: Double) -> some View {
    let export = watts < 0
    return FlowRow(symbol: export ? "arrow.up.right" : "arrow.down.left",
                   color: export ? .evccYellow : .bsGrayMedium,
                   label: L.t(export ? "watch.flow.gridExport" : "watch.flow.gridImport"),
                   watts: abs(watts))
  }

  private func batteryRow(soc: Double, watts: Double) -> some View {
    let label: String
    if watts > 50 { label = L.t("watch.flow.batteryDischarge") }
    else if watts < -50 { label = L.t("watch.flow.batteryCharge") }
    else { label = L.t("watch.flow.battery") }
    return FlowRow(symbol: batterySymbol(soc), color: .evccDarkGreen, label: label,
                   watts: abs(watts), detail: "\(Format.fmtNumber(soc, 0)) %")
  }

  private func batterySymbol(_ soc: Double) -> String {
    switch soc {
    case ..<13: return "battery.0percent"
    case ..<38: return "battery.25percent"
    case ..<63: return "battery.50percent"
    case ..<88: return "battery.75percent"
    default: return "battery.100percent"
    }
  }
}

struct FlowRow: View {
  let symbol: String
  let color: Color
  let label: String
  let watts: Double
  var detail: String? = nil

  var body: some View {
    HStack(spacing: 8) {
      Image(systemName: symbol)
        .foregroundStyle(color)
        .frame(width: 22)
      VStack(alignment: .leading, spacing: 0) {
        Text(label)
          .font(.footnote)
          .foregroundStyle(.secondary)
          .lineLimit(1)
        HStack(alignment: .firstTextBaseline, spacing: 4) {
          Text(Format.fmtW(watts, .auto))
            .font(.system(.body, design: .rounded).weight(.semibold))
            .monospacedDigit()
          if let detail {
            Text(detail).font(.footnote).foregroundStyle(.secondary)
          }
        }
      }
      Spacer(minLength: 0)
    }
    .accessibilityElement(children: .combine)
  }
}

/// One loadpoint: vehicle, charge progress, power and mode switch.
struct LoadpointPage: View {
  @ObservedObject var model: SiteModel
  let server: StoredServer
  let index: Int
  let loadpoint: Loadpoint

  private var vm: LoadpointVM { LoadpointVM.build(from: loadpoint) }
  private var currentMode: String? { model.pendingModes[index] ?? vm.currentMode?.rawValue }

  private var accent: Color { vm.heating ? .evccOrange : .evccDarkGreen }

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 6) {
        Text(vm.title.isEmpty ? L.t("widget.loadpoint.name") : vm.title)
          .font(.headline)
          .lineLimit(1)
        HStack(spacing: 4) {
          Circle()
            .fill(vm.status.active ? accent : Color.bsGrayMedium)
            .frame(width: 6, height: 6)
          Text(L.t(vm.statusKey))
            .font(.footnote)
            .foregroundStyle(.secondary)
            .lineLimit(1)
        }
        HStack(alignment: .firstTextBaseline, spacing: 2) {
          Text(vm.metricValue)
            .font(.system(size: 34, weight: .semibold, design: .rounded))
            .monospacedDigit()
          Text(vm.metricUnit).font(.footnote).foregroundStyle(.secondary)
          Spacer()
          if vm.status.active {
            Text("\(vm.power.value) \(vm.power.unit)")
              .font(.footnote.weight(.semibold))
              .foregroundStyle(accent)
              .monospacedDigit()
          }
        }
        if let fill = vm.fill {
          ProgressView(value: fill).tint(accent)
        }
        modeGrid
        StaleFooter(model: model)
      }
    }
    .opacity(model.unreachable ? 0.5 : 1)
    .containerBackground(accent.gradient.opacity(0.25), for: .tabView)
  }

  private var modeGrid: some View {
    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 4) {
      ForEach(vm.modes, id: \.rawValue) { mode in
        let selected = mode.rawValue == currentMode
        Button {
          Task { await model.setMode(server, lp: index, mode: mode.rawValue) }
        } label: {
          Text(L.t(mode.labelKey))
            .font(.footnote.weight(.semibold))
            .lineLimit(1)
            .minimumScaleFactor(0.7)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 7)
            .foregroundStyle(selected ? Color.onGreen : Color.primary)
            .background(selected ? accent : Color.white.opacity(0.15), in: Capsule())
        }
        .buttonStyle(.plain)
        .disabled(model.unreachable)
        .accessibilityAddTraits(selected ? .isSelected : [])
      }
    }
    .padding(.top, 4)
  }
}

struct StaleFooter: View {
  @ObservedObject var model: SiteModel

  var body: some View {
    if model.unreachable, let at = model.lastUpdate {
      Label {
        VStack(alignment: .leading) {
          Text(at, style: .relative)
          if let detail = model.errorDetail {
            Text(detail).font(.caption2).foregroundStyle(.tertiary)
          }
        }
      } icon: {
        Image(systemName: "wifi.slash")
      }
      .font(.footnote)
      .foregroundStyle(.secondary)
      .frame(maxWidth: .infinity, alignment: .leading)
      .padding(.top, 4)
    }
  }
}

struct MessagePage: View {
  let symbol: String
  let title: String
  let message: String
  var detail: String? = nil

  var body: some View {
    ScrollView {
      VStack(spacing: 6) {
        Image(systemName: symbol).font(.title2).foregroundStyle(.secondary)
        Text(title).font(.headline).multilineTextAlignment(.center)
        Text(message).font(.footnote).foregroundStyle(.secondary).multilineTextAlignment(.center)
        if let detail {
          Text(detail).font(.caption2).foregroundStyle(.tertiary).multilineTextAlignment(.center)
        }
      }
    }
  }
}
