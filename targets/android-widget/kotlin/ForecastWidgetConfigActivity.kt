package io.evcc.android.widget

import android.app.Activity
import android.appwidget.AppWidgetManager
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.util.TypedValue
import android.view.View
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView

/**
 * Config for the forecast widgets: pick a server, and (Solar only) whether to
 * adjust the forecast to real production. Stored per appWidgetId in WidgetConfig.
 * Shared by all four forecast types; the Solar toggle is shown only when the
 * widget being configured is the Solar provider.
 */
class ForecastWidgetConfigActivity : Activity() {
    private var appWidgetId = AppWidgetManager.INVALID_APPWIDGET_ID
    private var isSolar = false

    private lateinit var titleView: TextView
    private lateinit var container: LinearLayout // holds the tappable rows

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setResult(RESULT_CANCELED)

        appWidgetId = intent?.extras?.getInt(
            AppWidgetManager.EXTRA_APPWIDGET_ID,
            AppWidgetManager.INVALID_APPWIDGET_ID,
        ) ?: AppWidgetManager.INVALID_APPWIDGET_ID
        if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            finish()
            return
        }

        val provider = AppWidgetManager.getInstance(this).getAppWidgetInfo(appWidgetId)?.provider
        isSolar = provider?.className?.endsWith("EvccSolarWidgetReceiver") == true

        setContentView(buildLayout())
        showServers()
    }

    // --- UI helpers (mirrors LoadpointWidgetConfigActivity) ---

    private fun dp(v: Int): Int = TypedValue.applyDimension(
        TypedValue.COMPLEX_UNIT_DIP, v.toFloat(), resources.displayMetrics,
    ).toInt()

    private fun buildLayout(): View {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(0, dp(24), 0, 0)
        }
        titleView = TextView(this).apply {
            setPadding(dp(20), dp(8), dp(20), dp(16))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 22f)
            setTypeface(typeface, Typeface.BOLD)
        }
        container = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        val scroll = ScrollView(this).apply {
            layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f)
            addView(container)
        }
        root.addView(titleView)
        root.addView(scroll)
        return root
    }

    private fun setRows(items: List<String>, onClick: ((Int) -> Unit)?) {
        container.removeAllViews()
        items.forEachIndexed { index, label ->
            val row = TextView(this).apply {
                text = label
                setPadding(dp(20), dp(18), dp(20), dp(18))
                setTextSize(TypedValue.COMPLEX_UNIT_SP, 18f)
                setTextColor(if (onClick != null) textColor() else Color.GRAY)
                if (onClick != null) {
                    isClickable = true
                    setBackgroundResource(selectableItemBackground())
                    setOnClickListener { onClick(index) }
                }
            }
            container.addView(row)
        }
    }

    private fun selectableItemBackground(): Int {
        val tv = TypedValue()
        theme.resolveAttribute(android.R.attr.selectableItemBackground, tv, true)
        return tv.resourceId
    }

    private fun textColor(): Int {
        val tv = TypedValue()
        return if (theme.resolveAttribute(android.R.attr.textColorPrimary, tv, true)) {
            resources.getColor(tv.resourceId, theme)
        } else {
            Color.DKGRAY
        }
    }

    // --- flow ---

    private fun showServers() {
        titleView.text = "Choose server"
        val servers = SharedStore.servers(this)
        when {
            servers.isEmpty() -> setRows(listOf("No servers — add one in the app first"), null)
            servers.size == 1 -> onServer(servers[0].id)
            else -> setRows(servers.map { it.displayTitle }) { index -> onServer(servers[index].id) }
        }
    }

    private fun onServer(serverId: String) {
        if (isSolar) showAdjust(serverId) else save(serverId, adjust = true)
    }

    private fun showAdjust(serverId: String) {
        titleView.text = "Adjust to real production?"
        setRows(listOf("Yes (recommended)", "No")) { index -> save(serverId, adjust = index == 0) }
    }

    private fun save(serverId: String, adjust: Boolean) {
        WidgetConfig.saveForecast(this, appWidgetId, serverId, adjust)
        // ask the just-configured widget to render now
        AppWidgetManager.getInstance(this).getAppWidgetInfo(appWidgetId)?.provider?.let { provider ->
            sendBroadcast(
                Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE).apply {
                    component = provider
                    putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, intArrayOf(appWidgetId))
                },
            )
        }
        setResult(RESULT_OK, Intent().putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId))
        finish()
    }
}
