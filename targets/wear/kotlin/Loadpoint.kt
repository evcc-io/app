package io.evcc.wear

import org.json.JSONObject

/** Subset of /api/state .loadpoints[].ui used by the app and tile. */
data class LoadpointUi(val minTemp: Double?, val maxTemp: Double?)

/**
 * Subset of /api/state .loadpoints[] used by the app and tile. Ported
 * verbatim from targets/android-widget/kotlin/ApiClient.kt (widget #255).
 */
data class Loadpoint(
    val title: String?,
    val vehicleTitle: String?,
    val vehicleSoc: Double?,
    val effectiveLimitSoc: Double?,
    val chargePower: Double?,
    val sessionEnergy: Double?,
    val chargedEnergy: Double?,
    val mode: String?,
    val alwaysCharge: String?,
    val charging: Boolean,
    val connected: Boolean,
    val enabled: Boolean,
    val chargerFeatureHeating: Boolean,
    val chargerFeatureSwitchDevice: Boolean,
    val chargerFeatureContinuous: Boolean,
    val ui: LoadpointUi?,
    val disabled: Boolean,
) {
    companion object {
        fun parse(json: String): Loadpoint? = runCatching {
            val o = JSONObject(json)
            fun d(k: String) = if (o.has(k) && !o.isNull(k)) o.optDouble(k) else null
            val ui = o.optJSONObject("ui")?.let {
                fun uiD(k: String) = if (it.has(k) && !it.isNull(k)) it.optDouble(k) else null
                LoadpointUi(minTemp = uiD("minTemp"), maxTemp = uiD("maxTemp"))
            }
            Loadpoint(
                title = o.optString("title").takeIf { it.isNotEmpty() },
                vehicleTitle = o.optString("vehicleTitle").takeIf { it.isNotEmpty() },
                vehicleSoc = d("vehicleSoc"),
                effectiveLimitSoc = d("effectiveLimitSoc"),
                chargePower = d("chargePower"),
                sessionEnergy = d("sessionEnergy"),
                chargedEnergy = d("chargedEnergy"),
                mode = o.optString("mode").takeIf { it.isNotEmpty() },
                alwaysCharge = if (o.has("alwaysCharge") && !o.isNull("alwaysCharge")) o.optString("alwaysCharge") else null,
                charging = o.optBoolean("charging", false),
                connected = o.optBoolean("connected", false),
                enabled = o.optBoolean("enabled", false),
                chargerFeatureHeating = o.optBoolean("chargerFeatureHeating", false),
                chargerFeatureSwitchDevice = o.optBoolean("chargerFeatureSwitchDevice", false),
                chargerFeatureContinuous = o.optBoolean("chargerFeatureContinuous", false),
                ui = ui,
                disabled = o.optBoolean("disabled", false),
            )
        }.getOrNull()
    }
}

/** Disabled loadpoints are bare placeholders in the API (evcc-io/app#349);
 *  offsets stay the real .loadpoints[] index used for mode-switch POSTs. */
fun Iterable<IndexedValue<Loadpoint>>.active(): List<IndexedValue<Loadpoint>> =
    filter { !it.value.disabled }

// ---------------------------------------------------------------------------
// pure view-model helpers, ported verbatim from LoadpointWidget.kt (#255).
// string-resource lookups (modeLabel / statusLabel) are intentionally left out
// here - callers resolve them against :wear string resources (same keys as
// the widget's, see scripts/wearModule/withWearModule.ts).
// ---------------------------------------------------------------------------

enum class LpStatus(val active: Boolean) {
    DISCONNECTED(false), CONNECTED(false), WAIT_FOR_VEHICLE(false), FINISHED(false), CHARGING(true), HEATING(true),
}

data class Metric(val value: String, val unit: String, val fill: Double?)

/** alwaysCharge exists since the smart-mode redesign; its presence tells new servers apart. */
fun smartModeServer(lp: Loadpoint): Boolean = lp.alwaysCharge != null

fun modes(lp: Loadpoint): List<String> = when {
    smartModeServer(lp) -> listOf("off", "smart", "now")
    lp.chargerFeatureSwitchDevice -> listOf("off", "pv", "now")
    else -> listOf("off", "pv", "minpv", "now")
}

fun alwaysChargeActive(lp: Loadpoint): Boolean = lp.alwaysCharge == "on" || lp.alwaysCharge == "once"

fun status(lp: Loadpoint): LpStatus {
    val heating = lp.chargerFeatureHeating
    val soc = lp.vehicleSoc ?: 0.0
    val limit = lp.effectiveLimitSoc ?: 0.0
    return when {
        !lp.connected -> LpStatus.DISCONNECTED
        lp.charging -> if (heating) LpStatus.HEATING else LpStatus.CHARGING
        lp.enabled -> if (limit > 0 && soc >= limit) LpStatus.FINISHED else LpStatus.WAIT_FOR_VEHICLE
        else -> LpStatus.CONNECTED
    }
}

fun metric(lp: Loadpoint): Metric {
    val heating = lp.chargerFeatureHeating
    val soc = lp.vehicleSoc ?: 0.0
    return when {
        heating -> {
            val minT = lp.ui?.minTemp ?: 0.0
            val maxT = lp.ui?.maxTemp ?: 100.0
            val fill = if (maxT > minT) ((soc - minT) / (maxT - minT)).coerceIn(0.0, 1.0) else null
            Metric(Format.fmtNumber(soc, 1), "°C", fill)
        }
        soc > 0 -> Metric(Format.fmtNumber(soc, 0), "%", (soc / 100).coerceIn(0.0, 1.0))
        else -> {
            val kWh = ((lp.chargedEnergy ?: lp.sessionEnergy ?: 0.0)) / 1000
            Metric(Format.fmtNumber(kWh, 1), "kWh", null)
        }
    }
}

/** Charging point leads over the vehicle name, so an empty connector can't hide
 *  where the car is actually plugged in (same rule as the iOS watch app). */
fun headline(lp: Loadpoint, fallback: String): String {
    val title = lp.title?.trim().orEmpty()
    if (title.isNotEmpty()) return title
    val vehicle = lp.vehicleTitle?.trim().orEmpty()
    return vehicle.ifEmpty { fallback }
}
