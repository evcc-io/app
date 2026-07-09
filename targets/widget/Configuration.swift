import AppIntents
import WidgetKit

/// The data types, one per dedicated widget. Drives colors/icon/labels.
enum ForecastDataType: String {
  case solar
  case price
  case co2
  case feedin

  var label: String { L.t("widget.type.\(rawValue)") }
}

/// Server picker options. A plain String parameter (the server id) + dynamic
/// options avoids the AppEntity/EntityIdentifier machinery, which failed to
/// register/resolve in the widget extension ("not a registered AppEntity
/// identifier") and broke server selection.
struct ServerOptions: DynamicOptionsProvider {
  func results() async throws -> IntentItemCollection<String> {
    IntentItemCollection(sections: [
      IntentItemSection(items: SharedStore.servers().map { server in
        IntentItem<String>(
          server.id,
          title: LocalizedStringResource(stringLiteral: server.displayTitle),
          subtitle: LocalizedStringResource(stringLiteral: server.url))
      })
    ])
  }

  // No defaultResult: with a String parameter iOS shows the raw id ("1") for the
  // default until the user picks. Leave it unset; the widget falls back to the
  // active server internally (SharedStore.defaultServer).
}

/// Per-instance config for price / CO₂ / feed-in: which server (by id).
/// Data type is fixed by the widget kind.
struct ConfigurationAppIntent: WidgetConfigurationIntent {
  static var title: LocalizedStringResource = "widget.config.title"
  static var description = IntentDescription("widget.config.desc")

  @Parameter(title: "widget.config.server", optionsProvider: ServerOptions())
  var server: String?
}

/// Solar config adds the "adjust to real production" toggle (forecast.scale).
struct SolarConfigurationAppIntent: WidgetConfigurationIntent {
  static var title: LocalizedStringResource = "widget.config.title"
  static var description = IntentDescription("widget.config.desc")

  @Parameter(title: "widget.config.server", optionsProvider: ServerOptions())
  var server: String?

  @Parameter(title: "widget.solar.adjust", default: false)
  var adjust: Bool
}
