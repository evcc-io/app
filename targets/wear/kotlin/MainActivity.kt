package io.evcc.wear

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.compose.runtime.DisposableEffect

/**
 * Entry point: the server list comes from the phone (see
 * [WatchSyncListenerService]), so there's no on-watch setup beyond picking a
 * server when more than one is synced. Counterpart of WatchApp.swift in the
 * iOS watch app (evcc-io/app#349).
 */
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            EvccWearTheme {
                val viewModel: SiteViewModel = viewModel()
                val lifecycleOwner = LocalLifecycleOwner.current
                DisposableEffect(lifecycleOwner) {
                    val observer = LifecycleEventObserver { _, event ->
                        when (event) {
                            Lifecycle.Event.ON_RESUME -> viewModel.setActive(true)
                            Lifecycle.Event.ON_PAUSE -> viewModel.setActive(false)
                            else -> Unit
                        }
                    }
                    lifecycleOwner.lifecycle.addObserver(observer)
                    onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
                }
                WearApp(viewModel)
            }
        }
    }
}
