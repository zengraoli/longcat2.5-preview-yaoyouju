package com.yaoyouju.app.data.api

import kotlinx.serialization.Serializable
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

@Serializable
data class ConsentRequest(val scopes: List<String>)

interface YyjApi {

    @POST("/auth/send-code")
    suspend fun sendCode(@Body body: Map<String, String>): ApiResponse<Map<String, Boolean>>


    @POST("/auth/login")
    suspend fun login(@Body body: Map<String, String>): ApiResponse<LoginData>

    @POST("/auth/consent")
    suspend fun grantConsent(@Body body: ConsentRequest): ApiResponse<Map<String, Boolean>>

    @GET("/episodes")
    suspend fun getEpisodes(): ApiResponse<List<Episode>>

    @POST("/episodes")
    suspend fun createEpisode(@Body body: Map<String, String>): ApiResponse<Map<String, String>>

    @POST("/episodes/events")
    suspend fun createCareEvent(@Body body: Map<String, String>): ApiResponse<Map<String, String>>

    @POST("/reports")
    suspend fun createReport(@Body body: Map<String, String>): ApiResponse<Map<String, String>>

    @GET("/episodes/{id}/timeline")
    suspend fun getTimeline(@Path("id") id: String): ApiResponse<List<CareEvent>>

    @GET("/reports")
    suspend fun getReportsByEpisode(@Query("episodeId") episodeId: String): ApiResponse<List<Map<String, String?>>>

    @GET("/reports/{id}/structured")
    suspend fun getStructuredReport(@Path("id") id: String): ApiResponse<StructuredReport>

    @GET("/analyses/latest")
    suspend fun getLatestAnalysis(@Query("episodeId") episodeId: String): ApiResponse<Analysis>

    @POST("/followup/preview")
    suspend fun previewFollowup(@Body body: Map<String, String>): ApiResponse<FollowupPreview>

    @POST("/followup/export")
    suspend fun exportFollowup(@Body body: Map<String, String>): ApiResponse<Map<String, String>>

    @POST("/qa/ask")
    suspend fun askQuestion(@Body body: Map<String, String>): ApiResponse<QaResult>

    @POST("/episodes/symptom-logs")
    suspend fun createSymptomLog(@Body body: Map<String, Any?>): ApiResponse<Map<String, String>>

    @DELETE("/episodes/events/{eventId}")
    suspend fun deleteCareEvent(@Path("eventId") eventId: String): ApiResponse<Map<String, Boolean>>

    @GET("/contents")
    suspend fun getPublishedContents(): ApiResponse<List<ContentItem>>
}
