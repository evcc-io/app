import SwiftUI

extension Color {
  init(hex: UInt32) {
    self.init(
      .sRGB,
      red: Double((hex >> 16) & 0xFF) / 255,
      green: Double((hex >> 8) & 0xFF) / 255,
      blue: Double(hex & 0xFF) / 255,
      opacity: 1)
  }
}

/// Per-data-type colors, resolved for the current color scheme.
/// Values mirror evcc's web tokens (assets/css/app.css).
struct Palette {
  let accent: Color    // chart stroke + area
  let headline: Color  // title + headline number color

  static func make(_ type: ForecastDataType, _ scheme: ColorScheme) -> Palette {
    let dark = scheme == .dark
    switch type {
    case .solar:
      let green = Color.evccDarkGreen
      return Palette(accent: green, headline: dark ? green : Color.evccDarkerGreen)
    case .price:
      let orange = Color.evccPrice
      return Palette(accent: orange, headline: orange)
    case .co2:
      let co2 = dark ? Color.co2Dark : Color.evccCo2
      return Palette(accent: co2, headline: co2)
    case .feedin:
      let yellow = dark ? Color.evccYellow : Color.evccDarkYellow
      return Palette(accent: yellow, headline: yellow)
    }
  }
}
