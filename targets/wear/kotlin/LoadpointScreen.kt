package io.evcc.wear

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.foundation.lazy.ScalingLazyListState
import androidx.wear.compose.foundation.lazy.items
import androidx.wear.compose.material.CircularProgressIndicator
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.material.Text

/** One loadpoint: vehicle, charge progress/power, status, mode switch. Mirrors
 *  LoadpointPage (Swift) in the iOS watch app (evcc-io/app#349). */
@Composable
fun LoadpointScreen(
    loadpoint: Loadpoint,
    index: Int,
    pendingMode: String?,
    unreachable: Boolean,
    lastUpdateMillis: Long?,
    listState: ScalingLazyListState,
    onSetMode: (Int, String) -> Unit,
) {
    val m = metric(loadpoint)
    val st = status(loadpoint)
    val heating = loadpoint.chargerFeatureHeating
    val accent = accentColor(heating)
    val currentMode = pendingMode ?: loadpoint.mode
    val title = headline(loadpoint, stringResource(R.string.widget_loadpoint_name))
    val vehicle = loadpoint.vehicleTitle?.trim()?.takeIf { it.isNotEmpty() && it != title }

    ScalingLazyColumn(
        modifier = Modifier.fillMaxSize().alpha(if (unreachable) 0.5f else 1f),
        state = listState,
    ) {
        item {
            Text(title, style = MaterialTheme.typography.title3, fontWeight = FontWeight.SemiBold)
        }
        item {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    statusLabel(st, heating),
                    style = MaterialTheme.typography.caption1,
                    color = if (st.active) accent else MaterialTheme.colors.onSurfaceVariant,
                )
            }
        }
        item {
            Column(modifier = Modifier.padding(vertical = 4.dp)) {
                Row(verticalAlignment = Alignment.Bottom) {
                    Text(m.value, style = MaterialTheme.typography.display2, fontWeight = FontWeight.SemiBold)
                    Text(" ${m.unit}", style = MaterialTheme.typography.caption1, color = MaterialTheme.colors.onSurfaceVariant)
                }
                if (m.fill != null) {
                    CircularProgressIndicator(
                        progress = m.fill.toFloat(),
                        modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                    )
                }
                if (st.active) {
                    Text(
                        Format.fmtW(loadpoint.chargePower ?: 0.0),
                        style = MaterialTheme.typography.caption1,
                        fontWeight = FontWeight.SemiBold,
                        color = accent,
                    )
                }
                if (vehicle != null) {
                    Text(vehicle, style = MaterialTheme.typography.caption2, color = MaterialTheme.colors.onSurfaceVariant)
                }
            }
        }
        val modeOptions = modes(loadpoint)
        items(modeOptions.size) { i ->
            val mode = modeOptions[i]
            ModeChip(
                label = modeLabel(mode, loadpoint),
                selected = mode == currentMode,
                accent = accent,
                enabled = !unreachable,
                onClick = { onSetMode(index, mode) },
            )
        }
        item { StaleFooter(unreachable, lastUpdateMillis) }
    }
}

@Composable
private fun modeLabel(mode: String, lp: Loadpoint): String {
    val res = when (mode) {
        "off" -> if (lp.chargerFeatureContinuous) R.string.widget_mode_normal else R.string.widget_mode_off
        "now" -> when {
            lp.chargerFeatureContinuous -> R.string.widget_mode_boost
            lp.chargerFeatureSwitchDevice -> R.string.widget_mode_on
            else -> R.string.widget_mode_now
        }
        "smart" -> R.string.widget_mode_smart
        "pv" -> R.string.widget_mode_pv
        "minpv" -> R.string.widget_mode_minpv
        else -> R.string.widget_mode_now
    }
    return stringResource(res)
}

@Composable
private fun statusLabel(s: LpStatus, heating: Boolean): String {
    val res = when (s) {
        LpStatus.DISCONNECTED -> R.string.widget_lpstatus_disconnected
        LpStatus.CONNECTED -> if (heating) R.string.widget_lpheat_connected else R.string.widget_lpstatus_connected
        LpStatus.WAIT_FOR_VEHICLE -> if (heating) R.string.widget_lpheat_waitForVehicle else R.string.widget_lpstatus_waitForVehicle
        LpStatus.FINISHED -> R.string.widget_lpstatus_finished
        LpStatus.CHARGING -> R.string.widget_lpstatus_charging
        LpStatus.HEATING -> R.string.widget_lpheat_charging
    }
    return stringResource(res)
}
