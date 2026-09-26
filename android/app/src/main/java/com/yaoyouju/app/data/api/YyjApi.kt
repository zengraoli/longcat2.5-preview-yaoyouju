package com.yaoyouju.app.data.api

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query

interface YyjApi {

    @POST("/auth/login")
    suspend fun login(@Body body: Map<String, String>): ApiResponse<LoginData>

    @GET("/episodes")
    suspend fun getEpisodes(): ApiResponse<List<Episode>>

    @GET("/episodes/{id}/timeline")
    suspend fun getTimeline(@Query("episodeId") episodeId: String): ApiResponse<List<CareEvent>>

    @GET("/reports")
    suspend fun getReportsByEpisode(@Query("episodeId") episodeId: String): ApiResponse<List<Map<String, String?>>>

    @GET("/analyses/latest")
    suspend fun getLatestAnalysis(@Query("episodeId") episodeId: String): ApiResponse<Analysis>

    @POST("/followup/preview")
    suspend fun previewFollowup(@Body body: Map<String, String>): ApiResponse<FollowupPreview>

    @GET("/contents")
    suspend fun getPublishedContents(): ApiResponse<List<ContentItem>>
}
