package io.evcc.android

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews

class LoadpointWidget : AppWidgetProvider() {

    override fun onEnabled(context: Context) {
        super.onEnabled(context)

        // Wird ausgeführt, wenn die erste Widget-Instanz hinzugefügt wird.
        LoadpointWidgetScheduler.schedulePeriodicUpdate(context)
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        super.onUpdate(context, appWidgetManager, appWidgetIds)

        // Sofort einen Ladezustand anzeigen.
        appWidgetIds.forEach { widgetId ->
            val views = RemoteViews(
                context.packageName,
                R.layout.loadpoint
            )

            views.setTextViewText(
                R.id.widget_title,
                "Lade Daten …"
            )

            appWidgetManager.updateAppWidget(widgetId, views)
        }

        // Einmalige, möglichst zeitnahe API-Abfrage.
        LoadpointWidgetScheduler.updateImmediately(context)

        // Dank Unique Work entstehen keine doppelten periodischen Jobs.
        LoadpointWidgetScheduler.schedulePeriodicUpdate(context)
    }

    override fun onDisabled(context: Context) {
        super.onDisabled(context)

        // Wird aufgerufen, wenn die letzte Widget-Instanz entfernt wird.
        LoadpointWidgetScheduler.cancelPeriodicUpdate(context)
    }
}