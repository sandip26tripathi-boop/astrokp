package com.example.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.PlacePrediction
import com.example.ui.theme.FavorableGreen
import com.example.ui.theme.GoldAccent
import com.example.ui.theme.NeonCyan

@Composable
fun LocationAutocomplete(
    placePredictions: List<PlacePrediction>,
    isSearching: Boolean,
    isGooglePlacesConfigured: Boolean,
    onSearchQueryChange: (String) -> Unit,
    onPredictionSelected: (PlacePrediction) -> Unit,
    modifier: Modifier = Modifier
) {
    var searchQuery by remember { mutableStateOf("") }
    var showDropdown by remember { mutableStateOf(false) }

    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(16.dp),
        modifier = modifier.fillMaxWidth().testTag("location_autocomplete_card")
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.LocationOn,
                        contentDescription = "Location",
                        tint = GoldAccent
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "LOCATION & TIMEZONE AUTOCOMPLETE",
                        style = MaterialTheme.typography.labelSmall,
                        color = GoldAccent,
                        fontWeight = FontWeight.Bold
                    )
                }

                Surface(
                    color = if (isGooglePlacesConfigured) FavorableGreen.copy(alpha = 0.2f) else MaterialTheme.colorScheme.surfaceVariant,
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = if (isGooglePlacesConfigured) "Google Places Active" else "Offline DB Active",
                        color = if (isGooglePlacesConfigured) FavorableGreen else NeonCyan,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.padding(top = 8.dp))

            OutlinedTextField(
                value = searchQuery,
                onValueChange = { query ->
                    searchQuery = query
                    showDropdown = query.length >= 2
                    onSearchQueryChange(query)
                },
                placeholder = { Text("Search city or address (e.g. Lucknow, Delhi, London)", fontSize = 12.sp) },
                leadingIcon = {
                    if (isSearching) {
                        CircularProgressIndicator(modifier = Modifier.size(18.dp), color = GoldAccent, strokeWidth = 2.dp)
                    } else {
                        Icon(Icons.Default.Search, contentDescription = "Search", tint = GoldAccent)
                    }
                },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = {
                            searchQuery = ""
                            showDropdown = false
                            onSearchQueryChange("")
                        }) {
                            Icon(Icons.Default.Clear, contentDescription = "Clear", tint = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth().testTag("location_search_input"),
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = GoldAccent)
            )

            AnimatedVisibility(visible = showDropdown && placePredictions.isNotEmpty()) {
                Surface(
                    color = MaterialTheme.colorScheme.surfaceVariant,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 6.dp)
                        .border(1.dp, GoldAccent.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                ) {
                    Column(modifier = Modifier.padding(8.dp)) {
                        placePredictions.take(6).forEach { prediction ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        searchQuery = prediction.primaryText
                                        showDropdown = false
                                        onPredictionSelected(prediction)
                                    }
                                    .padding(vertical = 8.dp, horizontal = 10.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = prediction.primaryText,
                                        fontWeight = FontWeight.Bold,
                                        color = GoldAccent,
                                        fontSize = 13.sp
                                    )
                                    if (prediction.secondaryText.isNotBlank()) {
                                        Text(
                                            text = prediction.secondaryText,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                                            fontSize = 11.sp
                                        )
                                    }
                                }

                                Surface(
                                    color = if (prediction.isGooglePlacesResult) GoldAccent.copy(alpha = 0.2f) else NeonCyan.copy(alpha = 0.2f),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Text(
                                        text = if (prediction.isGooglePlacesResult) "Google API" else "Offline DB",
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (prediction.isGooglePlacesResult) GoldAccent else NeonCyan,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
