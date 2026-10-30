package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.kp.KPCusp
import com.example.kp.KPEphemerisEngine
import com.example.kp.KPPlanet
import com.example.kp.Significator4Fold
import com.example.ui.theme.CelestialViolet
import com.example.ui.theme.GoldAccent
import com.example.ui.theme.NeonCyan
import com.example.ui.theme.RetrogradeAlertRed

@Composable
fun SubLordMatrixScreen(
    chart: KPEphemerisEngine.CalculatedKPChart,
    modifier: Modifier = Modifier
) {
    val scrollState = rememberScrollState()
    val horizontalState1 = rememberScrollState()
    val horizontalState2 = rememberScrollState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp)
            .testTag("sub_lord_matrix_screen")
    ) {
        // Top Header
        Column {
            Text(
                text = "Nested KP Sub-Lord Matrix",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = GoldAccent
            )
            Text(
                text = "Planet/Cusp • Sign Lord • Star Lord • Sub-Lord (SL) • Sub-Sub-Lord (SSL)",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Pars Fortuna Badge
        Surface(
            color = MaterialTheme.colorScheme.surface,
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier.padding(12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Pars Fortuna Point:",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "${String.format("%.2f°", chart.parsFortuna.totalDegree)} in ${chart.parsFortuna.sign.signName} (Star: ${chart.parsFortuna.starLord}, Sub: ${chart.parsFortuna.subLord})",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Bold,
                    color = GoldAccent
                )
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // 9 Planets Sub-Lord Table
        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text(
                    text = "PLANETARY SUB-LORD MATRIX (9 PLANETS)",
                    style = MaterialTheme.typography.labelSmall,
                    color = GoldAccent,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(horizontalState1)
                ) {
                    Column {
                        // Header Row
                        TableHeaderRow(listOf("Planet", "Degree", "Sign", "Sign Lord", "Star", "Star Lord", "Sub Lord", "Sub-Sub", "Occupied"))

                        chart.planets.forEach { planet ->
                            TablePlanetRow(planet)
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // 12 Cusps Sub-Lord Table
        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text(
                    text = "12 CUSPAL SUB-LORD MATRIX (PLACIDUS CUSPS)",
                    style = MaterialTheme.typography.labelSmall,
                    color = GoldAccent,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(horizontalState2)
                ) {
                    Column {
                        TableHeaderRow(listOf("Cusp", "Degree", "Sign", "Sign Lord", "Star", "Star Lord", "Sub Lord", "Sub-Sub"))

                        chart.cusps.forEach { cusp ->
                            TableCuspRow(cusp)
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // 4-Fold Significators Hierarchy Table
        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text(
                    text = "4-FOLD SIGNIFICATORS HIERARCHY (L1 > L2 > L3 > L4)",
                    style = MaterialTheme.typography.labelSmall,
                    color = GoldAccent,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(10.dp))

                chart.significators.forEach { sig ->
                    SignificatorRow(sig)
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))
    }
}

@Composable
private fun TableHeaderRow(items: List<String>) {
    Row(
        modifier = Modifier
            .background(MaterialTheme.colorScheme.surfaceVariant)
            .padding(vertical = 6.dp)
    ) {
        items.forEach { col ->
            Text(
                text = col,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = GoldAccent,
                modifier = Modifier.width(85.dp).padding(horizontal = 4.dp)
            )
        }
    }
}

@Composable
private fun TablePlanetRow(planet: KPPlanet) {
    Row(
        modifier = Modifier
            .padding(vertical = 4.dp)
            .border(width = 0.5.dp, color = MaterialTheme.colorScheme.outline, shape = RoundedCornerShape(4.dp))
    ) {
        Row(modifier = Modifier.width(85.dp).padding(horizontal = 4.dp)) {
            Text(
                text = "${planet.name}${if (planet.isRetrograde) " (R)" else ""}",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = if (planet.isRetrograde) RetrogradeAlertRed else MaterialTheme.colorScheme.onSurface
            )
        }
        Text(text = String.format("%.2f°", planet.signDegree), fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface, modifier = Modifier.width(85.dp).padding(horizontal = 4.dp))
        Text(text = planet.sign.signName, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface, modifier = Modifier.width(85.dp).padding(horizontal = 4.dp))
        Text(text = planet.signLord, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface, modifier = Modifier.width(85.dp).padding(horizontal = 4.dp))
        Text(text = planet.starName, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface, modifier = Modifier.width(85.dp).padding(horizontal = 4.dp))

        Row(modifier = Modifier.width(85.dp).padding(horizontal = 4.dp)) {
            Text(text = planet.starLord, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface)
            if (planet.starLordIsRetrograde) {
                Text(text = "*", color = RetrogradeAlertRed, fontWeight = FontWeight.Bold, fontSize = 11.sp)
            }
        }

        Text(text = planet.subLord, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = GoldAccent, modifier = Modifier.width(85.dp).padding(horizontal = 4.dp))
        Text(text = planet.subSubLord, fontSize = 11.sp, color = CelestialViolet, modifier = Modifier.width(85.dp).padding(horizontal = 4.dp))
        Text(text = "H${planet.houseOccupied}", fontSize = 11.sp, color = NeonCyan, modifier = Modifier.width(85.dp).padding(horizontal = 4.dp))
    }
}

@Composable
private fun TableCuspRow(cusp: KPCusp) {
    Row(
        modifier = Modifier
            .padding(vertical = 4.dp)
            .border(width = 0.5.dp, color = MaterialTheme.colorScheme.outline, shape = RoundedCornerShape(4.dp))
    ) {
        Text(text = "Cusp ${cusp.houseNumber}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = GoldAccent, modifier = Modifier.width(85.dp).padding(horizontal = 4.dp))
        Text(text = String.format("%.2f°", cusp.signDegree), fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface, modifier = Modifier.width(85.dp).padding(horizontal = 4.dp))
        Text(text = cusp.sign.signName, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface, modifier = Modifier.width(85.dp).padding(horizontal = 4.dp))
        Text(text = cusp.signLord, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface, modifier = Modifier.width(85.dp).padding(horizontal = 4.dp))
        Text(text = cusp.starName, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface, modifier = Modifier.width(85.dp).padding(horizontal = 4.dp))

        Row(modifier = Modifier.width(85.dp).padding(horizontal = 4.dp)) {
            Text(text = cusp.starLord, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface)
            if (cusp.starLordIsRetrograde) {
                Text(text = "*", color = RetrogradeAlertRed, fontWeight = FontWeight.Bold, fontSize = 11.sp)
            }
        }

        Text(text = cusp.subLord, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = GoldAccent, modifier = Modifier.width(85.dp).padding(horizontal = 4.dp))
        Text(text = cusp.subSubLord, fontSize = 11.sp, color = CelestialViolet, modifier = Modifier.width(85.dp).padding(horizontal = 4.dp))
    }
}

@Composable
private fun SignificatorRow(sig: Significator4Fold) {
    Surface(
        color = MaterialTheme.colorScheme.surfaceVariant,
        shape = RoundedCornerShape(8.dp),
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)
    ) {
        Column(modifier = Modifier.padding(10.dp)) {
            Text(
                text = "HOUSE ${sig.houseNumber} SIGNIFICATORS",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = GoldAccent
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(text = "L1 (Star of Occupant): ${sig.level1Planets.ifEmpty { listOf("None") }.joinToString()}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface)
            Text(text = "L2 (Occupant): ${sig.level2Planets.ifEmpty { listOf("None") }.joinToString()}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface)
            Text(text = "L3 (Star of Owner): ${sig.level3Planets.ifEmpty { listOf("None") }.joinToString()}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface)
            Text(text = "L4 (Owner): ${sig.level4Planets.joinToString()}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface)
        }
    }
}
