import Foundation

// MARK: - API decodables (subset of /api/state)

struct ForecastSlot: Decodable {
  let start: Date
  let end: Date
  let value: Double
}

struct SolarEnergy: Decodable {
  let energy: Double?  // Wh
  let complete: Bool?
}

struct SolarPoint: Decodable {
  let ts: Date
  let val: Double  // W
}

struct SolarForecast: Decodable {
  let scale: Double?
  let today: SolarEnergy?
  let tomorrow: SolarEnergy?
  let dayAfterTomorrow: SolarEnergy?
  let timeseries: [SolarPoint]?
}

/// Price / feed-in payload: the slots + the site currency (for evcc price rules).
struct SeriesPayload: Decodable {
  let currency: String?
  let slots: [ForecastSlot]?
}

// MARK: - JSON decoding
// Dates arrive as ISO-8601 strings (e.g. 2026-06-23T00:15:00+02:00) from older
// evcc versions, or as unix seconds from newer ones (evcc-io/evcc#31765).

enum EvccJSON {
  private static let isoNoFrac: ISO8601DateFormatter = {
    let f = ISO8601DateFormatter()
    f.formatOptions = [.withInternetDateTime]
    return f
  }()
  private static let isoFrac: ISO8601DateFormatter = {
    let f = ISO8601DateFormatter()
    f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return f
  }()

  static let decoder: JSONDecoder = {
    let d = JSONDecoder()
    d.dateDecodingStrategy = .custom { dec in
      let c = try dec.singleValueContainer()
      if let seconds = try? c.decode(Double.self) {
        return Date(timeIntervalSince1970: seconds)
      }
      let s = try c.decode(String.self)
      if let date = isoNoFrac.date(from: s) ?? isoFrac.date(from: s) { return date }
      throw DecodingError.dataCorruptedError(in: c, debugDescription: "bad date \(s)")
    }
    return d
  }()
}

// MARK: - 48h window

/// Rolling 48h window: now → now+48h. Forecast data has no history, so we start
/// at `now`. Data is trimmed to it and the x-axis is pinned to it; `dayStarts`
/// are the local midnights inside the window, where the dotted lines + weekday
/// labels go.
struct ChartWindow {
  let start: Date
  let end: Date
  let dayStarts: [Date]
}

enum ForecastWindow {
  static func bounds(now: Date = Date()) -> ChartWindow {
    let cal = Calendar.current
    let end = now.addingTimeInterval(48 * 3600)
    let midnight = cal.startOfDay(for: now)
    let dayStarts = (1...2)
      .compactMap { cal.date(byAdding: .day, value: $0, to: midnight) }
      .filter { $0 > now && $0 < end }
    return ChartWindow(start: now, end: end, dayStarts: dayStarts)
  }
}

// MARK: - Chart point + view models

struct ChartPoint: Identifiable {
  let id = UUID()
  let date: Date
  let value: Double
}

struct SolarVM {
  let points: [ChartPoint]  // kW
  let currentPowerW: Double?  // live PV power (raw watts)
  let todayRemainingWh: Double  // raw Wh (formatted via Format.fmtWh)
  let tomorrowWh: Double

  static func build(solar f: SolarForecast, adjust: Bool, now: Date = Date()) -> SolarVM? {
    guard let ts = f.timeseries, !ts.isEmpty else { return nil }
    // `scale` adjusts the forecast to real production; opt-in via the widget toggle.
    let scale = adjust ? (f.scale ?? 1) : 1
    let w = ForecastWindow.bounds(now: now)

    let inWindow = ts.filter { $0.ts >= w.start && $0.ts < w.end }
    guard !inWindow.isEmpty else { return nil }
    let points = inWindow.map { ChartPoint(date: $0.ts, value: $0.val * scale / 1000.0) }

    let divider = w.dayStarts.first ?? w.end  // today | tomorrow split
    let todayItems = inWindow.filter { $0.ts < divider }
    let todayRemainingWh = todayItems
      .reduce(0.0) { $0 + $1.val * scale * 0.25 }  // 15-min slots => 0.25 h, Wh
    let tomorrowWh = (f.tomorrow?.energy ?? 0) * scale

    // "jetzt" = forecast value of the slot covering now.
    let currentPowerW = ts.last(where: { $0.ts <= now }).map { $0.val * scale }

    return SolarVM(points: points, currentPowerW: currentPowerW,
                   todayRemainingWh: todayRemainingWh, tomorrowWh: tomorrowWh)
  }
}

/// Generic series for price / co2 / feed-in: current value + range + average.
/// Price / CO₂ / feed-in. Chart `points` are display units (e.g. ct) so the axis
/// is readable; current/min/max/avg stay RAW and are formatted via Format
/// (which applies the currency factor itself). `currency == nil` → CO₂.
struct SeriesVM {
  let points: [ChartPoint]
  let current: Double?
  let minV: Double
  let maxV: Double
  let avg: Double
  let currency: String?

  static func build(from slots: [ForecastSlot], currency: String?, now: Date = Date()) -> SeriesVM? {
    guard !slots.isEmpty else { return nil }
    let w = ForecastWindow.bounds(now: now)

    let windowed = slots.filter { $0.start >= w.start && $0.start < w.end }
    guard !windowed.isEmpty else { return nil }
    let factor = currency != nil ? Format.pricePerKWhDisplayFactor(currency!) : 1
    let points = windowed.map { ChartPoint(date: $0.start, value: $0.value * factor) }
    let raws = windowed.map { $0.value }
    let avg = raws.reduce(0, +) / Double(raws.count)
    let current = (slots.first { now >= $0.start && now < $0.end }
      ?? windowed.first { now < $0.end })?.value

    return SeriesVM(points: points, current: current,
                    minV: raws.min() ?? 0, maxV: raws.max() ?? 0, avg: avg, currency: currency)
  }
}

// MARK: - Formatting

enum Fmt {
  static func weekday(_ d: Date) -> String {
    let f = DateFormatter()
    f.locale = .current
    f.setLocalizedDateFormatFromTemplate("EEEEEE")  // short standalone, e.g. "Mi"
    return f.string(from: d)
  }
}

