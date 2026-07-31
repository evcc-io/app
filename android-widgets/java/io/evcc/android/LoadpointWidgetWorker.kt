package io.evcc.android

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.widget.RemoteViews
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import java.io.IOException

class LoadpointWidgetWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        return try {
            val data = LoadpointApi.getLoadpointData()

            updateWidgets(data)

            Result.success()
        } catch (exception: IOException) {
            Result.retry()
        } catch (exception: Exception) {
            exception.printStackTrace()

            showError()

            Result.failure()
        }
    }

    private fun updateWidgets(data: LoadpointData) {
        val context = applicationContext
        val appWidgetManager = AppWidgetManager.getInstance(context)

        val componentName = ComponentName(
            context,
            LoadpointWidget::class.java
        )

        val widgetIds = appWidgetManager.getAppWidgetIds(componentName)

        widgetIds.forEach { widgetId ->
            val views = RemoteViews(
                context.packageName,
                R.layout.widget_empty
            )

            views.setTextViewText(
                R.id.widget_title,
                data.title
            )

            views.setTextViewText(
                R.id.widget_power,
                "${data.power.toInt()} W"
            )

            appWidgetManager.updateAppWidget(widgetId, views)
        }
    }

    private fun showError() {
        val context = applicationContext
        val appWidgetManager = AppWidgetManager.getInstance(context)

        val componentName = ComponentName(
            context,
            LoadpointWidget::class.java
        )

        val widgetIds = appWidgetManager.getAppWidgetIds(componentName)

        widgetIds.forEach { widgetId ->
            val views = RemoteViews(
                context.packageName,
                R.layout.widget_empty
            )

            views.setTextViewText(
                R.id.widget_title,
                "API nicht erreichbar"
            )

            views.setTextViewText(
                R.id.widget_power,
                "-- W"
            )

            appWidgetManager.updateAppWidget(widgetId, views)
        }
    }
}