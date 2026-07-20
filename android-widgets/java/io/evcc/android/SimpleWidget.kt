class SimpleWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {

        for (appWidgetId in appWidgetIds) {

            val views = RemoteViews(
                context.packageName,
                R.layout.simple_widget
            )

            views.setTextViewText(
                R.id.widgetText,
                "Hallo Android!"
            )

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
