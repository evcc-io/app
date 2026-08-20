package io.evcc.android.widget

import android.app.Activity
import android.appwidget.AppWidgetManager
import android.content.Intent
import android.content.res.Configuration
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.util.TypedValue
import android.view.View
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.glance.appwidget.GlanceAppWidgetManager
import io.evcc.android.R
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Widget placement configuration: pick a server, then a loadpoint. Stores the
 * choice in the widget's per-instance config (read back by LoadpointWidget).
 * Tapping a loadpoint fetches its live data and shows a preview of the actual
 * widget (see WidgetPreview) before committing via the "Use this loadpoint"
 * button, so placement is a pick-and-confirm flow rather than pick-and-commit.
 *
 * Uses classic Views (not Compose) so it needs no dependencies beyond Glance -
 * the RN app is not otherwise a Compose app. Rows are built explicitly (not via
 * a ListView) so each row's click captures its own index directly - a ListView
 * adapter's onItemClick position is unreliable around the async loadpoint load.
 */
class LoadpointWidgetConfigActivity : Activity() {
    private val scope = MainScope()
    private var appWidgetId = AppWidgetManager.INVALID_APPWIDGET_ID
    private var pending: Pair<String, Int>? = null // (serverId, lpIndex) shown in the preview, ready to confirm

    private lateinit var titleView: TextView
    private lateinit var previewContainer: FrameLayout
    private lateinit var container: LinearLayout // holds the tappable rows
    private lateinit var confirmButton: TextView

    private val dark: Boolean
        get() = resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK == Configuration.UI_MODE_NIGHT_YES

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
        previewContainer = FrameLayout(this).apply {
            setPadding(dp(20), 0, dp(20), dp(4))
            visibility = View.GONE
        }
        container = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        val scroll = ScrollView(this).apply {
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f,
            )
            addView(container)
        }
        confirmButton = TextView(this).apply {
            text = getString(R.string.widget_androidConfig_useThisLoadpoint)
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
            setTypeface(typeface, Typeface.BOLD)
            gravity = android.view.Gravity.CENTER
            setPadding(dp(20), dp(16), dp(20), dp(16))
            setBackgroundColor(0xFF0FDE41.toInt())
            visibility = View.GONE
            setOnClickListener { pending?.let { (serverId, lpIndex) -> save(serverId, lpIndex) } }
        }
        root.addView(titleView)
        root.addView(previewContainer)
        root.addView(scroll)
        root.addView(confirmButton)
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
        titleView.text = getString(R.string.widget_androidConfig_chooseServer)
        val servers = SharedStore.servers(this)
        when {
            servers.isEmpty() ->
                setRows(listOf(getString(R.string.widget_androidConfig_noServers)), null)
            // only one server: nothing to choose, go straight to its loadpoints
            servers.size == 1 -> showLoadpoints(servers[0])
            else -> setRows(servers.map { it.displayTitle }) { index -> showLoadpoints(servers[index]) }
        }
    }

    private fun showLoadpoints(server: StoredServer) {
        titleView.text = getString(R.string.widget_androidConfig_chooseLoadpoint)
        setRows(listOf(getString(R.string.widget_androidConfig_loading)), null)
        scope.launch {
            val titles = withContext(Dispatchers.IO) { ApiClient.loadpointTitles(server) }
            if (titles.isEmpty()) {
                setRows(listOf(getString(R.string.widget_androidConfig_noLoadpoints)), null)
                return@launch
            }
            setRows(titles) { index -> preview(server, index) }
        }
    }

    /** Fetches the tapped loadpoint's live data and shows a preview of the real widget. */
    private fun preview(server: StoredServer, lpIndex: Int) {
        pending = null
        confirmButton.visibility = View.GONE
        showPreview(WidgetPreview.message(this, getString(R.string.widget_androidConfig_loadingPreview), dark))
        scope.launch {
            val lp = withContext(Dispatchers.IO) {
                (ApiClient.fetch(server, ".loadpoints[$lpIndex]") as? FetchOutcome.Success)?.json?.let { Loadpoint.parse(it) }
            }
            if (lp == null) {
                showPreview(
                    WidgetPreview.message(
                        this@LoadpointWidgetConfigActivity,
                        getString(R.string.widget_androidConfig_previewError),
                        dark,
                    ),
                )
                return@launch
            }
            showPreview(WidgetPreview.loadpoint(this@LoadpointWidgetConfigActivity, lp, dark))
            pending = server.id to lpIndex
            confirmButton.visibility = View.VISIBLE
        }
    }

    private fun showPreview(view: View) {
        previewContainer.removeAllViews()
        previewContainer.addView(view)
        previewContainer.visibility = View.VISIBLE
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
