package io.evcc.android

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.io.IOException

object LoadpointApi {

    private const val BASE_URL = "https://example.com/"

    private val service: LoadpointApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(LoadpointApiService::class.java)
    }

    /**
     * Lädt die Daten der API und gibt sie als LoadpointData zurück.
     *
     * @throws IOException bei Netzwerk-, HTTP- oder Antwortfehlern.
     */
    suspend fun getLoadpointData(): LoadpointData {
        val response = service.getLoadpoint()

        if (!response.isSuccessful) {
            throw IOException(
                "API-Fehler: HTTP ${response.code()} ${response.message()}"
            )
        }

        return response.body()
            ?: throw IOException("Die API hat keine Daten zurückgegeben.")
    }
}