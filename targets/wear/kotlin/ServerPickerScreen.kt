package io.evcc.wear

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.foundation.lazy.items
import androidx.wear.compose.material.Chip
import androidx.wear.compose.material.ChipDefaults
import androidx.wear.compose.material.Icon
import androidx.wear.compose.material.ListHeader
import androidx.wear.compose.material.Text

/** Server switcher, shown when more than one server is synced from the phone.
 *  Mirrors ServerPicker (Swift) in the iOS watch app (evcc-io/app#349). */
@Composable
fun ServerPickerScreen(servers: List<SyncedServer>, selectedId: String?, onSelect: (String) -> Unit) {
    ScalingLazyColumn(modifier = Modifier.fillMaxSize()) {
        item { ListHeader { Text(stringResource(R.string.widget_config_server)) } }
        items(servers.size) { i ->
            val server = servers[i]
            Chip(
                onClick = { onSelect(server.id) },
                label = { Text(server.displayTitle, maxLines = 2) },
                icon = if (server.id == selectedId) {
                    { Icon(Icons.Filled.Check, contentDescription = null) }
                } else null,
                colors = ChipDefaults.secondaryChipColors(),
            )
        }
    }
}
