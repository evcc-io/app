import SwiftUI
import WidgetKit

struct LoadpointView: View {
  var entry: LoadpointEntry
  @Environment(\.colorScheme) var scheme

  var body: some View {
    content
      .containerBackground(for: .widget) { background }
      .widgetURL(deepLink)
  }

  private var background: Color {
    if case .notConfigured = entry.state { return Color.evccDarkGreen }
    return scheme == .dark ? Color.widgetCardDark : .white
  }

  private var deepLink: URL? {
    if case .notConfigured = entry.state { return URL(string: "evcc://server") }
    var c = URLComponents()
    c.scheme = "evcc"
    c.host = "loadpoint"
    var items = [URLQueryItem(name: "lp", value: String(entry.lp))]
    if let id = entry.serverId { items.insert(URLQueryItem(name: "server", value: id), at: 0) }
    c.queryItems = items
    return c.url
  }

  @ViewBuilder private var content: some View {
    switch entry.state {
    case .notConfigured:
      NotConfiguredView()
    case .noData:
      MessageView(headerTitle: L.t("widget.loadpoint.name"), accent: Color.evccDarkerGreen,
                  symbol: "bolt.slash", title: L.t("widget.noData.title"), message: L.t("widget.noData.body"))
    case .unreachable:
      MessageView(headerTitle: L.t("widget.loadpoint.name"), accent: Color.evccDarkerGreen,
                  symbol: "wifi.slash", title: L.t("widget.unreachable.title"), message: L.t("widget.unreachable.body"))
    case .loadpoint(let vm):
      LoadpointCard(vm: vm, serverId: entry.serverId ?? "", lp: entry.lp)
    }
  }
}

struct LoadpointCard: View {
  let vm: LoadpointVM
  let serverId: String
  let lp: Int
  @Environment(\.colorScheme) var scheme
  @Environment(\.widgetFamily) var family

  private var connected: Bool { vm.status != .disconnected }

  // status dot + text: gray unless active; green matches the solar headline
  // (darker in light mode for contrast), orange for heating.
  private var statusColor: Color {
    guard vm.status.active else { return .bsGrayMedium }
    return vm.heating ? .evccOrange : (scheme == .dark ? .evccDarkGreen : .evccDarkerGreen)
  }

  // progress bar keeps the brighter energy color + a darker stripe
  private var barColor: Color { vm.heating ? .evccOrange : .evccDarkGreen }
  private var barStripe: Color { vm.heating ? .orangeStripe : .evccDarkerGreen }

  var body: some View {
    if family == .systemMedium {
      HStack(alignment: .top, spacing: 14) {
        left
        modeSelector.frame(width: 116)
      }
    } else {
      left
    }
  }

  private var left: some View {
    VStack(alignment: .leading, spacing: 0) {
      HStack(alignment: .firstTextBaseline, spacing: 4) {
        Text(vm.title)
          .font(.system(size: 14, weight: .bold))
          .lineLimit(1).minimumScaleFactor(0.7)
        Spacer(minLength: 4)
        Button(intent: ReloadIntent()) {
          Image(systemName: "arrow.clockwise")
            .font(.system(size: 11, weight: .bold))
            .foregroundStyle(.secondary)
        }
        .buttonStyle(.plain)
      }
      HStack(spacing: 5) {
        Circle().fill(statusColor).frame(width: 7, height: 7)
        Text(L.t(vm.statusKey))
          .font(.system(size: 10, weight: .semibold))
          .foregroundColor(statusColor).lineLimit(1)
      }
      .padding(.top, 3)

      Spacer(minLength: 6)

      (Text(vm.metricValue).font(.system(size: 30, weight: .bold))
        + Text(" \(vm.metricUnit)").font(.system(size: 14, weight: .bold)).foregroundColor(.secondary))
        .lineLimit(1).minimumScaleFactor(0.6)
      if let fill = vm.fill {
        ProgressBar(fill: fill, color: connected ? barColor : .bsGrayMedium,
                    striped: vm.status.active, stripe: barStripe, scheme: scheme)
          .padding(.top, 6)
      }

      Spacer(minLength: 6)

      HStack {
        (Text(vm.power.value).font(.system(size: 15, weight: .bold))
          + Text(" \(vm.power.unit)").font(.system(size: 11, weight: .bold)).foregroundColor(.secondary))
        Spacer(minLength: 4)
        // mode shown here only in square; the wide variant has the mode selector
        if family != .systemMedium, let m = vm.currentMode {
          Text(L.t(m.labelKey)).font(.system(size: 11, weight: .semibold)).foregroundStyle(.secondary)
        }
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
  }

  private var modeSelector: some View {
    VStack(spacing: 6) {
      ForEach(vm.modes, id: \.self) { mode in
        let selected = mode == vm.currentMode
        Button(intent: SetModeIntent(serverId: serverId, lp: lp, mode: mode.rawValue)) {
          Text(L.t(mode.labelKey))
            .font(.system(size: 12, weight: .bold))
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .foregroundColor(selected ? (scheme == .dark ? .black : .white)
                                      : (scheme == .dark ? Color.modeTextDark : Color.modeTextLight))
            .background(selected ? AnyShapeStyle(.primary)
                                 : AnyShapeStyle((scheme == .dark ? Color.modeBgDark : Color.modeBgLight)),
                        in: RoundedRectangle(cornerRadius: 9, style: .continuous))
        }
        .buttonStyle(.plain)
      }
    }
    .frame(maxHeight: .infinity)
  }
}

struct ProgressBar: View {
  let fill: Double
  let color: Color
  let striped: Bool
  let stripe: Color
  let scheme: ColorScheme

  var body: some View {
    GeometryReader { geo in
      ZStack(alignment: .leading) {
        Capsule().fill(scheme == .dark ? Color.bsGrayDeep : Color.progressTrackLight)
        fillView
          .frame(width: max(0, min(1, fill)) * geo.size.width)
          .clipShape(Capsule())
      }
    }
    .frame(height: 6)
  }

  @ViewBuilder private var fillView: some View {
    if striped {
      Canvas { ctx, size in
        ctx.fill(Path(CGRect(origin: .zero, size: size)), with: .color(color))
        let band: CGFloat = 5
        var x = -size.height
        while x < size.width {
          var p = Path()
          p.move(to: CGPoint(x: x, y: size.height))
          p.addLine(to: CGPoint(x: x + size.height, y: 0))
          p.addLine(to: CGPoint(x: x + size.height + band, y: 0))
          p.addLine(to: CGPoint(x: x + band, y: size.height))
          p.closeSubpath()
          ctx.fill(p, with: .color(stripe))
          x += band * 2
        }
      }
    } else {
      Rectangle().fill(color)
    }
  }
}
