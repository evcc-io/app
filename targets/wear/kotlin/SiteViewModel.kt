package io.evcc.wear

import android.app.Application
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import androidx.wear.tiles.TileService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/** Last known site state per server, so a short outage - or relaunching the app -
 *  shows stale values with their age instead of an empty screen. */
private object SiteCache {
    private val Application.cacheDataStore: DataStore<Preferences> by preferencesDataStore(name = "evcc_wear_site_cache")
    private fun jsonKey(id: String) = stringPreferencesKey("site.$id")
    private fun atKey(id: String) = longPreferencesKey("site.$id.at")

    suspend fun get(app: Application, serverId: String): Pair<SiteState, Long>? {
        val p = app.cacheDataStore.data.first()
        val json = p[jsonKey(serverId)] ?: return null
        val at = p[atKey(serverId)] ?: return null
        val state = SiteState.parse(json) ?: return null
        return state to at
    }

    suspend fun set(app: Application, serverId: String, json: String) {
        app.cacheDataStore.edit { p ->
            p[jsonKey(serverId)] = json
            p[atKey(serverId)] = System.currentTimeMillis()
        }
    }
}

/**
 * Polls the selected server (see [ServerStore]) every 10s while the app is in
 * the foreground, and performs optimistic mode switches. Mirrors SiteModel
 * (Swift) in the iOS watch app (evcc-io/app#349).
 */
class SiteViewModel(app: Application) : AndroidViewModel(app) {
    private val _site = MutableStateFlow<SiteState?>(null)
    val site: StateFlow<SiteState?> = _site

    private val _lastUpdate = MutableStateFlow<Long?>(null)
    val lastUpdate: StateFlow<Long?> = _lastUpdate

    private val _unreachable = MutableStateFlow(false)
    val unreachable: StateFlow<Boolean> = _unreachable

    private val _pendingModes = MutableStateFlow<Map<Int, String>>(emptyMap())
    val pendingModes: StateFlow<Map<Int, String>> = _pendingModes

    private val _modeFailed = MutableStateFlow(false)
    val modeFailed: StateFlow<Boolean> = _modeFailed
    fun modeFailedAcknowledged() { _modeFailed.value = false }

    val serverState: StateFlow<ServerStore.State> = ServerStore.flow(app)
        .stateIn(viewModelScope, SharingStarted.Eagerly, ServerStore.State(emptyList(), null, null))

    private var pollJob: Job? = null
    private var currentServerId: String? = null
    private var active = false
    private var reloadedTile = false

    init {
        viewModelScope.launch {
            serverState.map { it.selected }.distinctUntilChanged { a, b -> a?.id == b?.id }
                .collectLatest { server -> restartPolling(server) }
        }
    }

    fun setActive(isActive: Boolean) {
        if (active == isActive) return
        active = isActive
        restartPolling(serverState.value.selected)
    }

    fun selectServer(id: String?) {
        viewModelScope.launch { ServerStore.select(getApplication(), id) }
    }

    private fun restartPolling(server: SyncedServer?) {
        pollJob?.cancel()
        if (server == null) {
            currentServerId = null
            _site.value = null
            _unreachable.value = false
            return
        }
        if (server.id != currentServerId) {
            currentServerId = server.id
            _pendingModes.value = emptyMap()
            _unreachable.value = false
            reloadedTile = false
            viewModelScope.launch {
                val cached = SiteCache.get(getApplication(), server.id)
                _site.value = cached?.first
                _lastUpdate.value = cached?.second
            }
        }
        if (!active) return
        pollJob = viewModelScope.launch {
            while (true) {
                refresh(server)
                delay(POLL_INTERVAL_MS)
            }
        }
    }

    private suspend fun refresh(server: SyncedServer) {
        if (server.id != currentServerId) return
        val outcome = withContext(Dispatchers.IO) { ApiClient.site(server) }
        if (server.id != currentServerId) return
        when (outcome) {
            is FetchOutcome.Success -> {
                val parsed = SiteState.parse(outcome.json)
                if (parsed != null) {
                    _site.value = parsed
                    _lastUpdate.value = System.currentTimeMillis()
                    _unreachable.value = false
                    SiteCache.set(getApplication(), server.id, outcome.json)
                    if (!reloadedTile) {
                        reloadedTile = true
                        TileService.getUpdater(getApplication()).requestUpdate(LoadpointTileService::class.java)
                    }
                } else {
                    _unreachable.value = true
                }
            }
            FetchOutcome.NoData, FetchOutcome.Failure -> _unreachable.value = true
        }
    }

    /** Optimistic: shows the new mode right away, reverts on failure. */
    suspend fun setMode(index: Int, mode: String) {
        val server = serverState.value.selected ?: return
        _pendingModes.value = _pendingModes.value + (index to mode)
        val ok = withContext(Dispatchers.IO) { ApiClient.setMode(server, index, mode) }
        vibrate(success = ok)
        if (ok) {
            refresh(server)
            TileService.getUpdater(getApplication()).requestUpdate(LoadpointTileService::class.java)
        } else {
            _modeFailed.value = true
        }
        _pendingModes.value = _pendingModes.value - index
    }

    private fun vibrate(success: Boolean) {
        val app = getApplication<Application>()
        val vibrator = if (Build.VERSION.SDK_INT >= 31) {
            app.getSystemService(VibratorManager::class.java)?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            app.getSystemService(Vibrator::class.java)
        }
        runCatching {
            val effect = VibrationEffect.createPredefined(
                if (success) VibrationEffect.EFFECT_CLICK else VibrationEffect.EFFECT_DOUBLE_CLICK,
            )
            vibrator?.vibrate(effect)
        }
    }

    companion object {
        private const val POLL_INTERVAL_MS = 10_000L
    }
}
