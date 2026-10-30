package com.example

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.Checklist
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.GridOn
import androidx.compose.material.icons.filled.LightMode
import androidx.compose.material.icons.filled.PieChart
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.SmartToy
import androidx.compose.material.icons.filled.Timeline
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.MainViewModel
import com.example.ui.components.AstrologyChatScreen
import com.example.ui.components.BtrAndRemediesScreen
import com.example.ui.components.ChartViewerScreen
import com.example.ui.components.DashaTimelineScreen
import com.example.ui.components.EventChecklistScreen
import com.example.ui.components.InputFormScreen
import com.example.ui.components.RulingPlanetsBar
import com.example.ui.components.SubLordMatrixScreen
import com.example.ui.theme.AstroKPTheme
import com.example.ui.theme.GoldAccent

data class NavTabItem(
    val title: String,
    val icon: ImageVector,
    val testTag: String
)

val NAV_TABS = listOf(
    NavTabItem("Input", Icons.Default.Edit, "tab_input"),
    NavTabItem("Checklist", Icons.Default.Checklist, "tab_checklist"),
    NavTabItem("Kundli", Icons.Default.PieChart, "tab_kundli"),
    NavTabItem("Matrix", Icons.Default.GridOn, "tab_matrix"),
    NavTabItem("Dasha", Icons.Default.Timeline, "tab_dasha"),
    NavTabItem("BTR", Icons.Default.Build, "tab_btr"),
    NavTabItem("AI Copilot", Icons.Default.SmartToy, "tab_copilot")
)

class MainActivity : ComponentActivity() {

    private val viewModel: MainViewModel by viewModels()

    @OptIn(ExperimentalMaterial3Api::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            val systemDark = isSystemInDarkTheme()
            var darkThemeMode by remember { mutableStateOf(systemDark) }

            val currentInput by viewModel.currentInput.collectAsState()
            val chart by viewModel.calculatedChart.collectAsState()
            val eventScores by viewModel.eventScores.collectAsState()
            val btrResult by viewModel.btrResult.collectAsState()
            val savedCharts by viewModel.savedCharts.collectAsState()
            val copilotState by viewModel.copilotState.collectAsState()
            val selectedLanguage by viewModel.selectedLanguage.collectAsState()
            val activeTab by viewModel.activeTab.collectAsState()

            val placePredictions by viewModel.placePredictions.collectAsState()
            val isSearchingPlaces by viewModel.isSearchingPlaces.collectAsState()

            val context = LocalContext.current

            AstroKPTheme(darkTheme = darkThemeMode) {
                Scaffold(
                    topBar = {
                        TopAppBar(
                            title = {
                                Text(
                                    text = "AstroKP AI Engine",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 18.sp,
                                    color = GoldAccent
                                )
                            },
                            actions = {
                                // Theme Switch
                                IconButton(
                                    onClick = { darkThemeMode = !darkThemeMode },
                                    modifier = Modifier.testTag("theme_toggle_button")
                                ) {
                                    Icon(
                                        imageVector = if (darkThemeMode) Icons.Default.LightMode else Icons.Default.DarkMode,
                                        contentDescription = "Theme",
                                        tint = GoldAccent
                                    )
                                }

                                // Share Dossier Card
                                IconButton(
                                    onClick = {
                                        val shareText = """
                                            🌟 AstroKP Astrology Summary 🌟
                                            Client: ${currentInput.name}
                                            Active Dasha: ${chart.currentDasha.mahaDashaLord} / ${chart.currentDasha.antardashaLord}
                                            10th Cusp Sub-Lord: ${chart.cusps.find { it.houseNumber == 10 }?.subLord}
                                            Top Event Promise: ${eventScores.firstOrNull()?.category?.title} (${eventScores.firstOrNull()?.probabilityPercentage}%)
                                            
                                            Generated via AstroKP AI Engine
                                        """.trimIndent()

                                        val intent = Intent(Intent.ACTION_SEND).apply {
                                            type = "text/plain"
                                            putExtra(Intent.EXTRA_SUBJECT, "AstroKP Report - ${currentInput.name}")
                                            putExtra(Intent.EXTRA_TEXT, shareText)
                                        }
                                        context.startActivity(Intent.createChooser(intent, "Share KP Dossier"))
                                    },
                                    modifier = Modifier.testTag("share_dossier_button")
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Share,
                                        contentDescription = "Share Dossier",
                                        tint = GoldAccent
                                    )
                                }
                            },
                            colors = TopAppBarDefaults.topAppBarColors(
                                containerColor = MaterialTheme.colorScheme.background
                            )
                        )
                    },
                    bottomBar = {
                        NavigationBar(
                            containerColor = MaterialTheme.colorScheme.surface,
                            tonalElevation = 8.dp
                        ) {
                            NAV_TABS.forEachIndexed { index, tab ->
                                NavigationBarItem(
                                    selected = activeTab == index,
                                    onClick = { viewModel.setActiveTab(index) },
                                    icon = {
                                        Icon(
                                            imageVector = tab.icon,
                                            contentDescription = tab.title
                                        )
                                    },
                                    label = {
                                        Text(
                                            text = tab.title,
                                            fontSize = 9.sp,
                                            fontWeight = if (activeTab == index) FontWeight.Bold else FontWeight.Normal
                                        )
                                    },
                                    colors = NavigationBarItemDefaults.colors(
                                        selectedIconColor = GoldAccent,
                                        selectedTextColor = GoldAccent,
                                        indicatorColor = MaterialTheme.colorScheme.surfaceVariant
                                    ),
                                    modifier = Modifier.testTag(tab.testTag)
                                )
                            }
                        }
                    }
                ) { innerPadding ->
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                    ) {
                        // Real-Time Ruling Planets Sticky HUD Header
                        RulingPlanetsBar(
                            rulingPlanets = chart.rulingPlanets,
                            onRefreshRP = { viewModel.refreshRulingPlanets() }
                        )

                        // Main Screen View Switcher
                        Box(modifier = Modifier.weight(1f)) {
                            when (activeTab) {
                                0 -> InputFormScreen(
                                    currentInput = currentInput,
                                    savedCharts = savedCharts,
                                    placePredictions = placePredictions,
                                    isSearchingPlaces = isSearchingPlaces,
                                    isGooglePlacesConfigured = viewModel.isGooglePlacesConfigured,
                                    onSearchPlaces = { viewModel.searchGooglePlaces(it) },
                                    onSelectPlacePrediction = { viewModel.selectPlacePrediction(it) },
                                    onUpdateInput = { viewModel.updateInput(it) },
                                    onCalculateChart = {
                                        viewModel.calculateChart()
                                        viewModel.setActiveTab(1)
                                    },
                                    onSaveChart = { viewModel.saveCurrentChart() },
                                    onDeleteChart = { viewModel.deleteSavedChart(it) }
                                )

                                1 -> EventChecklistScreen(
                                    eventScores = eventScores,
                                    onAskCopilotForEvent = { score ->
                                        viewModel.setActiveTab(6)
                                        viewModel.askCopilot("Explain the KP timing and house promise for ${score.category.title} (${score.probabilityPercentage}% Favorable). Active Sub-Lord: ${score.primarySubLord}.")
                                    }
                                )

                                2 -> ChartViewerScreen(chart = chart)

                                3 -> SubLordMatrixScreen(chart = chart)

                                4 -> DashaTimelineScreen(chart = chart)

                                5 -> BtrAndRemediesScreen(
                                    chart = chart,
                                    btrResult = btrResult,
                                    onApplyBtrAdjustment = { viewModel.applyBtrAdjustment(it) }
                                )

                                6 -> AstrologyChatScreen(
                                    chatHistory = viewModel.chatHistory,
                                    copilotState = copilotState,
                                    selectedLanguage = selectedLanguage,
                                    onLanguageToggle = { viewModel.setLanguage(it) },
                                    onSendMessage = { viewModel.askCopilot(it) }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
