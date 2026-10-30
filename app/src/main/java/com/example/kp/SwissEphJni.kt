package com.example.kp

/**
 * JNI Binding interface for Swiss Ephemeris C-library (libswseph.so).
 *
 * Declares native JNI entry points for Swiss Ephemeris C functions:
 * - swe_calc_ut: High-precision geocentric planetary calculations
 * - swe_houses_ex: Placidus & Koch house cusps
 * - swe_get_ayanamsa_ut: KP / Krishnamurti Ayanamsa calculations
 * - swe_julday: UT Julian day computation
 */
object SwissEphJni {

    // Flag constants corresponding to Swiss Ephemeris C API
    const val SEFLG_SPEED = 256
    const val SEFLG_SWIEPH = 2
    const val SEFLG_JPLEPH = 1
    const val SEFLG_SIDEREAL = 65536

    // Ayanamsa modes
    const val SE_SIDM_FAGAN_BRADLEY = 0
    const val SE_SIDM_LAHIRI = 1
    const val SE_SIDM_KRISHNAMURTI = 5
    const val SE_SIDM_KP_NEW = 21

    // Planet IDs
    const val SE_SUN = 0
    const val SE_MOON = 1
    const val SE_MERCURY = 2
    const val SE_VENUS = 3
    const val SE_MARS = 4
    const val SE_JUPITER = 5
    const val SE_SATURN = 6
    const val SE_URANUS = 7
    const val SE_NEPTUNE = 8
    const val SE_PLUTO = 9
    const val SE_MEAN_NODE = 10
    const val SE_TRUE_NODE = 11

    // House system 'P' for Placidus
    const val SE_HOUSE_PLACIDUS = 'P'.code

    var isJniLoaded: Boolean = false
        private set

    init {
        try {
            System.loadLibrary("swseph")
            isJniLoaded = true
        } catch (e: Throwable) {
            // JNI library not present in build environment; fallback to native Kotlin Swiss Engine
            isJniLoaded = false
        }
    }

    // Native C-Functions (JNI Bridge)
    external fun sweJulday(year: Int, month: Int, day: Int, hour: Double, gregflag: Int): Double
    external fun sweCalcUt(jdUt: Double, iPl: Int, iflag: Int, xx: DoubleArray, serr: StringBuilder?): Int
    external fun sweHousesEx(jdUt: Double, iflag: Int, lat: Double, lon: Double, hsys: Int, cusps: DoubleArray, ascmc: DoubleArray): Int
    external fun sweGetAyanamsaUt(jdUt: Double): Double
    external fun sweSetSidmode(sidmode: Int, t0: Double, ayanT0: Double)
}
