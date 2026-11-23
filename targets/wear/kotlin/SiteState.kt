package io.evcc.wear

import org.json.JSONArray
import org.json.JSONObject

/** Subset of /api/state shown on the overview page. Mirrors SiteState (Swift)
 *  in the iOS watch app (evcc-io/app#349). */
data class SiteState(
    val siteTitle: String?,
    val pvPower: Double?,
    val homePower: Double?,
    val gridPower: Double?,
    val batterySoc: Double?,
    val batteryPower: Double?,
    val loadpoints: List<Loadpoint>,
) {
    companion object {
        // evcc: positive grid power = import, positive battery power = discharge.
        const val JQ = "{siteTitle, pvPower, homePower, gridPower: .grid.power, " +
            "batterySoc: .battery.soc, batteryPower: .battery.power, loadpoints}"

        fun parse(json: String): SiteState? = runCatching {
            val o = JSONObject(json)
            fun d(k: String) = if (o.has(k) && !o.isNull(k)) o.optDouble(k) else null
            val loadpoints = (o.optJSONArray("loadpoints") ?: JSONArray()).let { arr ->
                (0 until arr.length()).mapNotNull { i -> Loadpoint.parse(arr.getJSONObject(i).toString()) }
            }
            SiteState(
                siteTitle = o.optString("siteTitle").takeIf { it.isNotEmpty() },
                pvPower = d("pvPower"),
                homePower = d("homePower"),
                gridPower = d("gridPower"),
                batterySoc = d("batterySoc"),
                batteryPower = d("batteryPower"),
                loadpoints = loadpoints,
            )
        }.getOrNull()
    }
}
