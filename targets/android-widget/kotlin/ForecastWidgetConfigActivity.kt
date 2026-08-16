package io.evcc.android.widget

import android.app.Activity
import android.appwidget.AppWidgetManager
import android.content.Intent
import android.content.res.Configuration
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Config for the forecast widgets: pick a server, and (Solar only) whether to
 * adjust the forecast to real production. Stored per appWidgetId in
 * WidgetConfig. Shared by all four forecast types; the Solar toggle is shown
 * only when the widget being configured is the Solar provider. Each choice
 * fetches live data and shows a preview of the actual widget (see
 * WidgetPreview) before committing via the "Use this" button.
 */
class ForecastWidgetConfigActivity : Activity() {
    private val scope = MainScope()
    private var appWidgetId = AppWidgetManager.INVALID_APPWIDGET_ID
    private lateinit var kind: ForecastKind
    private var pending: Pair<String, Boolean>? = null // (serverId, adjust) shown in the preview, ready to confirm

    private lateinit var titleView: TextView
    private lateinit var previewContainer: FrameLayout
    private lateinit var container: LinearLayout // holds the tappable rows
    private lateinit var confirmButton: TextView

    private val dark: Boolean
        get() = resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK == Configuration.UI_MODE_NIGHT_YES

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

        val className = AppWidgetManager.getInstance(this).getAppWidgetInfo(appWidgetId)?.provider?.className
        kind = when {
            className?.endsWith("EvccSolarWidgetReceiver") == true -> ForecastKind.SOLAR
            className?.endsWith("EvccPriceWidgetReceiver") == true -> ForecastKind.PRICE
            className?.endsWith("EvccCo2WidgetReceiver") == true -> ForecastKind.CO2
            else -> ForecastKind.FEEDIN
        }

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
        previewContainer = FrameLayout(this).apply {
            setPadding(dp(20), 0, dp(20), dp(4))
            visibility = View.GONE
        }
        container = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        val scroll = ScrollView(this).apply {
            layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f)
            addView(container)
        }
        confirmButton = TextView(this).apply {
            text = "Use this"
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
            setTypeface(typeface, Typeface.BOLD)
            gravity = Gravity.CENTER
            setPadding(dp(20), dp(16), dp(20), dp(16))
            setBackgroundColor(0xFF0FDE41.toInt())
            visibility = View.GONE
            setOnClickListener { pending?.let { (serverId, adjust) -> save(serverId, adjust) } }
        }
        root.addView(titleView)
        root.addView(previewContainer)
        root.addView(scroll)
        root.addView(confirmButton)
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
            servers.size == 1 -> onServer(servers[0])
            else -> setRows(servers.map { it.displayTitle }) { index -> onServer(servers[index]) }
        }
    }

    private fun onServer(server: StoredServer) {
        if (kind == ForecastKind.SOLAR) showAdjust(server) else preview(server, adjust = true)
    }

    private fun showAdjust(server: StoredServer) {
        titleView.text = "Adjust to real production?"
        setRows(listOf("Yes (recommended)", "No")) { index -> preview(server, adjust = index == 0) }
    }

    /** Fetches live data for the chosen server (+ adjust setting) and shows a preview of the real widget. */
    private fun preview(server: StoredServer, adjust: Boolean) {
        pending = null
        confirmButton.visibility = View.GONE
        showPreview(WidgetPreview.message(this, "Loading preview…", dark))
        scope.launch {
            val state = withContext(Dispatchers.IO) { loadForecastState(this@ForecastWidgetConfigActivity, kind, server, adjust) }
            if (state !is ForecastState.Data) {
                showPreview(WidgetPreview.message(this@ForecastWidgetConfigActivity, "Couldn't load a preview", dark))
                return@launch
            }
            showPreview(WidgetPreview.forecast(this@ForecastWidgetConfigActivity, kind, state, dark))
            pending = server.id to adjust
            confirmButton.visibility = View.VISIBLE
        }
    }

    private fun showPreview(view: View) {
        previewContainer.removeAllViews()
        previewContainer.addView(view)
        previewContainer.visibility = View.VISIBLE
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
