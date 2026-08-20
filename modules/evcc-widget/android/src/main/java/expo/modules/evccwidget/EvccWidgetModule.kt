package expo.modules.evccwidget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Intent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class EvccWidgetModule : Module() {
  // Glance widget receivers injected by scripts/androidWidget/withAndroidWidget.ts.
  // Names are stable; the package is resolved at runtime so dev/prod app ids both work.
  private val receivers = listOf(
    "EvccLoadpointWidgetReceiver",
    "EvccSolarWidgetReceiver",
    "EvccPriceWidgetReceiver",
    "EvccCo2WidgetReceiver",
    "EvccFeedinWidgetReceiver",
  )

  override fun definition() = ModuleDefinition {
    Name("EvccWidget")

    // Force an immediate redraw of the home-screen widgets. Sends each receiver a
    // targeted APPWIDGET_UPDATE broadcast; GlanceAppWidgetReceiver re-runs
    // provideGlance on receipt, so the widgets re-read the synced server list.
    Function("refresh") {
      val context = appContext.reactContext?.applicationContext ?: return@Function Unit
      val manager = AppWidgetManager.getInstance(context)
      val pkg = context.packageName

      for (name in receivers) {
        val cn = ComponentName(pkg, "$pkg.widget.$name")
        val ids = try {
          manager.getAppWidgetIds(cn)
        } catch (e: Exception) {
          continue // provider not present (e.g. widget type never placed)
        }
        if (ids.isNotEmpty()) {
          val intent = Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE).apply {
            component = cn
            putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
          }
          context.sendBroadcast(intent)
        }
      }
    }
  }
}
