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
import androidx.glance.appwidget.GlanceAppWidgetManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Widget placement configuration: pick a server, then a loadpoint. Stores the
 * choice in the widget's per-instance config (read back by LoadpointWidget).
 *
 * Uses classic Views (not Compose) so it needs no dependencies beyond Glance -
 * the RN app is not otherwise a Compose app. Rows are built explicitly (not via
 * a ListView) so each row's click captures its own index directly - a ListView
 * adapter's onItemClick position is unreliable around the async loadpoint load.
 */
class LoadpointWidgetConfigActivity : Activity() {
    private val scope = MainScope()
    private var appWidgetId = AppWidgetManager.INVALID_APPWIDGET_ID

    private lateinit var titleView: TextView
    private lateinit var container: LinearLayout // holds the tappable rows

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // backing out without a choice must cancel the placement
        setResult(RESULT_CANCELED)

        appWidgetId = intent?.extras?.getInt(
            AppWidgetManager.EXTRA_APPWIDGET_ID,
            AppWidgetManager.INVALID_APPWIDGET_ID,
        ) ?: AppWidgetManager.INVALID_APPWIDGET_ID
        if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            finish()
            return
        }

        setContentView(buildLayout())
        showServers()
    }

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
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f,
            )
            addView(container)
        }
        root.addView(titleView)
        root.addView(scroll)
        return root
    }

    /**
     * Rebuild the row list. Each row owns a click listener that captures its
     * index via the loop, so a tap always maps to the item it visually is -
     * unlike a shared ListView adapter whose reported position can be stale.
     */
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

    private fun showServers() {
        titleView.text = "Choose server"
        val servers = SharedStore.servers(this)
        when {
            servers.isEmpty() ->
                setRows(listOf("No servers — add one in the app first"), null)
            // only one server: nothing to choose, go straight to its loadpoints
            servers.size == 1 -> showLoadpoints(servers[0])
            else -> setRows(servers.map { it.displayTitle }) { index -> showLoadpoints(servers[index]) }
        }
    }

    private fun showLoadpoints(server: StoredServer) {
        titleView.text = "Choose loadpoint"
        setRows(listOf("Loading…"), null)
        scope.launch {
            val titles = withContext(Dispatchers.IO) { ApiClient.loadpointTitles(server) }
            if (titles.isEmpty()) {
                setRows(listOf("No loadpoints reachable"), null)
                return@launch
            }
            setRows(titles) { index -> save(server.id, index) }
        }
    }

    private fun save(serverId: String, lpIndex: Int) {
        // write synchronously (plain SharedPreferences) before the widget renders
        WidgetConfig.save(this, appWidgetId, serverId, lpIndex)
        scope.launch {
            val glanceId = GlanceAppWidgetManager(applicationContext).getGlanceIdBy(appWidgetId)
            LoadpointWidget().update(applicationContext, glanceId)
            setResult(
                RESULT_OK,
                Intent().putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId),
            )
            finish()
        }
    }
}
