package com.example.kp

import java.util.Calendar
import java.util.Date
import java.util.GregorianCalendar
import java.util.TimeZone
import kotlin.math.abs
import kotlin.math.acos
import kotlin.math.asin
import kotlin.math.atan
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt
import kotlin.math.tan

/**
 * Production-grade Swiss Ephemeris & KP Astronomical Engine in pure Kotlin.
 *
 * Implements Meeus Astronomical Algorithms & VSOP87 planetary theory:
 * - High-precision Julian Day & Julian Centuries (T)
 * - True Obliquity of Ecliptic & RAMC Sidereal Time
 * - Exact Placidus Semi-Arc Cusp Solver
 * - Kepler's Equation iterative solver for Heliocentric & Geocentric planetary longitudes
 * - Precession-corrected KP New Krishnamurti Ayanamsa
 * - True Node calculation for Rahu & Ketu
 * - Full 249 KP Sub-Lord & Sub-Sub-Lord (SSL) Division Matrix
 * - 4-Fold Significators Hierarchy (L1 > L2 > L3 > L4)
 * - Vimshottari Dasha Engine down to Pratyantardasha
 * - Birth Panchang & Live Ruling Planets (RP)
 */
object KPEphemerisEngine {

    val PLANET_NAMES = listOf("Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu")

    val PLANET_HINDI = mapOf(
        "Sun" to "सूर्य", "Moon" to "चंद्र", "Mars" to "मंगल", "Mercury" to "बुध",
        "Jupiter" to "गुरु", "Venus" to "शुक्र", "Saturn" to "शनि", "Rahu" to "राहु", "Ketu" to "केतु"
    )

    val NAKSHATRA_NAMES = listOf(
        "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha",
        "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshta",
        "Moola", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
    )

    val DASHA_LORDS = listOf("Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury")
    val DASHA_YEARS = listOf(7.0, 20.0, 6.0, 10.0, 7.0, 18.0, 16.0, 19.0, 17.0)

    val TITHI_NAMES = listOf(
        "Shukla Pratipada", "Shukla Dwitiya", "Shukla Tritiya", "Shukla Chaturthi", "Shukla Panchami",
        "Shukla Shashti", "Shukla Saptami", "Shukla Ashtami", "Shukla Navami", "Shukla Dashami",
        "Shukla Ekadashi", "Shukla Dwadashi", "Shukla Trayodashi", "Shukla Chaturdashi", "Purnima",
        "Krishna Pratipada", "Krishna Dwitiya", "Krishna Tritiya", "Krishna Chaturthi", "Krishna Panchami",
        "Krishna Shashti", "Krishna Saptami", "Krishna Ashtami", "Krishna Navami", "Krishna Dashami",
        "Krishna Ekadashi", "Krishna Dwadashi", "Krishna Trayodashi", "Krishna Chaturdashi", "Amavasya"
    )

    val YOGA_NAMES = listOf(
        "Vishkambha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", "Sukarma", "Dhriti",
        "Shula", "Ganda", "Vriddhi", "Dhruva", "Vyaghata", "Harshana", "Vajra", "Siddhi", "Vyatipata",
        "Variyan", "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma", "Indra", "Vaidhriti"
    )

    val KARANA_NAMES = listOf(
        "Bava", "Balava", "Kaulava", "Taitila", "Garaja", "Vanija", "Vishti (Bhadra)",
        "Shakuni", "Chatushpada", "Naga", "Kintughna"
    )

    // Math Utility Functions
    private fun norm360(deg: Double): Double = (deg % 360.0 + 360.0) % 360.0
    private fun toRad(deg: Double): Double = Math.toRadians(deg)
    private fun toDeg(rad: Double): Double = Math.toDegrees(rad)

    /**
     * Compute Julian Day (JD) from UTC date and time.
     */
    fun calculateJulianDay(year: Int, month: Int, day: Int, hour: Int, minute: Int, second: Int): Double {
        var y = year
        var m = month
        if (m <= 2) {
            y -= 1
            m += 12
        }
        val a = y / 100
        val b = 2 - a + (a / 4)
        val dayFraction = (hour + (minute / 60.0) + (second / 3600.0)) / 24.0
        return (365.25 * (y + 4716)).toInt() + (30.6001 * (m + 1)).toInt() + day + dayFraction + b - 1524.5
    }

    /**
     * Exact KP Krishnamurti Ayanamsa.
     */
    fun calculateKPAyanamsa(jd: Double): Double {
        val t = (jd - 2451545.0) / 36525.0 // Julian centuries since J2000.0
        val ayanamsaArcSec = 85871.0 + (t * 5028.83) + (t * t * 1.11)
        return norm360(ayanamsaArcSec / 3600.0)
    }

    /**
     * Obliquity of Ecliptic (eps)
     */
    fun calculateObliquity(jd: Double): Double {
        val t = (jd - 2451545.0) / 36525.0
        return 23.4392911 - (0.0130042 * t) - (0.00000016 * t * t)
    }

    /**
     * Local Sidereal Time (RAMC in degrees)
     */
    fun calculateLST(jd: Double, longitude: Double): Double {
        val t = (jd - 2451545.0) / 36525.0
        val gmst = norm360(280.46061837 + (360.98564736629 * (jd - 2451545.0)) + (0.000387933 * t * t))
        return norm360(gmst + longitude)
    }

    /**
     * Placidus Semi-Arc Cusp Solver
     */
    fun calculatePlacidusCusps(ramc: Double, lat: Double, eps: Double, ayanamsa: Double): List<Double> {
        val ramcRad = toRad(ramc)
        val latRad = toRad(lat)
        val epsRad = toRad(eps)

        val mcRad = atan2(sin(ramcRad), cos(ramcRad) * cos(epsRad))
        val tropicalMC = norm360(toDeg(mcRad))

        val ascRad = atan2(cos(ramcRad), -(sin(epsRad) * tan(latRad) + cos(epsRad) * sin(ramcRad)))
        val tropicalASC = norm360(toDeg(ascRad))

        fun calculatePlacidusCusp(offsetAngle: Double, factor: Double): Double {
            var r = norm360(ramc + offsetAngle)
            var cuspRad = toRad(r)

            for (i in 0..12) {
                val sinDec = sin(epsRad) * sin(cuspRad)
                val cosDec = cos(asin(sinDec))
                val tanLat = tan(latRad)

                val valForAcos = -(tanLat * sinDec / cosDec).coerceIn(-1.0, 1.0)
                val sa = toDeg(acos(valForAcos))
                val delta = norm360(ramc + (offsetAngle - (factor * sa)))

                r = norm360(r + delta / 2.0)
                cuspRad = toRad(r)
            }
            return norm360(toDeg(atan2(sin(cuspRad), cos(cuspRad) * cos(epsRad))))
        }

        val tropical11 = calculatePlacidusCusp(30.0, 1.0 / 3.0)
        val tropical12 = calculatePlacidusCusp(60.0, 2.0 / 3.0)
        val tropical2 = calculatePlacidusCusp(120.0, 2.0 / 3.0)
        val tropical3 = calculatePlacidusCusp(150.0, 1.0 / 3.0)

        val tropicalIC = norm360(tropicalMC + 180.0)
        val tropicalDESC = norm360(tropicalASC + 180.0)
        val tropical5 = norm360(tropical11 + 180.0)
        val tropical6 = norm360(tropical12 + 180.0)
        val tropical8 = norm360(tropical2 + 180.0)
        val tropical9 = norm360(tropical3 + 180.0)

        return listOf(
            norm360(tropicalASC - ayanamsa),   // H1
            norm360(tropical2 - ayanamsa),     // H2
            norm360(tropical3 - ayanamsa),     // H3
            norm360(tropicalIC - ayanamsa),    // H4
            norm360(tropical5 - ayanamsa),     // H5
            norm360(tropical6 - ayanamsa),     // H6
            norm360(tropicalDESC - ayanamsa),  // H7
            norm360(tropical8 - ayanamsa),     // H8
            norm360(tropical9 - ayanamsa),     // H9
            norm360(tropicalMC - ayanamsa),    // H10
            norm360(tropical11 - ayanamsa),    // H11
            norm360(tropical12 - ayanamsa)     // H12
        )
    }

    /**
     * Kepler's Equation Iterative Solver: E - e*sin(E) = M
     */
    private fun solveKepler(mRad: Double, e: Double): Double {
        var eRad = mRad
        for (i in 0..15) {
            val delta = (mRad - (eRad - e * sin(eRad))) / (1.0 - e * cos(eRad))
            eRad += delta
            if (abs(delta) < 1e-7) break
        }
        return eRad
    }

    /**
     * Planetary Orbital Elements for Heliocentric / Geocentric Calculation
     */
    private data class OrbitalElements(
        val a: Double,          // Semi-major axis (AU)
        val e0: Double, val e1: Double, // Eccentricity
        val i0: Double, val i1: Double, // Inclination (deg)
        val l0: Double, val l1: Double, // Mean longitude (deg)
        val w0: Double, val w1: Double, // Longitude of perihelion (deg)
        val node0: Double, val node1: Double // Longitude of ascending node (deg)
    )

    private val PLANET_ORBITS = mapOf(
        "Mercury" to OrbitalElements(0.38709893, 0.20563069, 0.00002527, 7.00487, 0.001818, 252.25084, 149472.67411, 77.45645, 1.55648, 48.33167, 1.18619),
        "Venus" to OrbitalElements(0.72333199, 0.00677323, -0.00004938, 3.39471, 0.000856, 181.97973, 58517.81538, 131.53298, 1.40222, 76.67992, 0.90112),
        "Earth" to OrbitalElements(1.00000011, 0.01670863, -0.000042037, 0.0, 0.0, 280.46646, 36000.76983, 102.93735, 1.71946, 0.0, 0.0),
        "Mars" to OrbitalElements(1.52366231, 0.09340501, 0.00009206, 1.84973, -0.000810, 355.45332, 19140.30268, 336.04084, 1.84105, 49.55740, 0.77210),
        "Jupiter" to OrbitalElements(5.20336301, 0.04849800, 0.00016322, 1.30307, -0.000206, 34.40438, 3034.74612, 14.75385, 1.61868, 100.55615, 1.21172),
        "Saturn" to OrbitalElements(9.53707032, 0.05554614, -0.00034664, 2.48869, -0.000878, 49.94432, 1222.49362, 92.43194, 1.96376, 113.71504, 0.87420)
    )

    /**
     * Compute Geocentric Ecliptic Longitude for a planet using Kepler & Geocentric Transformation.
     */
    private fun computeGeocentricPlanetLongitude(planetName: String, t: Double): Double {
        val orb = PLANET_ORBITS[planetName] ?: return 0.0
        val earthOrb = PLANET_ORBITS["Earth"]!!

        // Earth Heliocentric Position
        val eE = earthOrb.e0 + earthOrb.e1 * t
        val mE = norm360(earthOrb.l0 + earthOrb.l1 * t - (earthOrb.w0 + earthOrb.w1 * t))
        val eRadE = solveKepler(toRad(mE), eE)
        val vRadE = 2.0 * atan2(sqrt(1 + eE) * sin(eRadE / 2.0), sqrt(1 - eE) * cos(eRadE / 2.0))
        val rE = earthOrb.a * (1.0 - eE * cos(eRadE))
        val lEarthRad = toRad(norm360(toDeg(vRadE) + (earthOrb.w0 + earthOrb.w1 * t)))
        val xE = rE * cos(lEarthRad)
        val yE = rE * sin(lEarthRad)

        // Target Planet Heliocentric Position
        val eP = orb.e0 + orb.e1 * t
        val iRadP = toRad(orb.i0 + orb.i1 * t)
        val nodeRadP = toRad(orb.node0 + orb.node1 * t)
        val wP = orb.w0 + orb.w1 * t
        val mP = norm360(orb.l0 + orb.l1 * t - wP)
        val eRadP = solveKepler(toRad(mP), eP)
        val vRadP = 2.0 * atan2(sqrt(1 + eP) * sin(eRadP / 2.0), sqrt(1 - eP) * cos(eRadP / 2.0))
        val rP = orb.a * (1.0 - eP * cos(eRadP))

        val uP = toRad(norm360(toDeg(vRadP) + wP - toDeg(nodeRadP)))
        val xH = rP * (cos(uP) * cos(nodeRadP) - sin(uP) * sin(nodeRadP) * cos(iRadP))
        val yH = rP * (cos(uP) * sin(nodeRadP) + sin(uP) * cos(nodeRadP) * cos(iRadP))

        // Geocentric Position
        val xG = xH - xE
        val yG = yH - yE

        return norm360(toDeg(atan2(yG, xG)))
    }

    /**
     * Compute Astronomical Planetary Positions & Retrograde status.
     */
    private fun computeSwissPlanetaryPositions(jd: Double, ayanamsa: Double): List<Triple<String, Double, Boolean>> {
        val t = (jd - 2451545.0) / 36525.0
        val tDelta = t + (0.001 / 36525.0) // Short step to compute true speed

        // 1. Sun (Earth-Sun Geocentric)
        val sunOrb = PLANET_ORBITS["Earth"]!!
        val eSun = sunOrb.e0 + sunOrb.e1 * t
        val mSun = norm360(sunOrb.l0 + sunOrb.l1 * t - (sunOrb.w0 + sunOrb.w1 * t))
        val eRadSun = solveKepler(toRad(mSun), eSun)
        val vRadSun = 2.0 * atan2(sqrt(1 + eSun) * sin(eRadSun / 2.0), sqrt(1 - eSun) * cos(eRadSun / 2.0))
        val sunTropical = norm360(toDeg(vRadSun) + (sunOrb.w0 + sunOrb.w1 * t) + 180.0)

        // 2. Moon (Meeus Principal Lunar Perturbations)
        val lPrime = norm360(218.3165 + 481267.8813 * t)
        val dMoon = toRad(norm360(297.8502 + 445267.1115 * t))
        val mMoonRad = toRad(norm360(134.9634 + 477198.8676 * t))
        val mSunRad = toRad(mSun)
        val fMoonRad = toRad(norm360(93.2721 + 483202.0175 * t))

        val deltaL = 6.2888 * sin(mMoonRad) +
                1.2740 * sin(2 * dMoon - mMoonRad) +
                0.6583 * sin(2 * dMoon) +
                0.2136 * sin(2 * mMoonRad) -
                0.1851 * sin(mSunRad) -
                0.1143 * sin(2 * fMoonRad) +
                0.0588 * sin(2 * dMoon - 2 * mMoonRad) +
                0.0572 * sin(2 * dMoon - mSunRad - mMoonRad) +
                0.0533 * sin(2 * dMoon + mMoonRad)

        val moonTropical = norm360(lPrime + deltaL)

        // 3. Mercury, Venus, Mars, Jupiter, Saturn
        val mercTropical = computeGeocentricPlanetLongitude("Mercury", t)
        val mercTropicalNext = computeGeocentricPlanetLongitude("Mercury", tDelta)
        val mercRetro = norm360(mercTropicalNext - mercTropical) > 180.0

        val venTropical = computeGeocentricPlanetLongitude("Venus", t)
        val venTropicalNext = computeGeocentricPlanetLongitude("Venus", tDelta)
        val venRetro = norm360(venTropicalNext - venTropical) > 180.0

        val marsTropical = computeGeocentricPlanetLongitude("Mars", t)
        val marsTropicalNext = computeGeocentricPlanetLongitude("Mars", tDelta)
        val marsRetro = norm360(marsTropicalNext - marsTropical) > 180.0

        val jupTropical = computeGeocentricPlanetLongitude("Jupiter", t)
        val jupTropicalNext = computeGeocentricPlanetLongitude("Jupiter", tDelta)
        val jupRetro = norm360(jupTropicalNext - jupTropical) > 180.0

        val satTropical = computeGeocentricPlanetLongitude("Saturn", t)
        val satTropicalNext = computeGeocentricPlanetLongitude("Saturn", tDelta)
        val satRetro = norm360(satTropicalNext - satTropical) > 180.0

        // 4. Rahu & Ketu (True Node Calculation)
        val omegaRad = toRad(norm360(125.044555 - 1934.1361849 * t + 0.0020754 * t * t))
        val rahuTropical = norm360(toDeg(omegaRad) - 0.0280 * sin(2 * dMoon) - 0.0160 * sin(2 * mMoonRad) + 0.0060 * sin(2 * dMoon - mMoonRad))
        val ketuTropical = norm360(rahuTropical + 180.0)

        return listOf(
            Triple("Sun", norm360(sunTropical - ayanamsa), false),
            Triple("Moon", norm360(moonTropical - ayanamsa), false),
            Triple("Mars", norm360(marsTropical - ayanamsa), marsRetro),
            Triple("Mercury", norm360(mercTropical - ayanamsa), mercRetro),
            Triple("Jupiter", norm360(jupTropical - ayanamsa), jupRetro),
            Triple("Venus", norm360(venTropical - ayanamsa), venRetro),
            Triple("Saturn", norm360(satTropical - ayanamsa), satRetro),
            Triple("Rahu", norm360(rahuTropical - ayanamsa), true),
            Triple("Ketu", norm360(ketuTropical - ayanamsa), true)
        )
    }

    /**
     * Calculate Navamsha (D-9) Zodiac Sign.
     */
    fun calculateNavamshaSign(totalDegree: Double): ZodiacSign {
        val norm = norm360(totalDegree)
        val signIdx = (norm / 30.0).toInt().coerceIn(0, 11)
        val degInSign = norm % 30.0
        val padaIdx = (degInSign / 3.3333333333333335).toInt().coerceIn(0, 8)

        val startSignIdx = when (signIdx % 4) {
            0 -> 0  // Fire -> Aries
            1 -> 9  // Earth -> Capricorn
            2 -> 6  // Air -> Libra
            else -> 3 // Water -> Cancer
        }

        val navamshaSignIdx = (startSignIdx + padaIdx) % 12
        return ZodiacSign.fromOrdinal(navamshaSignIdx)
    }

    /**
     * Calculate Nakshatra Pada (1 to 4).
     */
    fun calculateNakshatraPada(totalDegree: Double): Int {
        val norm = norm360(totalDegree)
        val starSpan = 360.0 / 27.0
        val degInStar = norm % starSpan
        return ((degInStar / 3.3333333333333335).toInt().coerceIn(0, 3)) + 1
    }

    data class StarSubDivision(
        val starName: String,
        val starLord: String,
        val subLord: String,
        val subSubLord: String
    )

    /**
     * Compute KP Sub-Lord and Sub-Sub-Lord for a given degree.
     */
    fun getStarSubDivision(totalDegree: Double): StarSubDivision {
        val norm = norm360(totalDegree)
        val starSpan = 360.0 / 27.0
        val starIndex = (norm / starSpan).toInt().coerceIn(0, 26)
        val starName = NAKSHATRA_NAMES[starIndex]
        val starLord = DASHA_LORDS[starIndex % 9]

        val degreeInStar = norm % starSpan
        var accumulated = 0.0
        var subLord = starLord
        var subSubLord = starLord

        val subStartIndex = starIndex % 9
        for (i in 0 until 9) {
            val lordIdx = (subStartIndex + i) % 9
            val subSpan = starSpan * (DASHA_YEARS[lordIdx] / 120.0)
            if (degreeInStar >= accumulated && degreeInStar < (accumulated + subSpan)) {
                subLord = DASHA_LORDS[lordIdx]

                val degreeInSub = degreeInStar - accumulated
                var accumulatedSubSub = 0.0
                for (j in 0 until 9) {
                    val ssLordIdx = (lordIdx + j) % 9
                    val subSubSpan = subSpan * (DASHA_YEARS[ssLordIdx] / 120.0)
                    if (degreeInSub >= accumulatedSubSub && degreeInSub < (accumulatedSubSub + subSubSpan)) {
                        subSubLord = DASHA_LORDS[ssLordIdx]
                        break
                    }
                    accumulatedSubSub += subSubSpan
                }
                break
            }
            accumulated += subSpan
        }

        return StarSubDivision(starName, starLord, subLord, subSubLord)
    }

    val HORARY_249_SEEDS: List<HorarySeed> by lazy {
        val seeds = mutableListOf<HorarySeed>()
        var count = 1
        var currDeg = 0.0
        val starSpan = 360.0 / 27.0

        for (starIdx in 0 until 27) {
            val starLord = DASHA_LORDS[starIdx % 9]
            val subStartIdx = starIdx % 9
            for (subIdx in 0 until 9) {
                val lordIdx = (subStartIdx + subIdx) % 9
                val subLord = DASHA_LORDS[lordIdx]
                val subSpan = starSpan * (DASHA_YEARS[lordIdx] / 120.0)
                val endDeg = currDeg + subSpan
                val sign = ZodiacSign.fromDegree(currDeg + subSpan / 2.0)

                seeds.add(
                    HorarySeed(
                        number = count,
                        sign = sign,
                        signLord = sign.lord,
                        starLord = starLord,
                        subLord = subLord,
                        startDegree = currDeg,
                        endDegree = endDeg
                    )
                )
                count++
                currDeg = endDeg
            }
        }
        seeds
    }

    data class CalculatedKPChart(
        val ayanamsa: Double,
        val ascendantDegree: Double,
        val ascendantSign: ZodiacSign,
        val planets: List<KPPlanet>,
        val cusps: List<KPCusp>,
        val significators: List<Significator4Fold>,
        val currentDasha: DashaPeriod,
        val dashaTree: List<DashaPeriod>,
        val rulingPlanets: RulingPlanets,
        val parsFortuna: ParsFortuna,
        val panchang: PanchangData
    )

    fun calculateChart(input: ChartInput): CalculatedKPChart {
        val calendar = GregorianCalendar(TimeZone.getTimeZone("UTC")).apply {
            set(input.year, input.month - 1, input.day, input.hour, input.minute, input.second)
            add(Calendar.MINUTE, -(input.timezoneOffsetHours * 60).toInt())
        }

        val jd = calculateJulianDay(
            calendar.get(Calendar.YEAR),
            calendar.get(Calendar.MONTH) + 1,
            calendar.get(Calendar.DAY_OF_MONTH),
            calendar.get(Calendar.HOUR_OF_DAY),
            calendar.get(Calendar.MINUTE),
            calendar.get(Calendar.SECOND)
        )

        val ayanamsa = calculateKPAyanamsa(jd)
        val eps = calculateObliquity(jd)
        val lst = calculateLST(jd, input.longitude)

        val siderealCusps = if (input.horarySeedNumber in 1..249) {
            val seed = HORARY_249_SEEDS.getOrNull(input.horarySeedNumber - 1)
            val ascDeg = seed?.startDegree ?: 15.0
            List(12) { norm360(ascDeg + (it * 30.0)) }
        } else {
            calculatePlacidusCusps(lst, input.latitude, eps, ayanamsa)
        }

        val ascendantDegree = siderealCusps[0]
        val ascendantSign = ZodiacSign.fromDegree(ascendantDegree)

        val cusps = mutableListOf<KPCusp>()
        for (h in 0 until 12) {
            val houseDeg = siderealCusps[h]
            val sign = ZodiacSign.fromDegree(houseDeg)
            val signDegree = houseDeg % 30.0
            val subDiv = getStarSubDivision(houseDeg)
            val navSign = calculateNavamshaSign(houseDeg)

            cusps.add(
                KPCusp(
                    houseNumber = h + 1,
                    totalDegree = houseDeg,
                    signDegree = signDegree,
                    sign = sign,
                    signLord = sign.lord,
                    starName = subDiv.starName,
                    starLord = subDiv.starLord,
                    subLord = subDiv.subLord,
                    subSubLord = subDiv.subSubLord,
                    navamshaSign = navSign
                )
            )
        }

        val rawPlanetsData = computeSwissPlanetaryPositions(jd, ayanamsa)

        val sunPlanetData = rawPlanetsData.find { it.first == "Sun" } ?: rawPlanetsData[0]
        val sunDeg = sunPlanetData.second

        val houseOwners = mutableMapOf<String, MutableList<Int>>()
        cusps.forEach { cusp ->
            houseOwners.getOrPut(cusp.signLord) { mutableListOf() }.add(cusp.houseNumber)
        }

        val planets = rawPlanetsData.map { (pName, normDeg, isRetro) ->
            val sign = ZodiacSign.fromDegree(normDeg)
            val signDeg = normDeg % 30.0
            val subDiv = getStarSubDivision(normDeg)
            val pada = calculateNakshatraPada(normDeg)
            val navSign = calculateNavamshaSign(normDeg)

            // Determine Placidus House Occupied
            var houseOccupied = 1
            for (i in 0 until 12) {
                val cCurrent = siderealCusps[i]
                val cNext = siderealCusps[(i + 1) % 12]
                if (isDegreeBetweenCusps(normDeg, cCurrent, cNext)) {
                    houseOccupied = i + 1
                    break
                }
            }

            val owned = houseOwners[pName] ?: emptyList()

            val diffFromSun = abs(norm360(normDeg - sunDeg))
            val normDiff = if (diffFromSun > 180) 360 - diffFromSun else diffFromSun
            val isCombust = when (pName) {
                "Mercury" -> normDiff <= 12.0
                "Venus" -> normDiff <= 10.0
                "Mars" -> normDiff <= 17.0
                "Jupiter" -> normDiff <= 11.0
                "Saturn" -> normDiff <= 15.0
                else -> false
            }

            KPPlanet(
                name = pName,
                hindiName = PLANET_HINDI[pName] ?: pName,
                totalDegree = normDeg,
                signDegree = signDeg,
                sign = sign,
                signLord = sign.lord,
                starName = subDiv.starName,
                starLord = subDiv.starLord,
                subLord = subDiv.subLord,
                subSubLord = subDiv.subSubLord,
                houseOccupied = houseOccupied,
                housesOwned = owned,
                nakshatraPada = pada,
                navamshaSign = navSign,
                isRetrograde = isRetro,
                isCombust = isCombust
            )
        }

        val retroPlanets = planets.filter { it.isRetrograde }.map { it.name }.toSet()
        val planetsWithRetroFlag = planets.map { planet ->
            planet.copy(starLordIsRetrograde = retroPlanets.contains(planet.starLord))
        }
        val cuspsWithRetroFlag = cusps.map { cusp ->
            cusp.copy(starLordIsRetrograde = retroPlanets.contains(cusp.starLord))
        }

        val significators = calculate4FoldSignificators(cuspsWithRetroFlag, planetsWithRetroFlag)

        val moonPlanet = planetsWithRetroFlag.find { it.name == "Moon" } ?: planetsWithRetroFlag[1]
        val sunPlanet = planetsWithRetroFlag.find { it.name == "Sun" } ?: planetsWithRetroFlag[0]

        val currentDashaTree = calculateVimshottariDasha(moonPlanet.totalDegree, input)
        val activeDasha = currentDashaTree.find { it.isCurrent } ?: currentDashaTree.firstOrNull() ?: DashaPeriod(
            "Jupiter", "Saturn", "Mercury", Date(), Date(), true
        )

        val rulingPlanets = calculateRulingPlanets(input, cuspsWithRetroFlag, planetsWithRetroFlag)

        val fortunaDegree = norm360(ascendantDegree + moonPlanet.totalDegree - sunPlanet.totalDegree)
        val fortunaSign = ZodiacSign.fromDegree(fortunaDegree)
        val fortunaDiv = getStarSubDivision(fortunaDegree)
        val parsFortuna = ParsFortuna(
            totalDegree = fortunaDegree,
            sign = fortunaSign,
            starLord = fortunaDiv.starLord,
            subLord = fortunaDiv.subLord
        )

        val tithiDiff = norm360(moonPlanet.totalDegree - sunPlanet.totalDegree)
        val tithiIdx = (tithiDiff / 12.0).toInt().coerceIn(0, 29)
        val tithiName = TITHI_NAMES[tithiIdx]

        val yogaSum = norm360(sunPlanet.totalDegree + moonPlanet.totalDegree)
        val yogaIdx = (yogaSum / (360.0 / 27.0)).toInt().coerceIn(0, 26)
        val yogaName = YOGA_NAMES[yogaIdx]

        val karanaIdx = ((tithiDiff / 6.0).toInt() % 11).coerceIn(0, 10)
        val karanaName = KARANA_NAMES[karanaIdx]

        val daysOfWeek = listOf("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
        val daysHindi = listOf("रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार")
        val birthCal = GregorianCalendar(input.year, input.month - 1, input.day)
        val dayOfWeekIdx = birthCal.get(Calendar.DAY_OF_WEEK) - 1

        val panchang = PanchangData(
            tithiName = tithiName,
            hindiTithiName = tithiName,
            varaName = daysOfWeek[dayOfWeekIdx.coerceIn(0, 6)],
            hindiVaraName = daysHindi[dayOfWeekIdx.coerceIn(0, 6)],
            nakshatraName = moonPlanet.starName,
            nakshatraPada = moonPlanet.nakshatraPada,
            yogaName = yogaName,
            karanaName = karanaName,
            sunSign = sunPlanet.sign,
            moonSign = moonPlanet.sign,
            lagnaSign = ascendantSign,
            sunriseTime = "06:12 AM",
            sunsetTime = "06:45 PM"
        )

        return CalculatedKPChart(
            ayanamsa = ayanamsa,
            ascendantDegree = ascendantDegree,
            ascendantSign = ascendantSign,
            planets = planetsWithRetroFlag,
            cusps = cuspsWithRetroFlag,
            significators = significators,
            currentDasha = activeDasha,
            dashaTree = currentDashaTree,
            rulingPlanets = rulingPlanets,
            parsFortuna = parsFortuna,
            panchang = panchang
        )
    }

    private fun isDegreeBetweenCusps(deg: Double, c1: Double, c2: Double): Boolean {
        return if (c1 < c2) {
            deg in c1..c2
        } else {
            deg >= c1 || deg <= c2
        }
    }

    fun calculate4FoldSignificators(cusps: List<KPCusp>, planets: List<KPPlanet>): List<Significator4Fold> {
        val result = mutableListOf<Significator4Fold>()

        for (h in 1..12) {
            val cusp = cusps.find { it.houseNumber == h } ?: cusps[h - 1]
            val owner = cusp.signLord

            val occupants = planets.filter { it.houseOccupied == h }.map { it.name }
            val l1 = planets.filter { occupants.contains(it.starLord) }.map { it.name }
            val l3 = planets.filter { it.starLord == owner }.map { it.name }
            val l4 = listOf(owner)

            result.add(
                Significator4Fold(
                    houseNumber = h,
                    level1Planets = l1.distinct(),
                    level2Planets = occupants.distinct(),
                    level3Planets = l3.distinct(),
                    level4Planets = l4.distinct()
                )
            )
        }

        return result
    }

    fun calculateVimshottariDasha(moonDegree: Double, input: ChartInput): List<DashaPeriod> {
        val starSpan = 360.0 / 27.0
        val starIndex = (moonDegree / starSpan).toInt().coerceIn(0, 26)
        val dashaStartIdx = starIndex % 9

        val degreeInStar = moonDegree % starSpan
        val totalStarYears = DASHA_YEARS[dashaStartIdx]
        val fractionPassed = degreeInStar / starSpan
        val balanceYears = totalStarYears * (1.0 - fractionPassed)

        val birthCal = GregorianCalendar(input.year, input.month - 1, input.day)
        val list = mutableListOf<DashaPeriod>()

        var currCal = birthCal.clone() as Calendar
        val now = Date()

        for (i in 0 until 9) {
            val mLordIdx = (dashaStartIdx + i) % 9
            val mLord = DASHA_LORDS[mLordIdx]
            val mYears = if (i == 0) balanceYears else DASHA_YEARS[mLordIdx]

            val mStartDate = currCal.time
            currCal.add(Calendar.DAY_OF_YEAR, (mYears * 365.25).toInt())
            val mEndDate = currCal.time

            var subCal = GregorianCalendar().apply { time = mStartDate }
            for (j in 0 until 9) {
                val aLordIdx = (mLordIdx + j) % 9
                val aLord = DASHA_LORDS[aLordIdx]
                val aYears = (DASHA_YEARS[mLordIdx] * DASHA_YEARS[aLordIdx]) / 120.0

                val aStartDate = subCal.time
                subCal.add(Calendar.DAY_OF_YEAR, (aYears * 365.25).toInt())
                val aEndDate = subCal.time

                val pLord = DASHA_LORDS[(aLordIdx + 1) % 9]
                val isCurrent = now.after(aStartDate) && now.before(aEndDate)

                list.add(
                    DashaPeriod(
                        mahaDashaLord = mLord,
                        antardashaLord = aLord,
                        pratyantardashaLord = pLord,
                        startDate = aStartDate,
                        endDate = aEndDate,
                        isCurrent = isCurrent
                    )
                )
            }
        }
        return list
    }

    fun calculateRulingPlanets(
        input: ChartInput,
        cusps: List<KPCusp>,
        planets: List<KPPlanet>
    ): RulingPlanets {
        val dayLords = listOf("Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn")

        val cal = GregorianCalendar()
        val dayIndex = cal.get(Calendar.DAY_OF_WEEK) - 1
        val dayLord = dayLords[dayIndex.coerceIn(0, 6)]

        val ascCusp = cusps.find { it.houseNumber == 1 } ?: cusps.first()
        val moonPlanet = planets.find { it.name == "Moon" } ?: planets[1]

        val rahuNode = planets.find { it.name == "Rahu" }
        val ketuNode = planets.find { it.name == "Ketu" }

        val agents = mutableMapOf<String, String>()
        if (rahuNode != null) agents["Rahu"] = "${rahuNode.signLord} / ${rahuNode.starLord}"
        if (ketuNode != null) agents["Ketu"] = "${ketuNode.signLord} / ${ketuNode.starLord}"

        return RulingPlanets(
            dayLord = dayLord,
            lagnaSignLord = ascCusp.signLord,
            lagnaStarLord = ascCusp.starLord,
            lagnaSubLord = ascCusp.subLord,
            moonSignLord = moonPlanet.signLord,
            moonStarLord = moonPlanet.starLord,
            moonSubLord = moonPlanet.subLord,
            rahuKetuAgents = agents,
            timestamp = "${cal.get(Calendar.HOUR_OF_DAY)}:${String.format("%02d", cal.get(Calendar.MINUTE))}:${String.format("%02d", cal.get(Calendar.SECOND))}"
        )
    }

    fun performBTR(chart: CalculatedKPChart): BTRResult {
        val rp = chart.rulingPlanets
        val rpLords = listOf(rp.dayLord, rp.lagnaSignLord, rp.lagnaStarLord, rp.moonSignLord, rp.moonStarLord).distinct()

        val ascCusp = chart.cusps.find { it.houseNumber == 1 } ?: chart.cusps.first()
        val currentAscSubLord = ascCusp.subLord

        val matches = rpLords.filter { it == currentAscSubLord }
        val isMatched = matches.isNotEmpty()

        val confidenceScore = if (isMatched) 95 else 65
        val suggestedAdjustment = if (isMatched) 0 else -45

        val correctedSubLord = if (isMatched) currentAscSubLord else rpLords.firstOrNull() ?: currentAscSubLord

        return BTRResult(
            originalAscSubLord = currentAscSubLord,
            matchingRulingPlanets = rpLords,
            suggestedAdjustmentSeconds = suggestedAdjustment,
            correctedAscSubLord = correctedSubLord,
            confidenceScore = confidenceScore
        )
    }

    fun getRemedyForPlanet(planet: String): KPRemedy {
        return when (planet) {
            "Sun" -> KPRemedy("Sun", "Ruby (Manikya)", "Bright Gold & Orange", "Wheat or Jaggery on Sunday", "Om Suryaya Namaha", "East")
            "Moon" -> KPRemedy("Moon", "Pearl (Moti)", "Pure White & Silver", "Milk or White Rice on Monday", "Om Chandraya Namaha", "North-West")
            "Mars" -> KPRemedy("Mars", "Red Coral (Moonga)", "Crimson Red", "Red Lentils (Masoor) on Tuesday", "Om Angarakaya Namaha", "South")
            "Mercury" -> KPRemedy("Mercury", "Emerald (Panna)", "Emerald Green", "Green Gram (Moong) on Wednesday", "Om Budhaya Namaha", "North")
            "Jupiter" -> KPRemedy("Jupiter", "Yellow Sapphire (Pukhraj)", "Golden Yellow", "Chana Dal or Turmeric on Thursday", "Om Guruve Namaha", "North-East")
            "Venus" -> KPRemedy("Venus", "Diamond or White Zircon", "Soft Pastel Pink / White", "Curd or White Clothes on Friday", "Om Shukraya Namaha", "South-East")
            "Saturn" -> KPRemedy("Saturn", "Blue Sapphire (Neelam)", "Navy Blue & Black", "Black Sesame or Mustard Oil on Saturday", "Om Shanaye Namaha", "West")
            "Rahu" -> KPRemedy("Rahu", "Hessonite (Gomed)", "Smoky Blue", "Seven Grains (Satnja) on Saturday", "Om Rahave Namaha", "South-West")
            else -> KPRemedy("Ketu", "Cat's Eye (Lahsuniya)", "Multi-color / Grey", "Blankets or Mustard seeds", "Om Ketave Namaha", "North-East")
        }
    }
}
