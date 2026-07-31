package io.evcc.android

import retrofit2.Response
import retrofit2.http.GET

interface LoadpointApiService {

    @GET("api/loadpoint")
    suspend fun getLoadpoint(): Response<LoadpointData>
}