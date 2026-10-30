package com.example.kp

object KPEvaluator {

    /**
     * Evaluate event probabilities for all 7 major life categories.
     */
    fun evaluateAllEvents(chart: KPEphemerisEngine.CalculatedKPChart): List<EventScore> {
        return EventCategory.entries.map { category ->
            evaluateEventCategory(category, chart)
        }
    }

    private fun evaluateEventCategory(
        category: EventCategory,
        chart: KPEphemerisEngine.CalculatedKPChart
    ): EventScore {
        // Find Cusp for primary house of category
        val primaryHouseNum = category.primaryFavorableHouses.first()
        val primaryCusp = chart.cusps.find { it.houseNumber == primaryHouseNum } ?: chart.cusps.first()
        val subLordName = primaryCusp.subLord

        // Find planet representing Sub-Lord
        val subLordPlanet = chart.planets.find { it.name == subLordName }
        val subLordStarLord = subLordPlanet?.starLord ?: "Jupiter"

        // Find houses signified by Sub-Lord's Star Lord
        val starLordPlanet = chart.planets.find { it.name == subLordStarLord }
        val signifiedHouses = mutableListOf<Int>()
        if (starLordPlanet != null) {
            signifiedHouses.add(starLordPlanet.houseOccupied)
            signifiedHouses.addAll(starLordPlanet.housesOwned)
        }

        // Add 4-Fold significators for primary house
        val significatorData = chart.significators.find { it.houseNumber == primaryHouseNum }
        val allSignificatorPlanets = (significatorData?.level1Planets ?: emptyList()) +
                (significatorData?.level2Planets ?: emptyList()) +
                (significatorData?.level3Planets ?: emptyList()) +
                (significatorData?.level4Planets ?: emptyList())

        allSignificatorPlanets.forEach { pName ->
            val p = chart.planets.find { it.name == pName }
            if (p != null) {
                signifiedHouses.add(p.houseOccupied)
                signifiedHouses.addAll(p.housesOwned)
            }
        }

        val activeSignified = signifiedHouses.distinct()

        val activeFavorable = activeSignified.filter {
            category.primaryFavorableHouses.contains(it) || category.secondaryFavorableHouses.contains(it)
        }

        val activeNegating = activeSignified.filter {
            category.negatingHouses.contains(it)
        }

        // Calculate Probability %
        val baseScore = 50
        val favorableBonus = activeFavorable.size * 15
        val negatingPenalty = activeNegating.size * 18
        val retroPenalty = if (subLordPlanet?.starLordIsRetrograde == true) 20 else 0

        val rawPercentage = (baseScore + favorableBonus - negatingPenalty - retroPenalty).coerceIn(15, 95)

        val statusText = when {
            rawPercentage >= 78 -> "Highly Favorable (High Promise)"
            rawPercentage >= 55 -> "Moderate / Favorable Window"
            rawPercentage >= 40 -> "Mixed / Delayed Inflow"
            else -> "Unfavorable / Negated Houses Active"
        }

        val dashaText = "Active Dasha Lord (${chart.currentDasha.mahaDashaLord}) connects with houses ${activeFavorable.joinToString()}."

        val recSummary = if (rawPercentage >= 65) {
            "Cuspal Sub-Lord $subLordName promises ${category.title} through star lord $subLordStarLord. Favorable houses ${activeFavorable.joinToString()} are active."
        } else {
            "Negating house combinations (${activeNegating.joinToString()}) create delay or friction. Remedial color therapy and mantra for $subLordName recommended."
        }

        return EventScore(
            category = category,
            probabilityPercentage = rawPercentage,
            statusText = statusText,
            primarySubLord = subLordName,
            primarySubLordStarLord = subLordStarLord,
            supportingHousesActive = activeFavorable,
            negatingHousesActive = activeNegating,
            dashaSupportText = dashaText,
            recommendationSummary = recSummary
        )
    }
}
