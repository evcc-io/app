import Foundation

// Swift port of a SUBSET of evcc's web formatter — keep in sync with:
// https://github.com/evcc-io/evcc/blob/master/assets/js/mixins/formatter.ts
// Mirror the structure/names so it can be re-applied from source on updates.
// Numbers use the device locale (the web uses the active i18n locale).

enum PowerUnit: String {
  case w = "W"
  case kw = "kW"
  case mw = "MW"
  case auto = ""
}

private let CURRENCY_SYMBOLS: [String: String] = [
  "AUD": "$", "BGN": "лв", "BRL": "R$", "CAD": "$", "CHF": "Fr.", "CNY": "¥",
  "CZK": "Kč", "EUR": "€", "GBP": "£", "HUF": "Ft", "ILS": "₪", "JPY": "¥",
  "NZD": "$", "NOK": "kr", "PLN": "zł", "RON": "lei", "USD": "$", "DKK": "kr",
  "SEK": "kr", "ZAR": "R", "TRY": "₺", "MYR": "RM",
]

// currencies where the energy price is shown in subunits (factor 100)
private let ENERGY_PRICE_IN_SUBUNIT: [String: String] = [
  "AUD": "c", "BGN": "st", "BRL": "¢", "CAD": "¢", "EUR": "ct", "GBP": "p",
  "ILS": "ag", "NZD": "c", "NOK": "øre", "PLN": "gr", "USD": "¢", "DKK": "øre",
  "SEK": "öre", "ZAR": "c", "TRY": "krş",
]

enum Format {
  private static var locale: Locale { .current }

  private static func number(_ value: Double, _ decimals: Int, max: Int? = nil) -> String {
    let f = NumberFormatter()
    f.locale = locale
    f.numberStyle = .decimal
    f.minimumFractionDigits = decimals
    f.maximumFractionDigits = max ?? decimals
    return f.string(from: NSNumber(value: value)) ?? "\(value)"
  }

  static func energyPriceSubunit(_ currency: String) -> String? {
    if currency == "CHF" {
      return locale.language.languageCode?.identifier == "de" ? "Rp." : "ct."
    }
    return ENERGY_PRICE_IN_SUBUNIT[currency]
  }

  static func fmtNumber(_ value: Double, _ decimals: Int) -> String {
    number(value, decimals)
  }

  static func fmtW(_ watt: Double, _ format: PowerUnit = .kw, withUnit: Bool = true, digits: Int? = nil) -> String {
    var unit = format
    if unit == .auto {
      if watt >= 10_000_000 { unit = .mw }
      else if watt >= 1000 || watt == 0 { unit = .kw }
      else { unit = .w }
    }
    var value = watt
    if unit == .kw { value = watt / 1000 }
    else if unit == .mw { value = watt / 1_000_000 }
    let d = digits ?? ((unit == .kw || unit == .mw || (unit != .w && watt == 0)) ? 1 : 0)
    return number(value, d) + (withUnit ? " \(unit.rawValue)" : "")
  }

  static func fmtWh(_ watt: Double, _ format: PowerUnit = .kw, withUnit: Bool = true, digits: Int? = nil) -> String {
    fmtW(watt, format, withUnit: withUnit, digits: digits) + (withUnit ? "h" : "")
  }

  static func fmtCo2Short(_ grams: Double) -> String { "\(fmtNumber(grams, 0)) g" }
  static func fmtCo2Medium(_ grams: Double) -> String { "\(fmtNumber(grams, 0)) g/kWh" }

  static func pricePerKWhDisplayFactor(_ currency: String) -> Double {
    energyPriceSubunit(currency) != nil ? 100 : 1
  }

  static func pricePerKWhUnit(_ currency: String, short: Bool = false) -> String {
    let unit = energyPriceSubunit(currency) ?? CURRENCY_SYMBOLS[currency] ?? currency
    return "\(unit)\(short ? "" : "/kWh")"
  }

  static func fmtPricePerKWh(_ amount: Double, _ currency: String = "EUR", short: Bool = false, withUnit: Bool = true) -> String {
    let value = amount * pricePerKWhDisplayFactor(currency)
    let price = number(value, 1, max: energyPriceSubunit(currency) != nil ? 1 : 3)
    return withUnit ? "\(price) \(pricePerKWhUnit(currency, short: short))" : price
  }
}

/// Splits a "<number> <unit>" string (e.g. "8,4 kW", "23,4 ct/kWh") into parts
/// so the header can render the value large and the unit small.
func splitValueUnit(_ s: String) -> (value: String, unit: String) {
  guard let r = s.range(of: " ") else { return (s, "") }
  return (String(s[..<r.lowerBound]), String(s[r.upperBound...]))
}
