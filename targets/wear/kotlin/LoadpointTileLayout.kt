package io.evcc.wear

import android.content.Context
import androidx.wear.protolayout.ActionBuilders
import androidx.wear.protolayout.ColorBuilders
import androidx.wear.protolayout.DimensionBuilders
import androidx.wear.protolayout.LayoutElementBuilders
import androidx.wear.protolayout.LayoutElementBuilders.LayoutElement
import androidx.wear.protolayout.ModifiersBuilders

/**
 * protolayout builder for the loadpoint tile. Single-column, centered;
 * blueprint is LoadpointWidget.kt's LoadpointCard (widget #255), minus the
 * width classes - the watch has one width. Whole tile is tappable, opening
 * [MainActivity] (v1 doesn't act on tile taps, see LoadpointTileService.kt).
 */
object LoadpointTileLayout {
    private fun openAppClickable(context: Context): ModifiersBuilders.Clickable =
        ModifiersBuilders.Clickable.Builder()
            .setId("open_app")
            .setOnClick(
                ActionBuilders.LaunchAction.Builder()
                    .setAndroidActivity(
                        ActionBuilders.AndroidActivity.Builder()
                            .setPackageName(context.packageName)
                            .setClassName(MainActivity::class.java.name)
                            .build(),
                    )
                    .build(),
            )
            .build()

    fun build(context: Context, state: TileState): LayoutElement = when (state) {
        is TileState.Data -> dataLayout(context, state.lp)
        TileState.NoData -> messageLayout(context, context.getString(R.string.widget_noData_title))
        TileState.Unreachable -> messageLayout(context, context.getString(R.string.widget_unreachable_title))
        TileState.NotConfigured -> messageLayout(context, context.getString(R.string.wear_empty_title))
    }

    private fun text(value: String, sizeSp: Float, color: Int, bold: Boolean = false): LayoutElementBuilders.Text =
        LayoutElementBuilders.Text.Builder()
            .setText(value)
            .setMaxLines(1)
            .setFontStyle(
                LayoutElementBuilders.FontStyle.Builder()
                    .setSize(DimensionBuilders.sp(sizeSp))
                    .setColor(ColorBuilders.argb(color))
                    .setWeight(if (bold) LayoutElementBuilders.FONT_WEIGHT_BOLD else LayoutElementBuilders.FONT_WEIGHT_NORMAL)
                    .build(),
            )
            .build()

    private fun dataLayout(context: Context, lp: Loadpoint): LayoutElement {
        val m = metric(lp)
        val st = status(lp)
        val heating = lp.chargerFeatureHeating
        val dark = true
        val title = headline(lp, context.getString(R.string.widget_loadpoint_name))
        val statusText = statusLabel(context, st, heating)

        return LayoutElementBuilders.Column.Builder()
            .setWidth(DimensionBuilders.expand())
            .setHeight(DimensionBuilders.expand())
            .setModifiers(ModifiersBuilders.Modifiers.Builder().setClickable(openAppClickable(context)).build())
            .addContent(text(title, 13f, Theme.textSecondary(dark)))
            .addContent(
                LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(2f)).build(),
            )
            .addContent(
                LayoutElementBuilders.Row.Builder()
                    .addContent(text(m.value, 28f, Theme.textPrimary(dark), bold = true))
                    .addContent(text(" ${m.unit}", 13f, Theme.textSecondary(dark)))
                    .build(),
            )
            .addContent(
                text(statusText, 12f, Theme.statusColor(st.active, heating, dark)),
            )
            .build()
    }

    private fun messageLayout(context: Context, message: String): LayoutElement =
        LayoutElementBuilders.Column.Builder()
            .setWidth(DimensionBuilders.expand())
            .setHeight(DimensionBuilders.expand())
            .setModifiers(ModifiersBuilders.Modifiers.Builder().setClickable(openAppClickable(context)).build())
            .addContent(text(message, 14f, Theme.textSecondary(true)))
            .build()
}

/** Non-Composable string lookups for the tile layout (LoadpointTileService runs off the UI thread). */
fun statusLabel(context: Context, s: LpStatus, heating: Boolean): String = context.getString(
    when (s) {
        LpStatus.DISCONNECTED -> R.string.widget_lpstatus_disconnected
        LpStatus.CONNECTED -> if (heating) R.string.widget_lpheat_connected else R.string.widget_lpstatus_connected
        LpStatus.WAIT_FOR_VEHICLE -> if (heating) R.string.widget_lpheat_waitForVehicle else R.string.widget_lpstatus_waitForVehicle
        LpStatus.FINISHED -> R.string.widget_lpstatus_finished
        LpStatus.CHARGING -> R.string.widget_lpstatus_charging
        LpStatus.HEATING -> R.string.widget_lpheat_charging
    },
)
