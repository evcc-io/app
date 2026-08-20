package io.evcc.android.widget

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/**
 * Per-widget-instance config (server + loadpoint), keyed by appWidgetId in plain
 * SharedPreferences, written synchronously so it survives aggressive process
 * kills (MIUI et al.).
 *
 * Some launchers (notably MIUI) hand the configuration Activity a different
 * appWidgetId than the one the widget is finally bound with, so per-id keying
 * alone can't correlate the two. To cover that, each selection is also pushed
 * onto a FIFO "pending" queue; a freshly-bound widget with no config of its own
 * dequeues the oldest entry on first render (see [resolve]). A queue (rather
 * than a single overwritable slot) matters because configuring a second widget
 * before the first one has rendered must not steal the first widget's pending
 * selection.
 */
object WidgetConfig {
    private const val PREFS = "evcc_widget_config"
    private const val PENDING_QUEUE = "pending_queue"

    private fun prefs(context: Context) =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun save(context: Context, appWidgetId: Int, serverId: String?, lpIndex: Int) {
        val p = prefs(context)
        val queue = JSONArray(p.getString(PENDING_QUEUE, "[]"))
        queue.put(JSONObject().put("server", serverId ?: JSONObject.NULL).put("lp", lpIndex))
        p.edit()
            .putString("server_$appWidgetId", serverId)
            .putInt("lp_$appWidgetId", lpIndex)
            .putString(PENDING_QUEUE, queue.toString())
            .commit() // synchronous — must be on disk before the Activity finishes
    }

    /**
     * Resolve (serverId, lpIndex) for a widget instance. Uses this instance's own
     * config if present; otherwise dequeues the oldest pending selection (and
     * binds it to this appWidgetId), covering the configure/bind id mismatch.
     * Returns null when the widget hasn't been configured at all yet (e.g. the
     * OS renders it once before the configure Activity's async save lands) -
     * callers must treat that as "not configured", not as "use defaults", since
     * a null serverId elsewhere means "use the default server".
     */
    fun resolve(context: Context, appWidgetId: Int): Pair<String?, Int>? {
        val p = prefs(context)
        if (p.contains("lp_$appWidgetId")) {
            return p.getString("server_$appWidgetId", null) to p.getInt("lp_$appWidgetId", 0)
        }
        val queue = JSONArray(p.getString(PENDING_QUEUE, "[]"))
        if (queue.length() == 0) return null
        val entry = queue.getJSONObject(0)
        val serverId = entry.optString("server").takeIf { entry.has("server") && !entry.isNull("server") }
        val lpIndex = entry.optInt("lp", 0)
        val rest = JSONArray()
        for (i in 1 until queue.length()) rest.put(queue.get(i))
        p.edit()
            .putString("server_$appWidgetId", serverId)
            .putInt("lp_$appWidgetId", lpIndex)
            .putString(PENDING_QUEUE, rest.toString())
            .commit()
        return serverId to lpIndex
    }

    fun clear(context: Context, appWidgetId: Int) {
        prefs(context).edit()
            .remove("server_$appWidgetId")
            .remove("lp_$appWidgetId")
            .remove("adjust_$appWidgetId")
            .apply()
    }
}
