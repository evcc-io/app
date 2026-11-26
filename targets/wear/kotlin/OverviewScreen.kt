package io.evcc.wear

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.filled.BatteryFull
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.WbSunny
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.foundation.lazy.ScalingLazyListState
import androidx.wear.compose.material.CircularProgressIndicator
import kotlin.math.abs

/** Site energy flow: production, consumption, grid, battery. Mirrors
 *  OverviewPage (Swift) in the iOS watch app (evcc-io/app#349). */
@Composable
fun OverviewScreen(
    site: SiteState?,
    unreachable: Boolean,
    lastUpdateMillis: Long?,
    listState: ScalingLazyListState,
) {
    if (site == null && !unreachable) {
        CircularProgressIndicator(progress = 0f, modifier = Modifier.fillMaxSize())
        return
    }
    if (site == null) {
        MessageScreen(
            title = stringResource(R.string.widget_unreachable_title),
            message = stringResource(R.string.widget_unreachable_body),
        )
        return
    }

    val grid = site.gridPower ?: 0.0
    val exporting = grid < 0
    val battery = site.batterySoc
    val batteryWatts = site.batteryPower ?: 0.0

    ScalingLazyColumn(
        modifier = Modifier.fillMaxSize().alpha(if (unreachable) 0.5f else 1f),
        state = listState,
    ) {
        item {
            FlowRow(Icons.Filled.WbSunny, Color(Theme.EVCC_GREEN), stringResource(R.string.wear_flow_pv), site.pvPower ?: 0.0)
        }
        item {
            FlowRow(Icons.Filled.Home, Color(Theme.GRAY_MEDIUM), stringResource(R.string.wear_flow_home), site.homePower ?: 0.0)
        }
        item {
            FlowRow(
                if (exporting) Icons.Filled.ArrowUpward else Icons.Filled.ArrowDownward,
                Color(if (exporting) Theme.EVCC_YELLOW else Theme.GRAY_MEDIUM),
                stringResource(if (exporting) R.string.wear_flow_gridExport else R.string.wear_flow_gridImport),
                abs(grid),
            )
        }
        if (battery != null) {
            item {
                val labelRes = when {
                    batteryWatts > 50 -> R.string.wear_flow_batteryDischarge
                    batteryWatts < -50 -> R.string.wear_flow_batteryCharge
                    else -> R.string.wear_flow_battery
                }
                FlowRow(
                    Icons.Filled.BatteryFull,
                    Color(Theme.EVCC_GREEN),
                    stringResource(labelRes),
                    abs(batteryWatts),
                    detail = "${Format.fmtNumber(battery, 0)} %",
                )
            }
        }
        item { StaleFooter(unreachable, lastUpdateMillis) }
    }
}
