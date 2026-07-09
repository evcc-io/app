import SwiftUI
import WidgetKit

@main
struct EvccWidgetBundle: WidgetBundle {
  var body: some Widget {
    LoadpointWidget()
    SolarWidget()
    PriceWidget()
    Co2Widget()
    FeedinWidget()
  }
}
