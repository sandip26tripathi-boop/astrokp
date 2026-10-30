package com.example.kp

import java.util.Date

/**
 * 12 Zodiac Signs in Astrology
 */
enum class ZodiacSign(
    val signName: String,
    val hindiName: String,
    val lord: String,
    val element: String
) {
    ARIES("Aries", "मेष", "Mars", "Fire"),
    TAURUS("Taurus", "वृषभ", "Venus", "Earth"),
    GEMINI("Gemini", "मिथुन", "Mercury", "Air"),
    CANCER("Cancer", "कर्क", "Moon", "Water"),
    LEO("Leo", "सिंह", "Sun", "Fire"),
    VIRGO("Virgo", "कन्या", "Mercury", "Earth"),
    LIBRA("Libra", "तुला", "Venus", "Air"),
    SCORPIO("Scorpio", "वृश्चिक", "Mars", "Water"),
    SAGITTARIUS("Sagittarius", "धनु", "Jupiter", "Fire"),
    CAPRICORN("Capricorn", "मकर", "Saturn", "Earth"),
    AQUARIUS("Aquarius", "कुंभ", "Saturn", "Air"),
    PISCES("Pisces", "मीन", "Jupiter", "Water");

    companion object {
        fun fromDegree(degree: Double): ZodiacSign {
            val normalized = (degree % 360 + 360) % 360
            val index = (normalized / 30.0).toInt().coerceIn(0, 11)
            return entries[index]
        }

        fun fromOrdinal(ordinal: Int): ZodiacSign {
            val idx = (ordinal % 12 + 12) % 12
            return entries[idx]
        }
    }
}

/**
 * Planetary Body details in KP / Vedic System
 */
data class KPPlanet(
    val name: String,
    val hindiName: String,
    val totalDegree: Double,
    val signDegree: Double,
    val sign: ZodiacSign,
    val signLord: String,
    val starName: String,
    val starLord: String,
    val subLord: String,
    val subSubLord: String,
    val houseOccupied: Int,
    val housesOwned: List<Int>,
    val nakshatraPada: Int = 1,
    val navamshaSign: ZodiacSign = ZodiacSign.ARIES,
    val isRetrograde: Boolean = false,
    val starLordIsRetrograde: Boolean = false,
    val isCombust: Boolean = false
)

/**
 * Placidus Cusp details in KP System
 */
data class KPCusp(
    val houseNumber: Int,
    val totalDegree: Double,
    val signDegree: Double,
    val sign: ZodiacSign,
    val signLord: String,
    val starName: String,
    val starLord: String,
    val subLord: String,
    val subSubLord: String,
    val navamshaSign: ZodiacSign = ZodiacSign.ARIES,
    val starLordIsRetrograde: Boolean = false
)

/**
 * Complete Panchang Birth Details (Tithi, Vara, Nakshatra, Pada, Yoga, Karana)
 */
data class PanchangData(
    val tithiName: String,
    val hindiTithiName: String,
    val varaName: String,
    val hindiVaraName: String,
    val nakshatraName: String,
    val nakshatraPada: Int,
    val yogaName: String,
    val karanaName: String,
    val sunSign: ZodiacSign,
    val moonSign: ZodiacSign,
    val lagnaSign: ZodiacSign,
    val sunriseTime: String,
    val sunsetTime: String
)

/**
 * 4-Fold Significators Hierarchy according to KP principles
 */
data class Significator4Fold(
    val houseNumber: Int,
    val level1Planets: List<String>,
    val level2Planets: List<String>,
    val level3Planets: List<String>,
    val level4Planets: List<String>
)

/**
 * Vimshottari Dasha period details
 */
data class DashaPeriod(
    val mahaDashaLord: String,
    val antardashaLord: String,
    val pratyantardashaLord: String,
    val startDate: Date,
    val endDate: Date,
    val isCurrent: Boolean = false
)

/**
 * Real-Time Ruling Planets (RP) HUD
 */
data class RulingPlanets(
    val dayLord: String,
    val lagnaSignLord: String,
    val lagnaStarLord: String,
    val lagnaSubLord: String,
    val moonSignLord: String,
    val moonStarLord: String,
    val moonSubLord: String,
    val rahuKetuAgents: Map<String, String> = emptyMap(),
    val timestamp: String
)

/**
 * Horary / Prashna seed details (1 to 249)
 */
data class HorarySeed(
    val number: Int,
    val sign: ZodiacSign,
    val signLord: String,
    val starLord: String,
    val subLord: String,
    val startDegree: Double,
    val endDegree: Double
)

/**
 * Probability & Analysis for Event Categories
 */
enum class EventCategory(
    val title: String,
    val hindiTitle: String,
    val primaryFavorableHouses: List<Int>,
    val secondaryFavorableHouses: List<Int>,
    val negatingHouses: List<Int>
) {
    CAREER("Career & Promotion", "करियर एवं पदोन्नति", listOf(2, 6, 10, 11), listOf(7, 9), listOf(1, 5, 9)),
    MARRIAGE("Marriage & Union", "विवाह एवं संबंध", listOf(2, 7, 11), listOf(5), listOf(1, 6, 10)),
    PROPERTY("Property & Vehicle", "संपत्ति एवं वाहन", listOf(4, 11), listOf(2, 9), listOf(3, 12)),
    FOREIGN_TRAVEL("Foreign Travel & Settlement", "विदेश यात्रा एवं निवास", listOf(3, 9, 12), listOf(11), listOf(2, 4, 11)),
    FINANCE("Wealth & Inflow", "धन एवं संपत्ति", listOf(2, 6, 11), listOf(1, 10), listOf(5, 8, 12)),
    HEALTH("Health & Recovery", "स्वास्थ्य एवं दीर्घायु", listOf(1, 5, 11), listOf(9), listOf(6, 8, 12)),
    EDUCATION("Education & Academics", "शिक्षा एवं ज्ञान", listOf(4, 9, 11), listOf(5), listOf(3, 8));
}

data class EventScore(
    val category: EventCategory,
    val probabilityPercentage: Int,
    val statusText: String,
    val primarySubLord: String,
    val primarySubLordStarLord: String,
    val supportingHousesActive: List<Int>,
    val negatingHousesActive: List<Int>,
    val dashaSupportText: String,
    val recommendationSummary: String
)

/**
 * Chart Input payload
 */
data class ChartInput(
    val name: String = "User",
    val year: Int = 1995,
    val month: Int = 6, // 1..12
    val day: Int = 15,
    val hour: Int = 10,
    val minute: Int = 30,
    val second: Int = 0,
    val latitude: Double = 28.6139, // Default: New Delhi
    val longitude: Double = 77.2090,
    val timezoneOffsetHours: Double = 5.5,
    val locationName: String = "New Delhi, India",
    val horarySeedNumber: Int = 0 // 0 means Birth Details; 1..249 means Horary/Prashna
)

/**
 * GeoPlace location model for global city search
 */
data class GeoPlace(
    val cityName: String,
    val stateOrCountry: String,
    val latitude: Double,
    val longitude: Double,
    val timezoneOffsetHours: Double
) {
    val displayName: String get() = "$cityName, $stateOrCountry"
}

/**
 * Pars Fortuna details
 */
data class ParsFortuna(
    val totalDegree: Double,
    val sign: ZodiacSign,
    val starLord: String,
    val subLord: String
)

/**
 * BTR (Birth Time Rectification) Result
 */
data class BTRResult(
    val originalAscSubLord: String,
    val matchingRulingPlanets: List<String>,
    val suggestedAdjustmentSeconds: Int,
    val correctedAscSubLord: String,
    val confidenceScore: Int
)

/**
 * KP Logical Remedy
 */
data class KPRemedy(
    val planet: String,
    val gemstone: String,
    val colorTherapy: String,
    val donationItem: String,
    val mantra: String,
    val favorableDirection: String
)
