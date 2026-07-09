import Charts
import SwiftUI
import WidgetKit

// MARK: - Root

struct ForecastWidgetView: View {
  var entry: ForecastEntry
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
    c.host = "forecast"
    if let id = entry.serverId {
      c.queryItems = [URLQueryItem(name: "server", value: id)]
    }
    return c.url
  }

  @ViewBuilder private var content: some View {
    switch entry.state {
    case .notConfigured:
      NotConfiguredView()
    case .noData(let type):
      MessageView(headerTitle: type.label, accent: Palette.make(type, scheme).headline,
                  symbol: "icloud.slash",
                  title: L.t("widget.noData.title"), message: L.t("widget.noData.body"))
    case .unreachable(let type):
      MessageView(headerTitle: type.label, accent: Palette.make(type, scheme).headline,
                  symbol: "wifi.slash",
                  title: L.t("widget.unreachable.title"), message: L.t("widget.unreachable.body"))
    case .solar(let vm):
      SolarCard(vm: vm)
    case .series(let vm, let type):
      SeriesCard(vm: vm, type: type)
    }
  }
}

// MARK: - Shared header / footer

struct CardHeader: View {
  let palette: Palette
  let type: ForecastDataType
  let value: String
  let unit: String
  var sub: String? = nil

  var body: some View {
    HStack(alignment: .firstTextBaseline) {
      Text(type.label)
        .font(.system(size: 16, weight: .bold))
        .foregroundColor(palette.headline)
        .lineLimit(1)
        .minimumScaleFactor(0.7)
      Spacer(minLength: 6)
      VStack(alignment: .trailing, spacing: 1) {
        (Text(value).font(.system(size: 18, weight: .bold))
          + Text(" \(unit)").font(.system(size: 11, weight: .bold)))
          .foregroundColor(palette.headline)
        if let sub {
          Text(sub)
            .font(.system(size: 10, weight: .medium))
            .foregroundStyle(.secondary)
            .lineLimit(1)
        }
      }
    }
  }
}

struct CardFooter: View {
  let left: Text
  let right: Text

  var body: some View {
    HStack {
      left
      Spacer(minLength: 4)
      right
    }
    .font(.system(size: 11, weight: .medium))
    .foregroundStyle(.secondary)
    .lineLimit(1)
    .padding(.top, 5)
  }
}

// MARK: - Chart

enum ChartKind { case area, step, stepArea }

struct ForecastChart: View {
  let points: [ChartPoint]
  let kind: ChartKind
  let palette: Palette
  let window: ChartWindow

  var body: some View {
    Chart {
      ForEach(points) { p in
        if kind != .step {
          AreaMark(x: .value("t", p.date), y: .value("v", p.value))
            .interpolationMethod(kind == .area ? .monotone : .stepEnd)
            .foregroundStyle(.linearGradient(
              colors: [palette.accent.opacity(0.42), palette.accent.opacity(0.02)],
              startPoint: .top, endPoint: .bottom))
        }
        LineMark(x: .value("t", p.date), y: .value("v", p.value))
          .interpolationMethod(kind == .area ? .monotone : .stepEnd)
          .foregroundStyle(palette.accent)
          .lineStyle(StrokeStyle(lineWidth: kind == .area ? 2.2 : 2, lineJoin: .round))
      }
    }
    .chartXScale(domain: window.start...window.end)
    .chartYScale(domain: axisBottom...axisTop)
    .chartYAxis {
      AxisMarks(position: .leading, values: yValues) { value in
        if let v = value.as(Double.self), v == 0 {
          AxisGridLine()  // full line only at zero
          AxisValueLabel()
        } else {
          AxisTick()      // min/max get a tick, no full line
          AxisValueLabel()
        }
      }
    }
    .chartXAxis {
      // Dotted line at each midnight in the window; the short weekday code of
      // the day starting there is centered on (under) the dotted line.
      AxisMarks(values: window.dayStarts) { value in
        AxisGridLine(stroke: StrokeStyle(lineWidth: 1, dash: [2, 3]))
        AxisValueLabel(anchor: .top) {
          if let d = value.as(Date.self) {
            Text(Fmt.weekday(d))
          }
        }
      }
    }
    .chartLegend(.hidden)
  }

  // Labels: 0 + max (ceil to next integer; for fractional <1 series ceil to 0.1
  // so sub-unit currencies aren't flattened). Negatives extend the domain, no label.
  private var axisTop: Double {
    let m = points.map { $0.value }.max() ?? 0
    if m <= 0 { return 1 }
    return m < 1 ? ceil(m * 10) / 10 : ceil(m)
  }
  private var axisBottom: Double { min(0, points.map { $0.value }.min() ?? 0) }
  private var yValues: [Double] { [0, axisTop] }
}

// MARK: - Cards

struct SolarCard: View {
  let vm: SolarVM
  @Environment(\.colorScheme) var scheme

  var body: some View {
    let p = Palette.make(.solar, scheme)
    let power = splitValueUnit(Format.fmtW(vm.currentPowerW ?? 0, .auto))
    VStack(spacing: 4) {
      CardHeader(palette: p, type: .solar,
                 value: power.value, unit: power.unit,
                 sub: L.t("widget.now"))
      ForecastChart(points: vm.points, kind: .area, palette: p, window: ForecastWindow.bounds())
      CardFooter(
        left: Text("\(Format.fmtWh(vm.todayRemainingWh, .auto)) ").bold().foregroundColor(p.headline)
          + Text(L.t("widget.solar.remaining")),
        right: Text("\(Format.fmtWh(vm.tomorrowWh, .auto)) ").bold().foregroundColor(.primary)
          + Text(L.t("widget.solar.tomorrow")))
    }
  }
}

/// Price / CO₂ / feed-in: current top-right, range bottom-left, ø bottom-right.
struct SeriesCard: View {
  let vm: SeriesVM
  let type: ForecastDataType
  @Environment(\.colorScheme) var scheme

  private var cur: String { vm.currency ?? "EUR" }
  private var unit: String { type == .co2 ? "g/kWh" : Format.pricePerKWhUnit(cur) }

  private func num(_ v: Double) -> String {
    type == .co2 ? Format.fmtNumber(v, 0) : Format.fmtPricePerKWh(v, cur, withUnit: false)
  }

  private var headline: (value: String, unit: String) {
    guard let c = vm.current else { return ("–", "") }
    return splitValueUnit(type == .co2 ? Format.fmtCo2Medium(c) : Format.fmtPricePerKWh(c, cur))
  }

  var body: some View {
    let p = Palette.make(type, scheme)
    VStack(spacing: 4) {
      CardHeader(palette: p, type: type, value: headline.value, unit: headline.unit, sub: L.t("widget.now"))
      ForecastChart(points: vm.points, kind: type == .co2 ? .step : .stepArea, palette: p, window: ForecastWindow.bounds())
      CardFooter(
        left: Text("\(num(vm.minV))–\(num(vm.maxV)) ").bold().foregroundColor(p.headline) + Text(unit),
        right: Text("ø ") + Text("\(num(vm.avg)) \(unit)").bold().foregroundColor(.primary))
    }
  }
}

// MARK: - States

struct MessageView: View {
  let headerTitle: String
  let accent: Color
  let symbol: String
  let title: String
  let message: String

  var body: some View {
    VStack(spacing: 0) {
      HStack {
        Text(headerTitle)
          .font(.system(size: 16, weight: .bold))
          .foregroundColor(accent)
          .lineLimit(1)
          .minimumScaleFactor(0.7)
        Spacer()
      }
      Spacer()
      VStack(spacing: 6) {
        Image(systemName: symbol).font(.system(size: 26)).foregroundStyle(.tertiary)
        Text(title).font(.system(size: 13, weight: .bold))
        Text(message)
          .font(.system(size: 11))
          .foregroundStyle(.secondary)
          .multilineTextAlignment(.center)
      }
      Spacer()
    }
  }
}

struct NotConfiguredView: View {
  var body: some View {
    VStack(spacing: 8) {
      ZStack {
        RoundedRectangle(cornerRadius: 11, style: .continuous).fill(Color.onGreen)
        Image(systemName: "bolt.fill").font(.system(size: 22)).foregroundStyle(Color.evccDarkGreen)
      }
      .frame(width: 40, height: 40)
      Text(L.t("widget.setup.title"))
        .font(.system(size: 15, weight: .bold))
        .foregroundStyle(Color.onGreen)
      Text(L.t("widget.setup.body"))
        .font(.system(size: 11, weight: .medium))
        .foregroundStyle(Color.onGreenSoft)
        .multilineTextAlignment(.center)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
  }
}
