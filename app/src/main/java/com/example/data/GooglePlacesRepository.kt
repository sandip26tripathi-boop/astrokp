package com.example.data

import android.util.Log
import com.example.BuildConfig
import com.example.kp.GeoPlace
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.util.concurrent.TimeUnit

data class PlacePrediction(
    val placeId: String,
    val primaryText: String,
    val secondaryText: String,
    val description: String,
    val isGooglePlacesResult: Boolean = true
)

class GooglePlacesRepository {

    private val httpClient by lazy {
        OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .build()
    }

    private val apiKey: String
        get() = BuildConfig.GOOGLE_PLACES_API_KEY

    val isApiKeyConfigured: Boolean
        get() = apiKey.isNotBlank() && apiKey != "MY_GOOGLE_PLACES_API_KEY"

    /**
     * Search Autocomplete Predictions using Google Places API
     */
    suspend fun getPlacePredictions(query: String): List<PlacePrediction> = withContext(Dispatchers.IO) {
        if (query.isBlank()) return@withContext emptyList()

        if (isApiKeyConfigured) {
            try {
                val url = "https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${java.net.URLEncoder.encode(query, "UTF-8")}&types=(cities)&key=$apiKey"
                val request = Request.Builder().url(url).build()
                val response = httpClient.newCall(request).execute()
                val responseString = response.body?.string().orEmpty()

                if (response.isSuccessful && responseString.isNotBlank()) {
                    val json = JSONObject(responseString)
                    val status = json.optString("status")
                    if (status == "OK" || status == "ZERO_RESULTS") {
                        val predictionsArray = json.optJSONArray("predictions")
                        if (predictionsArray != null && predictionsArray.length() > 0) {
                            val list = mutableListOf<PlacePrediction>()
                            for (i in 0 until predictionsArray.length()) {
                                val item = predictionsArray.getJSONObject(i)
                                val placeId = item.optString("place_id")
                                val description = item.optString("description")
                                val structured = item.optJSONObject("structured_formatting")
                                val primaryText = structured?.optString("main_text") ?: description
                                val secondaryText = structured?.optString("secondary_text") ?: ""

                                list.add(
                                    PlacePrediction(
                                        placeId = placeId,
                                        primaryText = primaryText,
                                        secondaryText = secondaryText,
                                        description = description,
                                        isGooglePlacesResult = true
                                    )
                                )
                            }
                            return@withContext list
                        }
                    } else {
                        Log.w("GooglePlaces", "Autocomplete API status: $status")
                    }
                }
            } catch (e: Exception) {
                Log.e("GooglePlaces", "Autocomplete query failed: ${e.message}")
            }
        }

        // Fallback to Offline GeoPlaceDatabase
        return@withContext GeoPlaceDatabase.searchPlaces(query).map { place ->
            PlacePrediction(
                placeId = "OFFLINE_${place.cityName}",
                primaryText = place.cityName,
                secondaryText = place.stateOrCountry,
                description = place.displayName,
                isGooglePlacesResult = false
            )
        }
    }

    /**
     * Resolve exact Latitude, Longitude, and Timezone for a selected place
     */
    suspend fun resolvePlaceDetails(prediction: PlacePrediction): GeoPlace? = withContext(Dispatchers.IO) {
        if (!prediction.isGooglePlacesResult || prediction.placeId.startsWith("OFFLINE_")) {
            // Match in offline DB
            return@withContext GeoPlaceDatabase.GLOBAL_PLACES.find {
                it.cityName.equals(prediction.primaryText, ignoreCase = true) ||
                        it.displayName.equals(prediction.description, ignoreCase = true)
            } ?: GeoPlace(
                cityName = prediction.primaryText,
                stateOrCountry = prediction.secondaryText.ifBlank { "India" },
                latitude = 28.6139,
                longitude = 77.2090,
                timezoneOffsetHours = 5.5
            )
        }

        if (isApiKeyConfigured) {
            try {
                val detailsUrl = "https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.placeId}&fields=name,geometry,utc_offset&key=$apiKey"
                val request = Request.Builder().url(detailsUrl).build()
                val response = httpClient.newCall(request).execute()
                val responseString = response.body?.string().orEmpty()

                if (response.isSuccessful && responseString.isNotBlank()) {
                    val json = JSONObject(responseString)
                    val result = json.optJSONObject("result")
                    if (result != null) {
                        val name = result.optString("name", prediction.primaryText)
                        val geometry = result.optJSONObject("geometry")
                        val location = geometry?.optJSONObject("location")
                        val lat = location?.optDouble("lat", 28.6139) ?: 28.6139
                        val lng = location?.optDouble("lng", 77.2090) ?: 77.2090

                        val utcOffsetMin = result.optInt("utc_offset", 330) // Default 330 min = +5.5h
                        val tzOffsetHours = utcOffsetMin / 60.0

                        return@withContext GeoPlace(
                            cityName = name,
                            stateOrCountry = prediction.secondaryText.ifBlank { "Google Places Resolved" },
                            latitude = lat,
                            longitude = lng,
                            timezoneOffsetHours = tzOffsetHours
                        )
                    }
                }
            } catch (e: Exception) {
                Log.e("GooglePlaces", "Place details fetch failed: ${e.message}")
            }
        }

        return@withContext null
    }
}
