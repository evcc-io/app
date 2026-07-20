package io.evcc.android

import android.app.Activity
import android.appwidget.AppWidgetManager
import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText

class SimpleWidgetConfigureActivity : Activity() {
    private var appWidgetId =
        AppWidgetManager.INVALID_APPWIDGET_ID

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setResult(RESULT_CANCELED)
        setContentView(R.layout.simple_widget_configure)

        appWidgetId = intent
            .getIntExtra(
                AppWidgetManager.EXTRA_APPWIDGET_ID,
                AppWidgetManager.INVALID_APPWIDGET_ID,
            )

        if (
            appWidgetId ==
            AppWidgetManager.INVALID_APPWIDGET_ID
        ) {
            finish()
            return
        }

        val serverInput =
            findViewById<EditText>(R.id.server_name_input)

        serverInput.setText(
            SimpleWidget.getServerName(this, appWidgetId),
        )

        findViewById<Button>(R.id.save_button)
            .setOnClickListener {
                val serverName = serverInput
                    .text
                    .toString()
                    .trim()
                    .ifEmpty {
                        getString(
                            R.string.simple_widget_default_server,
                        )
                    }

                SimpleWidget.saveServerName(
                    this,
                    appWidgetId,
                    serverName,
                )

                SimpleWidget.updateWidget(
                    this,
                    AppWidgetManager.getInstance(this),
                    appWidgetId,
                )

                val result = Intent().putExtra(
                    AppWidgetManager.EXTRA_APPWIDGET_ID,
                    appWidgetId,
                )

                setResult(RESULT_OK, result)
                finish()
            }
    }
}