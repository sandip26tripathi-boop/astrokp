package com.example.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Palette
import androidx.compose.material.icons.filled.Translate
import androidx.compose.material.icons.filled.WbSunny
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.kp.KPCusp
import com.example.kp.KPEphemerisEngine
import com.example.kp.KPPlanet
import com.example.kp.PanchangData
import com.example.kp.ZodiacSign
import com.example.ui.theme.CelestialViolet
import com.example.ui.theme.GoldAccent
import com.example.ui.theme.NeonCyan
import com.example.ui.theme.RetrogradeAlertRed

enum class ChartStyle {
    NORTH_INDIAN,
    SOUTH_INDIAN
}

enum class DivisionalChartType {
    D1_RASHI,
    D9_NAVAMSHA,
    BHAVA_CHALIT
}

enum class CanvasTheme {
    SAHI_WHITE,  // White background, Gold lines as in Image 2 reference
    COSMIC_DARK // Night background, Gold lines
}

enum class ChartLanguage {
    HINDI,   // "ल", "सू", "च", "मं", "बु", "गु", "शु", "श", "रा", "के"
    ENGLISH  // "L", "Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa", "Ra", "Ke"
}

@Composable
fun ChartViewerScreen(
    chart: KPEphemerisEngine.CalculatedKPChart,
    modifier: Modifier = Modifier
) {
    var chartStyle by remember { mutableStateOf(ChartStyle.NORTH_INDIAN) }
    var chartType by remember { mutableStateOf(DivisionalChartType.D1_RASHI) }
    var canvasTheme by remember { mutableStateOf(CanvasTheme.SAHI_WHITE) }
    var chartLang by remember { mutableStateOf(ChartLanguage.HINDI) }
    var selectedHouseNum by remember { mutableStateOf(1) }

    val scrollState = rememberScrollState()
    val tableHorizontalState = rememberScrollState()

    val selectedCusp = chart.cusps.find { it.houseNumber == selectedHouseNum } ?: chart.cusps.first()
    val selectedSignificator = chart.significators.find { it.houseNumber == selectedHouseNum }
    val occupants = chart.planets.filter { it.houseOccupied == selectedHouseNum }

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp)
            .testTag("chart_viewer_screen")
    ) {
        // Top Header Title
        Column {
            Text(
                text = "SAHI KUNDLI GENERATOR (सच्ची कुंडली)",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = GoldAccent
            )
            Text(
                text = "Traditional North/South Indian Kundli with Exact Zodiac Rashi Numbers & Sub-Lords",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Birth Panchang Card
        PanchangCard(chart.panchang)

        Spacer(modifier = Modifier.height(14.dp))

        // Chart View Mode Controls (D1 / D9 / Chalit + North/South + Theme + Lang)
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(12.dp))
                .padding(8.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                FilterChip(
                    selected = chartType == DivisionalChartType.D1_RASHI,
                    onClick = { chartType = DivisionalChartType.D1_RASHI },
                    label = { Text("D-1 Rashi", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                    colors = FilterChipDefaults.filterChipColors(selectedContainerColor = GoldAccent, selectedLabelColor = Color.Black)
                )
                FilterChip(
                    selected = chartType == DivisionalChartType.D9_NAVAMSHA,
                    onClick = { chartType = DivisionalChartType.D9_NAVAMSHA },
                    label = { Text("D-9 Navamsha", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                    colors = FilterChipDefaults.filterChipColors(selectedContainerColor = GoldAccent, selectedLabelColor = Color.Black)
                )
                FilterChip(
                    selected = chartType == DivisionalChartType.BHAVA_CHALIT,
                    onClick = { chartType = DivisionalChartType.BHAVA_CHALIT },
                    label = { Text("Bhava Chalit", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                    colors = FilterChipDefaults.filterChipColors(selectedContainerColor = GoldAccent, selectedLabelColor = Color.Black)
                )
            }

            Spacer(modifier = Modifier.height(6.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Style Toggles
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    FilterChip(
                        selected = chartStyle == ChartStyle.NORTH_INDIAN,
                        onClick = { chartStyle = ChartStyle.NORTH_INDIAN },
                        label = { Text("North Indian", fontSize = 10.sp) },
                        colors = FilterChipDefaults.filterChipColors(selectedContainerColor = NeonCyan, selectedLabelColor = Color.Black)
                    )
                    FilterChip(
                        selected = chartStyle == ChartStyle.SOUTH_INDIAN,
                        onClick = { chartStyle = ChartStyle.SOUTH_INDIAN },
                        label = { Text("South Indian", fontSize = 10.sp) },
                        colors = FilterChipDefaults.filterChipColors(selectedContainerColor = NeonCyan, selectedLabelColor = Color.Black)
                    )
                }

                // Theme & Language Toggles
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.CenterVertically) {
                    FilterChip(
                        selected = canvasTheme == CanvasTheme.SAHI_WHITE,
                        onClick = {
                            canvasTheme = if (canvasTheme == CanvasTheme.SAHI_WHITE) CanvasTheme.COSMIC_DARK else CanvasTheme.SAHI_WHITE
                        },
                        label = { Text(if (canvasTheme == CanvasTheme.SAHI_WHITE) "White Mode" else "Dark Mode", fontSize = 10.sp) },
                        leadingIcon = { Icon(Icons.Default.Palette, contentDescription = null, modifier = Modifier.size(12.dp)) }
                    )

                    FilterChip(
                        selected = chartLang == ChartLanguage.HINDI,
                        onClick = {
                            chartLang = if (chartLang == ChartLanguage.HINDI) ChartLanguage.ENGLISH else ChartLanguage.HINDI
                        },
                        label = { Text(if (chartLang == ChartLanguage.HINDI) "हिंदी" else "ENG", fontSize = 10.sp) },
                        leadingIcon = { Icon(Icons.Default.Translate, contentDescription = null, modifier = Modifier.size(12.dp)) }
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Interactive Kundli Canvas Box
        Card(
            colors = CardDefaults.cardColors(
                containerColor = if (canvasTheme == CanvasTheme.SAHI_WHITE) Color.White else MaterialTheme.colorScheme.surface
            ),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier
                .fillMaxWidth()
                .border(2.dp, GoldAccent, RoundedCornerShape(16.dp))
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = when (chartType) {
                            DivisionalChartType.D1_RASHI -> "केपी / राशि कुंडली (D-1 Rashi)"
                            DivisionalChartType.D9_NAVAMSHA -> "नवांश कुंडली (D-9 Navamsha)"
                            DivisionalChartType.BHAVA_CHALIT -> "भाव चलित (Bhava Chalit)"
                        },
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = if (canvasTheme == CanvasTheme.SAHI_WHITE) Color(0xFFB71C1C) else GoldAccent
                    )

                    Text(
                        text = "Tap house to inspect",
                        fontSize = 11.sp,
                        color = if (canvasTheme == CanvasTheme.SAHI_WHITE) Color.Gray else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .aspectRatio(1f)
                ) {
                    if (chartStyle == ChartStyle.NORTH_INDIAN) {
                        NorthIndianChartCanvas(
                            cusps = chart.cusps,
                            planets = chart.planets,
                            chartType = chartType,
                            canvasTheme = canvasTheme,
                            chartLang = chartLang,
                            selectedHouse = selectedHouseNum,
                            onHouseSelected = { selectedHouseNum = it }
                        )
                    } else {
                        SouthIndianChartCanvas(
                            cusps = chart.cusps,
                            planets = chart.planets,
                            chartType = chartType,
                            canvasTheme = canvasTheme,
                            chartLang = chartLang,
                            selectedHouse = selectedHouseNum,
                            onHouseSelected = { selectedHouseNum = it }
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Selected House Inspection Card
        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth().testTag("house_detail_card")
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Info, contentDescription = null, tint = GoldAccent)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "HOUSE $selectedHouseNum INSPECTOR (${selectedCusp.sign.signName})",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = GoldAccent
                        )
                    }

                    Surface(
                        color = MaterialTheme.colorScheme.surfaceVariant,
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(
                            text = String.format("%.2f°", selectedCusp.signDegree),
                            color = NeonCyan,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Cusp Sub-Lord Hierarchy Table
                Surface(
                    color = MaterialTheme.colorScheme.surfaceVariant,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        DetailRow("Rashi Number (राशि संख्या):", "${selectedCusp.sign.ordinal + 1} (${selectedCusp.sign.signName})")
                        DetailRow("Sign Lord (राशि स्वामी):", selectedCusp.signLord)
                        DetailRow("Star Lord (नक्षत्र स्वामी):", selectedCusp.starLord, isRetro = selectedCusp.starLordIsRetrograde)
                        DetailRow("Sub-Lord (उप-स्वामी):", selectedCusp.subLord, isHighlight = true)
                        DetailRow("Sub-Sub-Lord (उप-उप-स्वामी):", selectedCusp.subSubLord)
                        DetailRow("D-9 Navamsha Sign:", selectedCusp.navamshaSign.signName)
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Occupants
                Text(
                    text = "Occupying Planets: ${if (occupants.isEmpty()) "None" else occupants.joinToString { "${it.name}${if (it.isRetrograde) " (R)" else ""}${if (it.isCombust) " (C)" else ""}" }}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface,
                    fontWeight = FontWeight.Medium
                )

                Spacer(modifier = Modifier.height(8.dp))

                // 4-Fold Significators
                if (selectedSignificator != null) {
                    Text(
                        text = "4-FOLD SIGNIFICATORS HIERARCHY:",
                        style = MaterialTheme.typography.labelSmall,
                        color = GoldAccent,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(text = "L1 (Star of Occupant): ${selectedSignificator.level1Planets.ifEmpty { listOf("None") }.joinToString()}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(text = "L2 (Occupant): ${selectedSignificator.level2Planets.ifEmpty { listOf("None") }.joinToString()}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(text = "L3 (Star of Owner): ${selectedSignificator.level3Planets.ifEmpty { listOf("None") }.joinToString()}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(text = "L4 (Owner): ${selectedSignificator.level4Planets.joinToString()}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Complete Planetary Longitudes Table
        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text(
                    text = "PLANETARY LONGITUDES & NAKSHATRA PADA TABLE",
                    style = MaterialTheme.typography.labelSmall,
                    color = GoldAccent,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(tableHorizontalState)
                ) {
                    Column {
                        // Header
                        Row(
                            modifier = Modifier
                                .background(MaterialTheme.colorScheme.surfaceVariant)
                                .padding(vertical = 6.dp)
                        ) {
                            listOf("Planet", "Degree", "Sign", "Nakshatra", "Pada", "Navamsha", "House", "Status").forEach { col ->
                                Text(
                                    text = col,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = GoldAccent,
                                    modifier = Modifier.width(80.dp).padding(horizontal = 4.dp)
                                )
                            }
                        }

                        chart.planets.forEach { p ->
                            Row(
                                modifier = Modifier
                                    .padding(vertical = 4.dp)
                                    .border(0.5.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(4.dp))
                            ) {
                                Text(text = p.name, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface, modifier = Modifier.width(80.dp).padding(horizontal = 4.dp))
                                Text(text = String.format("%.2f°", p.signDegree), fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface, modifier = Modifier.width(80.dp).padding(horizontal = 4.dp))
                                Text(text = p.sign.signName, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface, modifier = Modifier.width(80.dp).padding(horizontal = 4.dp))
                                Text(text = p.starName, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface, modifier = Modifier.width(80.dp).padding(horizontal = 4.dp))
                                Text(text = "P${p.nakshatraPada}", fontSize = 11.sp, color = NeonCyan, modifier = Modifier.width(80.dp).padding(horizontal = 4.dp))
                                Text(text = p.navamshaSign.signName, fontSize = 11.sp, color = CelestialViolet, modifier = Modifier.width(80.dp).padding(horizontal = 4.dp))
                                Text(text = "H${p.houseOccupied}", fontSize = 11.sp, color = GoldAccent, modifier = Modifier.width(80.dp).padding(horizontal = 4.dp))
                                Text(
                                    text = "${if (p.isRetrograde) "R " else ""}${if (p.isCombust) "C" else ""}".ifBlank { "Direct" },
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (p.isRetrograde || p.isCombust) RetrogradeAlertRed else Color.Gray,
                                    modifier = Modifier.width(80.dp).padding(horizontal = 4.dp)
                                )
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))
    }
}

@Composable
private fun PanchangCard(p: PanchangData) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.WbSunny, contentDescription = null, tint = GoldAccent)
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "BIRTH PANCHANG (जन्म पंचांग विवरण)",
                    style = MaterialTheme.typography.labelSmall,
                    color = GoldAccent,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            Surface(
                color = MaterialTheme.colorScheme.surfaceVariant,
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(10.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        PanchangItem("Tithi (तिथि):", p.tithiName)
                        PanchangItem("Vara (वार):", "${p.varaName} (${p.hindiVaraName})")
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        PanchangItem("Nakshatra & Pada:", "${p.nakshatraName} - Pad ${p.nakshatraPada}")
                        PanchangItem("Yoga (योग):", p.yogaName)
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        PanchangItem("Karana (करण):", p.karanaName)
                        PanchangItem("Lagna Sign:", p.lagnaSign.signName)
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        PanchangItem("Sun Sign (सूर्य राशि):", p.sunSign.signName)
                        PanchangItem("Moon Sign (चंद्र राशि):", p.moonSign.signName)
                    }
                }
            }
        }
    }
}

@Composable
private fun PanchangItem(label: String, value: String) {
    Column {
        Text(text = label, fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(text = value, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = NeonCyan)
    }
}

@Composable
private fun DetailRow(label: String, value: String, isRetro: Boolean = false, isHighlight: Boolean = false) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = value,
                style = MaterialTheme.typography.bodySmall,
                color = if (isHighlight) GoldAccent else MaterialTheme.colorScheme.onSurface,
                fontWeight = if (isHighlight) FontWeight.Bold else FontWeight.Normal
            )
            if (isRetro) {
                Spacer(modifier = Modifier.width(4.dp))
                Text(text = "[RETRO STAR]", color = RetrogradeAlertRed, fontSize = 9.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

// Map planet name to authentic Hindi / English symbol and color
private fun getPlanetSymbol(name: String, lang: ChartLanguage): String {
    val clean = name.trim().lowercase()
    return when {
        clean.contains("ascendant") || clean.contains("lagna") -> if (lang == ChartLanguage.HINDI) "ल" else "Asc"
        clean.contains("sun") || clean.contains("surya") -> if (lang == ChartLanguage.HINDI) "सू" else "Su"
        clean.contains("moon") || clean.contains("chandra") -> if (lang == ChartLanguage.HINDI) "च" else "Mo"
        clean.contains("mars") || clean.contains("mangal") -> if (lang == ChartLanguage.HINDI) "मं" else "Ma"
        clean.contains("mercury") || clean.contains("budh") -> if (lang == ChartLanguage.HINDI) "बु" else "Me"
        clean.contains("jupiter") || clean.contains("guru") -> if (lang == ChartLanguage.HINDI) "गु" else "Ju"
        clean.contains("venus") || clean.contains("shukra") -> if (lang == ChartLanguage.HINDI) "शु" else "Ve"
        clean.contains("saturn") || clean.contains("shani") -> if (lang == ChartLanguage.HINDI) "श" else "Sa"
        clean.contains("rahu") -> if (lang == ChartLanguage.HINDI) "रा" else "Ra"
        clean.contains("ketu") -> if (lang == ChartLanguage.HINDI) "के" else "Ke"
        clean.contains("uranus") -> if (lang == ChartLanguage.HINDI) "यू" else "Ur"
        clean.contains("neptune") -> if (lang == ChartLanguage.HINDI) "ने" else "Ne"
        clean.contains("pluto") -> if (lang == ChartLanguage.HINDI) "प्लू" else "Pl"
        else -> name.take(2)
    }
}

private fun getPlanetColor(name: String, theme: CanvasTheme): Color {
    val clean = name.trim().lowercase()
    if (theme == CanvasTheme.SAHI_WHITE) {
        return when {
            clean.contains("ascendant") || clean.contains("lagna") -> Color(0xFFD32F2F) // Deep Red
            clean.contains("sun") -> Color(0xFFC62828) // Crimson
            clean.contains("moon") -> Color(0xFFB71C1C) // Maroon
            clean.contains("mars") -> Color(0xFF2E7D32) // Green
            clean.contains("mercury") -> Color(0xFF00838F) // Teal
            clean.contains("jupiter") -> Color(0xFF6A1B9A) // Purple
            clean.contains("venus") -> Color(0xFF1B5E20) // Dark Green
            clean.contains("saturn") -> Color(0xFFBF360C) // Orange/Brown
            clean.contains("rahu") -> Color(0xFF880E4F) // Deep Pink/Maroon
            clean.contains("ketu") -> Color(0xFF795548) // Brown
            clean.contains("uranus") || clean.contains("neptune") || clean.contains("pluto") -> Color(0xFF37474F)
            else -> Color(0xFF212121)
        }
    } else {
        return when {
            clean.contains("ascendant") || clean.contains("lagna") -> Color(0xFFFF5252)
            clean.contains("sun") -> Color(0xFFFF7043)
            clean.contains("moon") -> Color(0xFFE0E0E0)
            clean.contains("mars") -> Color(0xFF66BB6A)
            clean.contains("mercury") -> Color(0xFF26C6DA)
            clean.contains("jupiter") -> Color(0xFFAB47BC)
            clean.contains("venus") -> Color(0xFF81C784)
            clean.contains("saturn") -> Color(0xFFFFB74D)
            clean.contains("rahu") -> Color(0xFFFF4081)
            clean.contains("ketu") -> Color(0xFFBCAAA4)
            else -> Color.White
        }
    }
}

@Composable
private fun NorthIndianChartCanvas(
    cusps: List<KPCusp>,
    planets: List<KPPlanet>,
    chartType: DivisionalChartType,
    canvasTheme: CanvasTheme,
    chartLang: ChartLanguage,
    selectedHouse: Int,
    onHouseSelected: (Int) -> Unit
) {
    val lineStrokeColor = if (canvasTheme == CanvasTheme.SAHI_WHITE) Color(0xFFE5921A) else GoldAccent
    val bgColor = if (canvasTheme == CanvasTheme.SAHI_WHITE) Color.White else Color(0xFF080B11)
    val numberColor = if (canvasTheme == CanvasTheme.SAHI_WHITE) Color(0xFF212121) else Color.White
    val selectedBgColor = Color(0xFFFFD54F).copy(alpha = 0.35f)

    val textMeasurer = rememberTextMeasurer()

    val ascendantSign = when (chartType) {
        DivisionalChartType.D9_NAVAMSHA -> cusps.first().navamshaSign
        else -> cusps.first().sign
    }

    Canvas(
        modifier = Modifier
            .fillMaxSize()
            .pointerInput(Unit) {
                detectTapGestures { offset ->
                    val w = size.width
                    val h = size.height
                    val nx = offset.x / w
                    val ny = offset.y / h

                    val tapped = when {
                        nx in 0.25..0.75 && ny in 0.0..0.50 && (ny < nx) && (ny < 1 - nx) -> 1
                        nx in 0.0..0.50 && ny in 0.0..0.50 && (ny >= nx) && (ny < 1 - nx) -> 2
                        nx in 0.0..0.50 && ny in 0.0..0.50 && (ny < nx) && (ny < 1 - nx) -> 3 // Outer left top
                        nx in 0.0..0.50 && ny in 0.25..0.75 && (nx < ny) && (nx < 1 - ny) -> 4
                        nx in 0.0..0.50 && ny in 0.50..1.0 -> 5
                        nx in 0.25..0.75 && ny in 0.50..1.0 && (ny >= nx) && (ny >= 1 - nx) -> 7
                        nx in 0.50..1.0 && ny in 0.50..1.0 -> 8
                        nx in 0.50..1.0 && ny in 0.25..0.75 -> 10
                        nx in 0.50..1.0 && ny in 0.0..0.50 -> 12
                        else -> 1
                    }
                    onHouseSelected(tapped)
                }
            }
    ) {
        val w = size.width
        val h = size.height

        // 1. Background Fill
        drawRect(color = bgColor, size = Size(w, h))

        // 2. Highlight Selected House
        val selectPath = Path()
        when (selectedHouse) {
            1 -> {
                selectPath.moveTo(w / 2f, 0f)
                selectPath.lineTo(w * 0.75f, h * 0.25f)
                selectPath.lineTo(w / 2f, h / 2f)
                selectPath.lineTo(w * 0.25f, h * 0.25f)
                selectPath.close()
            }
            2 -> {
                selectPath.moveTo(0f, 0f)
                selectPath.lineTo(w / 2f, 0f)
                selectPath.lineTo(w * 0.25f, h * 0.25f)
                selectPath.close()
            }
            3 -> {
                selectPath.moveTo(0f, 0f)
                selectPath.lineTo(0f, h / 2f)
                selectPath.lineTo(w * 0.25f, h * 0.25f)
                selectPath.close()
            }
            4 -> {
                selectPath.moveTo(0f, h / 2f)
                selectPath.lineTo(w * 0.25f, h * 0.25f)
                selectPath.lineTo(w / 2f, h / 2f)
                selectPath.lineTo(w * 0.25f, h * 0.75f)
                selectPath.close()
            }
            5 -> {
                selectPath.moveTo(0f, h / 2f)
                selectPath.lineTo(0f, h)
                selectPath.lineTo(w * 0.25f, h * 0.75f)
                selectPath.close()
            }
            6 -> {
                selectPath.moveTo(0f, h)
                selectPath.lineTo(w / 2f, h)
                selectPath.lineTo(w * 0.25f, h * 0.75f)
                selectPath.close()
            }
            7 -> {
                selectPath.moveTo(w / 2f, h / 2f)
                selectPath.lineTo(w * 0.75f, h * 0.75f)
                selectPath.lineTo(w / 2f, h)
                selectPath.lineTo(w * 0.25f, h * 0.75f)
                selectPath.close()
            }
            8 -> {
                selectPath.moveTo(w / 2f, h)
                selectPath.lineTo(w, h)
                selectPath.lineTo(w * 0.75f, h * 0.75f)
                selectPath.close()
            }
            9 -> {
                selectPath.moveTo(w, h / 2f)
                selectPath.lineTo(w, h)
                selectPath.lineTo(w * 0.75f, h * 0.75f)
                selectPath.close()
            }
            10 -> {
                selectPath.moveTo(w / 2f, h / 2f)
                selectPath.lineTo(w * 0.75f, h * 0.25f)
                selectPath.lineTo(w, h / 2f)
                selectPath.lineTo(w * 0.75f, h * 0.75f)
                selectPath.close()
            }
            11 -> {
                selectPath.moveTo(w, 0f)
                selectPath.lineTo(w, h / 2f)
                selectPath.lineTo(w * 0.75f, h * 0.25f)
                selectPath.close()
            }
            12 -> {
                selectPath.moveTo(w / 2f, 0f)
                selectPath.lineTo(w, 0f)
                selectPath.lineTo(w * 0.75f, h * 0.25f)
                selectPath.close()
            }
        }
        drawPath(path = selectPath, color = selectedBgColor)

        // 3. Draw Outer Border & Grid Lines
        val strokePx = 2.5.dp.toPx()
        drawRect(color = lineStrokeColor, style = Stroke(width = strokePx))

        // Diagonal X lines
        drawLine(color = lineStrokeColor, start = Offset(0f, 0f), end = Offset(w, h), strokeWidth = strokePx)
        drawLine(color = lineStrokeColor, start = Offset(w, 0f), end = Offset(0f, h), strokeWidth = strokePx)

        // Inner Diamond lines
        val diamondPath = Path().apply {
            moveTo(w / 2f, 0f)
            lineTo(w, h / 2f)
            lineTo(w / 2f, h)
            lineTo(0f, h / 2f)
            close()
        }
        drawPath(path = diamondPath, color = lineStrokeColor, style = Stroke(width = strokePx))

        // 4. Position map for Rashi Numbers & Planets in 12 Houses
        val rashiNumberOffsets = listOf(
            Offset(0.50f * w, 0.27f * h), // H1 (Center of top diamond)
            Offset(0.28f * w, 0.14f * h), // H2
            Offset(0.14f * w, 0.28f * h), // H3
            Offset(0.27f * w, 0.50f * h), // H4
            Offset(0.14f * w, 0.70f * h), // H5
            Offset(0.28f * w, 0.84f * h), // H6
            Offset(0.50f * w, 0.71f * h), // H7
            Offset(0.70f * w, 0.84f * h), // H8
            Offset(0.84f * w, 0.70f * h), // H9
            Offset(0.72f * w, 0.50f * h), // H10
            Offset(0.84f * w, 0.28f * h), // H11
            Offset(0.70f * w, 0.14f * h)  // H12
        )

        // Render each house
        for (i in 0 until 12) {
            val houseNum = i + 1
            // Compute Zodiac Rashi Number (1 to 12)
            val rashiNum = ((ascendantSign.ordinal + (houseNum - 1)) % 12) + 1

            // 4a. Render Rashi Number
            val rashiPos = rashiNumberOffsets[i]
            drawText(
                textMeasurer = textMeasurer,
                text = rashiNum.toString(),
                topLeft = Offset(rashiPos.x - 6.dp.toPx(), rashiPos.y - 8.dp.toPx()),
                style = TextStyle(
                    color = numberColor,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
            )

            // 4b. Find Occupants
            val occupantsInHouse = mutableListOf<String>()
            if (houseNum == 1) {
                occupantsInHouse.add(getPlanetSymbol("Lagna", chartLang))
            }

            when (chartType) {
                DivisionalChartType.D9_NAVAMSHA -> {
                    val houseRashi = ZodiacSign.fromOrdinal(rashiNum - 1)
                    planets.filter { it.navamshaSign == houseRashi }.forEach { p ->
                        occupantsInHouse.add(getPlanetSymbol(p.name, chartLang) + if (p.isRetrograde) "R" else "")
                    }
                }
                else -> {
                    planets.filter { it.houseOccupied == houseNum }.forEach { p ->
                        occupantsInHouse.add(getPlanetSymbol(p.name, chartLang) + if (p.isRetrograde) "R" else "")
                    }
                }
            }

            // Draw planets inside house around the number
            drawPlanetsInHouse(
                houseNum = houseNum,
                occupants = occupantsInHouse,
                canvasWidth = w,
                canvasHeight = h,
                theme = canvasTheme,
                textMeasurer = textMeasurer
            )
        }
    }
}

// Helper to draw planets in specific non-overlapping regions inside each North Indian house diamond/triangle
private fun androidx.compose.ui.graphics.drawscope.DrawScope.drawPlanetsInHouse(
    houseNum: Int,
    occupants: List<String>,
    canvasWidth: Float,
    canvasHeight: Float,
    theme: CanvasTheme,
    textMeasurer: androidx.compose.ui.text.TextMeasurer
) {
    if (occupants.isEmpty()) return

    val w = canvasWidth
    val h = canvasHeight

    val planetPositions = when (houseNum) {
        1 -> listOf(Offset(0.48f * w, 0.12f * h), Offset(0.38f * w, 0.19f * h), Offset(0.58f * w, 0.19f * h))
        2 -> listOf(Offset(0.18f * w, 0.08f * h), Offset(0.35f * w, 0.08f * h))
        3 -> listOf(Offset(0.06f * w, 0.18f * h), Offset(0.06f * w, 0.35f * h))
        4 -> listOf(Offset(0.12f * w, 0.50f * h), Offset(0.22f * w, 0.38f * h), Offset(0.22f * w, 0.62f * h))
        5 -> listOf(Offset(0.06f * w, 0.62f * h), Offset(0.06f * w, 0.80f * h))
        6 -> listOf(Offset(0.18f * w, 0.92f * h), Offset(0.35f * w, 0.92f * h))
        7 -> listOf(Offset(0.48f * w, 0.85f * h), Offset(0.38f * w, 0.78f * h), Offset(0.58f * w, 0.78f * h))
        8 -> listOf(Offset(0.64f * w, 0.92f * h), Offset(0.80f * w, 0.92f * h))
        9 -> listOf(Offset(0.90f * w, 0.62f * h), Offset(0.90f * w, 0.80f * h))
        10 -> listOf(Offset(0.85f * w, 0.50f * h), Offset(0.76f * w, 0.38f * h), Offset(0.76f * w, 0.62f * h))
        11 -> listOf(Offset(0.90f * w, 0.18f * h), Offset(0.90f * w, 0.35f * h))
        12 -> listOf(Offset(0.64f * w, 0.08f * h), Offset(0.80f * w, 0.08f * h))
        else -> emptyList()
    }

    occupants.forEachIndexed { idx, symbol ->
        val pos = if (idx < planetPositions.size) planetPositions[idx] else Offset(
            planetPositions.firstOrNull()?.x ?: (0.5f * w),
            (planetPositions.firstOrNull()?.y ?: (0.5f * h)) + (idx * 14.dp.toPx())
        )
        val color = getPlanetColor(symbol, theme)

        drawText(
            textMeasurer = textMeasurer,
            text = symbol,
            topLeft = Offset(pos.x - 8.dp.toPx(), pos.y - 8.dp.toPx()),
            style = TextStyle(
                color = color,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold
            )
        )
    }
}

@Composable
private fun SouthIndianChartCanvas(
    cusps: List<KPCusp>,
    planets: List<KPPlanet>,
    chartType: DivisionalChartType,
    canvasTheme: CanvasTheme,
    chartLang: ChartLanguage,
    selectedHouse: Int,
    onHouseSelected: (Int) -> Unit
) {
    val lineStrokeColor = if (canvasTheme == CanvasTheme.SAHI_WHITE) Color(0xFFE5921A) else GoldAccent
    val bgColor = if (canvasTheme == CanvasTheme.SAHI_WHITE) Color.White else Color(0xFF080B11)
    val textMeasurer = rememberTextMeasurer()

    val ascendantSign = cusps.first().sign

    Canvas(
        modifier = Modifier
            .fillMaxSize()
            .pointerInput(Unit) {
                detectTapGestures { offset ->
                    val w = size.width
                    val nx = (offset.x / (w / 4f)).toInt().coerceIn(0, 3)
                    val ny = (offset.y / (w / 4f)).toInt().coerceIn(0, 3)

                    val signIndex = when {
                        ny == 0 && nx == 1 -> 0 // Pisces
                        ny == 0 && nx == 2 -> 1 // Aries
                        ny == 0 && nx == 3 -> 2 // Taurus
                        ny == 1 && nx == 3 -> 3 // Gemini
                        ny == 2 && nx == 3 -> 4 // Cancer
                        ny == 3 && nx == 3 -> 5 // Leo
                        ny == 3 && nx == 2 -> 6 // Virgo
                        ny == 3 && nx == 1 -> 7 // Libra
                        ny == 3 && nx == 0 -> 8 // Scorpio
                        ny == 2 && nx == 0 -> 9 // Sagittarius
                        ny == 1 && nx == 0 -> 10 // Capricorn
                        else -> 11 // Aquarius
                    }
                    val houseNum = ((signIndex - ascendantSign.ordinal + 12) % 12) + 1
                    onHouseSelected(houseNum)
                }
            }
    ) {
        val w = size.width
        val cell = w / 4f

        drawRect(color = bgColor, size = Size(w, w))

        drawRect(color = lineStrokeColor, style = Stroke(width = 2.5.dp.toPx()))

        for (i in 1..3) {
            drawLine(color = lineStrokeColor, start = Offset(cell * i, 0f), end = Offset(cell * i, w), strokeWidth = 1.dp.toPx())
            drawLine(color = lineStrokeColor, start = Offset(0f, cell * i), end = Offset(w, cell * i), strokeWidth = 1.dp.toPx())
        }

        // Center Box
        drawRect(
            color = if (canvasTheme == CanvasTheme.SAHI_WHITE) Color(0xFFFFF8E1) else Color(0xFF0D111A),
            topLeft = Offset(cell, cell),
            size = Size(cell * 2f, cell * 2f)
        )

        val southSignCoords = listOf(
            Offset(cell * 1.2f, cell * 0.3f), // Pisces
            Offset(cell * 2.2f, cell * 0.3f), // Aries
            Offset(cell * 3.2f, cell * 0.3f), // Taurus
            Offset(cell * 3.2f, cell * 1.3f), // Gemini
            Offset(cell * 3.2f, cell * 2.3f), // Cancer
            Offset(cell * 3.2f, cell * 3.3f), // Leo
            Offset(cell * 2.2f, cell * 3.3f), // Virgo
            Offset(cell * 1.2f, cell * 3.3f), // Libra
            Offset(cell * 0.2f, cell * 3.3f), // Scorpio
            Offset(cell * 0.2f, cell * 2.3f), // Sagittarius
            Offset(cell * 0.2f, cell * 1.3f), // Capricorn
            Offset(cell * 0.2f, cell * 0.3f)  // Aquarius
        )

        for (i in 0 until 12) {
            val rashiNum = i + 1
            val pos = southSignCoords[i]
            val houseNum = ((i - ascendantSign.ordinal + 12) % 12) + 1

            val occupantsInHouse = mutableListOf<String>()
            if (houseNum == 1) occupantsInHouse.add(getPlanetSymbol("Lagna", chartLang))

            planets.filter { it.houseOccupied == houseNum }.forEach { p ->
                occupantsInHouse.add(getPlanetSymbol(p.name, chartLang))
            }

            drawText(
                textMeasurer = textMeasurer,
                text = "$rashiNum (${occupantsInHouse.joinToString()})",
                topLeft = pos,
                style = TextStyle(
                    color = if (canvasTheme == CanvasTheme.SAHI_WHITE) Color.Black else Color.White,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold
                )
            )
        }
    }
}
