import SwiftUI
import WidgetKit

@main
struct EvccWidgetBundle: WidgetBundle {
  var body: some Widget {
    SolarWidget()
    PriceWidget()
    Co2Widget()
    FeedinWidget()
    LoadpointWidget()
  }
}
