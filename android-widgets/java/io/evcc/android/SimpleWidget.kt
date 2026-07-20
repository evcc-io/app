package io.evcc.android

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews

class SimpleWidget : AppWidgetProvider() {
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
    ) {
        for (appWidgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onDeleted(
        context: Context,
        appWidgetIds: IntArray,
    ) {
        val preferences = context.getSharedPreferences(
            PREFERENCES_NAME,
            Context.MODE_PRIVATE,
        )

        preferences.edit().apply {
            for (appWidgetId in appWidgetIds) {
                remove(serverKey(appWidgetId))
            }
        }.apply()
    }

    companion object {
        private const val PREFERENCES_NAME = "simple_widget"

        private fun serverKey(appWidgetId: Int) =
            "server_$appWidgetId"

        fun saveServerName(
            context: Context,
            appWidgetId: Int,
            serverName: String,
        ) {
            context
                .getSharedPreferences(
                    PREFERENCES_NAME,
                    Context.MODE_PRIVATE,
                )
                .edit()
                .putString(serverKey(appWidgetId), serverName)
                .apply()
        }

        fun getServerName(
            context: Context,
            appWidgetId: Int,
        ): String {
            return context
                .getSharedPreferences(
                    PREFERENCES_NAME,
                    Context.MODE_PRIVATE,
                )
                .getString(serverKey(appWidgetId), null)
                ?: context.getString(
                    R.string.simple_widget_default_server,
                )
        }

        fun updateWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int,
        ) {
            val views = RemoteViews(
                context.packageName,
                R.layout.simple_widget,
            )

            views.setTextViewText(
                R.id.widget_text,
                getServerName(context, appWidgetId),
            )

            appWidgetManager.updateAppWidget(
                appWidgetId,
                views,
            )
        }
    }
}