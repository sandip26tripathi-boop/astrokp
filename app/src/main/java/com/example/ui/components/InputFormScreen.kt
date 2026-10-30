package com.example.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.ChartEntity
import com.example.data.GeoPlaceDatabase
import com.example.data.PlacePrediction
import com.example.kp.ChartInput
import com.example.kp.KPEphemerisEngine
import com.example.ui.theme.FavorableGreen
import com.example.ui.theme.GoldAccent
import com.example.ui.theme.NeonCyan

@Composable
fun InputFormScreen(
    currentInput: ChartInput,
    savedCharts: List<ChartEntity>,
    placePredictions: List<PlacePrediction>,
    isSearchingPlaces: Boolean,
    isGooglePlacesConfigured: Boolean,
    onSearchPlaces: (String) -> Unit,
    onSelectPlacePrediction: (PlacePrediction) -> Unit,
    onUpdateInput: (ChartInput) -> Unit,
    onCalculateChart: () -> Unit,
    onSaveChart: () -> Unit,
    onDeleteChart: (ChartEntity) -> Unit,
    modifier: Modifier = Modifier
) {
    val scrollState = rememberScrollState()

    var name by remember(currentInput) { mutableStateOf(currentInput.name) }
    var yearText by remember(currentInput) { mutableStateOf(currentInput.year.toString()) }
    var monthText by remember(currentInput) { mutableStateOf(currentInput.month.toString()) }
    var dayText by remember(currentInput) { mutableStateOf(currentInput.day.toString()) }
    var hourText by remember(currentInput) { mutableStateOf(currentInput.hour.toString()) }
    var minText by remember(currentInput) { mutableStateOf(currentInput.minute.toString()) }
    var secText by remember(currentInput) { mutableStateOf(currentInput.second.toString()) }

    var latText by remember(currentInput) { mutableStateOf(currentInput.latitude.toString()) }
    var lonText by remember(currentInput) { mutableStateOf(currentInput.longitude.toString()) }
    var tzText by remember(currentInput) { mutableStateOf(currentInput.timezoneOffsetHours.toString()) }
    var locationName by remember(currentInput) { mutableStateOf(currentInput.locationName) }

    var placeSearchQuery by remember { mutableStateOf("") }
    var showSearchResults by remember { mutableStateOf(false) }

    var isHoraryMode by remember(currentInput) { mutableStateOf(currentInput.horarySeedNumber > 0) }
    var horarySeed by remember(currentInput) { mutableStateOf(if (currentInput.horarySeedNumber in 1..249) currentInput.horarySeedNumber else 1) }

    fun syncAndSave() {
        val y = yearText.toIntOrNull() ?: 1995
        val m = monthText.toIntOrNull()?.coerceIn(1, 12) ?: 6
        val d = dayText.toIntOrNull()?.coerceIn(1, 31) ?: 15
        val h = hourText.toIntOrNull()?.coerceIn(0, 23) ?: 10
        val min = minText.toIntOrNull()?.coerceIn(0, 59) ?: 30
        val s = secText.toIntOrNull()?.coerceIn(0, 59) ?: 0

        val lat = latText.toDoubleOrNull() ?: 28.6139
        val lon = lonText.toDoubleOrNull() ?: 77.2090
        val tz = tzText.toDoubleOrNull() ?: 5.5

        val updated = ChartInput(
            name = name.ifBlank { "User Chart" },
            year = y, month = m, day = d,
            hour = h, minute = min, second = s,
            latitude = lat, longitude = lon, timezoneOffsetHours = tz,
            locationName = locationName,
            horarySeedNumber = if (isHoraryMode) horarySeed else 0
        )
        onUpdateInput(updated)
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp)
            .testTag("input_form_screen")
    ) {
        // Top Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "AstroKP Sahi Kundli Input",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = GoldAccent
                )
                Text(
                    text = "Authentic KP & Vedic Astrological Engine",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Button(
                onClick = onSaveChart,
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                modifier = Modifier.testTag("save_chart_button")
            ) {
                Icon(
                    imageVector = Icons.Default.Bookmark,
                    contentDescription = "Save",
                    tint = GoldAccent,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text("Save", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface)
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Saved Charts Drawer Chips
        if (savedCharts.isNotEmpty()) {
            Text(
                text = "SAVED CHARTS & PROFILES",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(6.dp))
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                items(savedCharts) { entity ->
                    Surface(
                        color = MaterialTheme.colorScheme.surfaceVariant,
                        shape = RoundedCornerShape(20.dp),
                        modifier = Modifier.clickable {
                            val input = ChartInput(
                                name = entity.name, year = entity.year, month = entity.month, day = entity.day,
                                hour = entity.hour, minute = entity.minute, second = entity.second,
                                latitude = entity.latitude, longitude = entity.longitude,
                                timezoneOffsetHours = entity.timezoneOffsetHours, locationName = entity.locationName,
                                horarySeedNumber = entity.horarySeedNumber
                            )
                            onUpdateInput(input)
                        }
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Text(
                                text = entity.name,
                                style = MaterialTheme.typography.bodySmall,
                                color = GoldAccent,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            IconButton(
                                onClick = { onDeleteChart(entity) },
                                modifier = Modifier.size(20.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Delete,
                                    contentDescription = "Delete",
                                    tint = MaterialTheme.colorScheme.error,
                                    modifier = Modifier.size(14.dp)
                                )
                            }
                        }
                    }
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
        }

        // Horary / Prashna Mode Toggle Card
        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.AutoAwesome,
                            contentDescription = "Horary",
                            tint = NeonCyan,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text(
                                text = "KP Horary Mode (प्रश्नावली 1-249)",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "For queries without birth details",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                fontSize = 11.sp
                            )
                        }
                    }

                    Switch(
                        checked = isHoraryMode,
                        onCheckedChange = {
                            isHoraryMode = it
                            syncAndSave()
                        },
                        colors = SwitchDefaults.colors(checkedThumbColor = GoldAccent),
                        modifier = Modifier.testTag("horary_mode_switch")
                    )
                }

                AnimatedVisibility(visible = isHoraryMode) {
                    Column(modifier = Modifier.padding(top = 12.dp)) {
                        val currentSeedDetails = KPEphemerisEngine.HORARY_249_SEEDS.getOrNull(horarySeed - 1)
                        Text(
                            text = "Seed Number: $horarySeed / 249",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = GoldAccent
                        )
                        if (currentSeedDetails != null) {
                            Text(
                                text = "Sign: ${currentSeedDetails.sign.signName} (${currentSeedDetails.signLord}) • Star: ${currentSeedDetails.starLord} • Sub: ${currentSeedDetails.subLord}",
                                style = MaterialTheme.typography.bodySmall,
                                color = NeonCyan,
                                fontSize = 12.sp
                            )
                        }

                        Slider(
                            value = horarySeed.toFloat(),
                            onValueChange = {
                                horarySeed = it.toInt().coerceIn(1, 249)
                                syncAndSave()
                            },
                            valueRange = 1f..249f,
                            steps = 248,
                            colors = SliderDefaults.colors(
                                thumbColor = GoldAccent,
                                activeTrackColor = GoldAccent
                            ),
                            modifier = Modifier.testTag("horary_seed_slider")
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Birth Details Form
        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text(
                    text = "PROFILE & BIRTH DETAILS (जन्म विवरण)",
                    style = MaterialTheme.typography.labelSmall,
                    color = GoldAccent,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it; syncAndSave() },
                    label = { Text("Full Name / Client Name") },
                    leadingIcon = { Icon(Icons.Default.Person, contentDescription = null) },
                    modifier = Modifier.fillMaxWidth().testTag("name_input"),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = GoldAccent)
                )

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = "Date of Birth (YYYY / MM / DD)",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = yearText,
                        onValueChange = { yearText = it; syncAndSave() },
                        label = { Text("YYYY") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f).testTag("year_input")
                    )
                    OutlinedTextField(
                        value = monthText,
                        onValueChange = { monthText = it; syncAndSave() },
                        label = { Text("MM") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f).testTag("month_input")
                    )
                    OutlinedTextField(
                        value = dayText,
                        onValueChange = { dayText = it; syncAndSave() },
                        label = { Text("DD") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f).testTag("day_input")
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = "Time of Birth (24hr: HH / MM / SS)",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = hourText,
                        onValueChange = { hourText = it; syncAndSave() },
                        label = { Text("HH") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f).testTag("hour_input")
                    )
                    OutlinedTextField(
                        value = minText,
                        onValueChange = { minText = it; syncAndSave() },
                        label = { Text("MM") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f).testTag("min_input")
                    )
                    OutlinedTextField(
                        value = secText,
                        onValueChange = { secText = it; syncAndSave() },
                        label = { Text("SS") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f).testTag("sec_input")
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // GOOGLE PLACES API REAL-TIME LOCATION SEARCH & RESOLVER
        LocationAutocomplete(
            placePredictions = placePredictions,
            isSearching = isSearchingPlaces,
            isGooglePlacesConfigured = isGooglePlacesConfigured,
            onSearchQueryChange = onSearchPlaces,
            onPredictionSelected = { pred ->
                onSelectPlacePrediction(pred)
            }
        )

        Spacer(modifier = Modifier.height(10.dp))

        // Selected Location Coordinates Details
        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth().testTag("location_details_card")
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                OutlinedTextField(
                    value = locationName,
                    onValueChange = { locationName = it; syncAndSave() },
                    label = { Text("Selected Location Name") },
                    modifier = Modifier.fillMaxWidth().testTag("location_name_input")
                )

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = latText,
                        onValueChange = { latText = it; syncAndSave() },
                        label = { Text("Latitude (°N)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f).testTag("lat_input")
                    )
                    OutlinedTextField(
                        value = lonText,
                        onValueChange = { lonText = it; syncAndSave() },
                        label = { Text("Longitude (°E)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f).testTag("lon_input")
                    )
                    OutlinedTextField(
                        value = tzText,
                        onValueChange = { tzText = it; syncAndSave() },
                        label = { Text("TZ (Hours)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f).testTag("tz_input")
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        Button(
            onClick = {
                syncAndSave()
                onCalculateChart()
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp)
                .testTag("calculate_chart_button"),
            colors = ButtonDefaults.buttonColors(containerColor = GoldAccent)
        ) {
            Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = Color.Black)
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "GENERATE SAHI KUNDLI & KP MATRIX",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = Color.Black
            )
        }

        Spacer(modifier = Modifier.height(30.dp))
    }
}
