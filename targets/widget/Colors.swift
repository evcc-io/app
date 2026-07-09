import SwiftUI

// Named colors, following evcc's tokens
// (https://github.com/evcc-io/evcc/blob/master/assets/css/app.css) where they
// map, plus a few widget-specific ones. `Color(hex:)` lives in Theme.swift.
extension Color {
  // evcc brand / energy tokens
  static let evccDarkGreen = Color(hex: 0x0FDE41)    // --evcc-dark-green
  static let evccDarkerGreen = Color(hex: 0x0BA631)  // --evcc-darker-green
  static let evccYellow = Color(hex: 0xFAF000)       // --evcc-yellow
  static let evccDarkYellow = Color(hex: 0xF6BB0F)   // --evcc-dark-yellow
  static let evccOrange = Color(hex: 0xFF9000)       // --evcc-orange
  static let evccPrice = Color(hex: 0xFF912F)        // --evcc-price
  static let evccCo2 = Color(hex: 0x00916E)          // --evcc-co2

  // neutral ramp (Bootstrap-style)
  static let bsGrayMedium = Color(hex: 0x93949E)     // --bs-gray-medium
  static let bsGrayDeep = Color(hex: 0x010322)       // --bs-gray-deep

  // widget-specific
  static let orangeStripe = Color(hex: 0xCC7400)     // heating progress stripe (darker for contrast)
  static let co2Dark = Color(hex: 0x1BB88F)          // lightened CO₂ for dark mode
  static let widgetCardDark = Color(hex: 0x1C1C1E)   // dark card background
  static let onGreen = Color(hex: 0x0A2912)          // dark ink on bright green
  static let onGreenSoft = Color(hex: 0x0A3D18)      // softer ink on bright green
  static let progressTrackLight = Color(hex: 0xECEEF0)
  static let modeBgLight = Color(hex: 0xF0F1F3)      // mode button (unselected, light)
  static let modeBgDark = Color(hex: 0x1A1B2E)       // mode button (unselected, dark)
  static let modeTextLight = Color(hex: 0x7C7D8A)
  static let modeTextDark = Color(hex: 0x9A9BAB)
}
