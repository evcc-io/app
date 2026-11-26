package io.evcc.wear

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PhoneIphone
import androidx.compose.material.icons.filled.WifiOff
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.Chip
import androidx.wear.compose.material.ChipDefaults
import androidx.wear.compose.material.Icon
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.material.Text
import java.text.DateFormat
import java.util.Date

/** One energy-flow row on the overview page: icon, label, value, optional detail. */
@Composable
fun FlowRow(symbol: ImageVector, color: Color, label: String, watts: Double, detail: String? = null) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(symbol, contentDescription = null, tint = color, modifier = Modifier.padding(end = 8.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(label, style = MaterialTheme.typography.caption2, color = MaterialTheme.colors.onSurfaceVariant)
            Row {
                Text(Format.fmtW(watts), fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.body2)
                if (detail != null) {
                    Text(
                        " $detail",
                        style = MaterialTheme.typography.caption2,
                        color = MaterialTheme.colors.onSurfaceVariant,
                    )
                }
            }
        }
    }
}

/** One mode-selector chip. Opaque background so a translucent fill wouldn't
 *  pick up the page's tinted background (ported rule from the iOS layout). */
@Composable
fun ModeChip(label: String, selected: Boolean, accent: Color, enabled: Boolean, onClick: () -> Unit) {
    Chip(
        onClick = onClick,
        enabled = enabled,
        label = { Text(label, fontWeight = FontWeight.SemiBold, fontSize = 13.sp) },
        colors = if (selected) {
            ChipDefaults.chipColors(backgroundColor = accent, contentColor = Color.Black)
        } else {
            ChipDefaults.chipColors(backgroundColor = Color(0xFF2A2A2C), contentColor = Color(0xFF9A9A9A))
        },
        modifier = Modifier.fillMaxWidth(),
    )
}

/** "Unreachable since <time>" footer, shown under stale data. */
@Composable
fun StaleFooter(unreachable: Boolean, lastUpdateMillis: Long?) {
    if (!unreachable || lastUpdateMillis == null) return
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.Start) {
        Icon(
            Icons.Filled.WifiOff,
            contentDescription = null,
            tint = MaterialTheme.colors.onSurfaceVariant,
            modifier = Modifier.padding(end = 4.dp),
        )
        Text(
            DateFormat.getTimeInstance(DateFormat.SHORT).format(Date(lastUpdateMillis)),
            style = MaterialTheme.typography.caption2,
            color = MaterialTheme.colors.onSurfaceVariant,
        )
    }
}

/** Centered icon + title + message, used for "unreachable" and "no server synced". */
@Composable
fun MessageScreen(
    title: String,
    message: String,
    icon: ImageVector = Icons.Filled.WifiOff,
) {
    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Icon(icon, contentDescription = null, tint = MaterialTheme.colors.onSurfaceVariant)
        Text(title, style = MaterialTheme.typography.title3, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 6.dp))
        Text(
            message,
            style = MaterialTheme.typography.caption1,
            color = MaterialTheme.colors.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(top = 2.dp),
        )
    }
}

/** No server synced from the phone yet. Mirrors EmptyStateView (Swift). */
@Composable
fun EmptyStateScreen() {
    MessageScreen(
        title = stringResource(R.string.wear_empty_title),
        message = stringResource(R.string.wear_empty_body),
        icon = Icons.Filled.PhoneIphone,
    )
}
