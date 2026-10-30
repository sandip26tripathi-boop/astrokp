package com.example

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.example.kp.ChartInput
import com.example.kp.KPEphemerisEngine
import com.example.kp.KPEvaluator
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class ExampleRobolectricTest {

  @Test
  fun `read string from context`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val appName = context.getString(R.string.app_name)
    assertEquals("AstroKP", appName)
  }

  @Test
  fun `test KP calculation engine produces 12 cusps and 9 planets`() {
    val input = ChartInput(
      name = "Test Client",
      year = 1995, month = 6, day = 15,
      hour = 10, minute = 30, second = 0,
      latitude = 28.6139, longitude = 77.2090, timezoneOffsetHours = 5.5,
      locationName = "New Delhi"
    )

    val chart = KPEphemerisEngine.calculateChart(input)

    assertEquals(12, chart.cusps.size)
    assertEquals(9, chart.planets.size)
    assertEquals(12, chart.significators.size)
    assertNotNull(chart.currentDasha)
    assertNotNull(chart.rulingPlanets)
  }

  @Test
  fun `test KP evaluator produces event scores`() {
    val input = ChartInput()
    val chart = KPEphemerisEngine.calculateChart(input)
    val scores = KPEvaluator.evaluateAllEvents(chart)

    assertEquals(7, scores.size)
    assertTrue(scores[0].probabilityPercentage in 15..95)
  }
}
