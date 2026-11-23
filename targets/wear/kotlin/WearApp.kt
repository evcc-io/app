package io.evcc.wear

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Dns
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.wear.compose.foundation.ExperimentalWearFoundationApi
import androidx.wear.compose.foundation.lazy.rememberScalingLazyListState
import androidx.wear.compose.foundation.pager.HorizontalPager
import androidx.wear.compose.foundation.pager.rememberPagerState
import androidx.wear.compose.material.Chip
import androidx.wear.compose.material.ChipDefaults
import androidx.wear.compose.material.Icon
import androidx.wear.compose.material.PositionIndicator
import androidx.wear.compose.material.Scaffold
import androidx.wear.compose.material.Text
import androidx.wear.compose.material.TimeText
import androidx.wear.compose.material.Vignette
import androidx.wear.compose.material.VignettePosition
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Top-level screen: a swipeable pager over the site overview and one page per
 * loadpoint (connected loadpoints first, same rule as the iOS watch app's
 * `connectedFirst`), plus a server switcher when more than one server is
 * synced from the phone. Mirrors ContentView (Swift) in evcc-io/app#349.
 */
@OptIn(ExperimentalWearFoundationApi::class)
@Composable
fun WearApp(viewModel: SiteViewModel = viewModel()) {
    val serverState by viewModel.serverState.collectAsStateWithLifecycle()
    val site by viewModel.site.collectAsStateWithLifecycle()
    val unreachable by viewModel.unreachable.collectAsStateWithLifecycle()
    val lastUpdate by viewModel.lastUpdate.collectAsStateWithLifecycle()
    val pendingModes by viewModel.pendingModes.collectAsStateWithLifecycle()
    val modeFailed by viewModel.modeFailed.collectAsStateWithLifecycle()

    if (serverState.servers.isEmpty()) {
        EmptyStateScreen()
        return
    }

    var showServerPicker by remember { mutableStateOf(false) }
    if (showServerPicker) {
        ServerPickerScreen(
            servers = serverState.servers,
            selectedId = serverState.selected?.id,
            onSelect = { id ->
                viewModel.selectServer(id)
                showServerPicker = false
            },
        )
        return
    }

    // Connected loadpoints first, offset kept as the real API index for mode POSTs.
    val loadpoints = (site?.loadpoints ?: emptyList()).withIndex().active()
        .sortedByDescending { it.value.connected == true }

    val pagerState = rememberPagerState(pageCount = { 1 + loadpoints.size })
    val scope = rememberCoroutineScope()

    Box(modifier = Modifier.fillMaxSize()) {
        HorizontalPager(state = pagerState, modifier = Modifier.fillMaxSize()) { page ->
            val listState = rememberScalingLazyListState()
            Scaffold(
                timeText = { TimeText() },
                vignette = { Vignette(vignettePosition = VignettePosition.TopAndBottom) },
                positionIndicator = { PositionIndicator(scalingLazyListState = listState) },
            ) {
                if (page == 0) {
                    Box(modifier = Modifier.fillMaxSize()) {
                        OverviewScreen(site, unreachable, lastUpdate, listState)
                        if (serverState.servers.size > 1) {
                            Chip(
                                onClick = { showServerPicker = true },
                                label = { Text(serverState.selected?.displayTitle ?: "") },
                                icon = { Icon(Icons.Filled.Dns, contentDescription = stringResource(R.string.widget_config_server)) },
                                colors = ChipDefaults.secondaryChipColors(),
                                modifier = Modifier.align(Alignment.TopCenter),
                            )
                        }
                    }
                } else {
                    val (index, loadpoint) = loadpoints[page - 1]
                    LoadpointScreen(
                        loadpoint = loadpoint,
                        index = index,
                        pendingMode = pendingModes[index],
                        unreachable = unreachable,
                        lastUpdateMillis = lastUpdate,
                        listState = listState,
                        onSetMode = { i, mode -> scope.launch { viewModel.setMode(i, mode) } },
                    )
                }
            }
        }

        if (modeFailed) {
            LaunchedEffect(Unit) {
                delay(2500)
                viewModel.modeFailedAcknowledged()
            }
            Chip(
                onClick = { viewModel.modeFailedAcknowledged() },
                label = { Text(stringResource(R.string.wear_modeFailed)) },
                colors = ChipDefaults.chipColors(backgroundColor = Color(Theme.EVCC_ORANGE)),
                modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 8.dp),
            )
        }
    }
}
