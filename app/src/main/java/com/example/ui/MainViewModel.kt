package com.example.ui

import android.app.Application
import androidx.compose.runtime.mutableStateListOf
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.ai.CopilotState
import com.example.ai.GeminiPredictiveCopilot
import com.example.data.AppDatabase
import com.example.data.ChartEntity
import com.example.data.ChartRepository
import com.example.data.GooglePlacesRepository
import com.example.data.PlacePrediction
import com.example.kp.BTRResult
import com.example.kp.ChartInput
import com.example.kp.EventScore
import com.example.kp.GeoPlace
import com.example.kp.KPEphemerisEngine
import com.example.kp.KPEvaluator
import com.example.ui.components.ChatMessage
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: ChartRepository by lazy {
        val db = AppDatabase.getInstance(application)
        ChartRepository(db.chartDao())
    }

    private val placesRepository = GooglePlacesRepository()
    private val copilot = GeminiPredictiveCopilot()

    private val _currentInput = MutableStateFlow(ChartInput())
    val currentInput: StateFlow<ChartInput> = _currentInput.asStateFlow()

    private val _calculatedChart = MutableStateFlow(KPEphemerisEngine.calculateChart(_currentInput.value))
    val calculatedChart: StateFlow<KPEphemerisEngine.CalculatedKPChart> = _calculatedChart.asStateFlow()

    private val _eventScores = MutableStateFlow(KPEvaluator.evaluateAllEvents(_calculatedChart.value))
    val eventScores: StateFlow<List<EventScore>> = _eventScores.asStateFlow()

    private val _btrResult = MutableStateFlow(KPEphemerisEngine.performBTR(_calculatedChart.value))
    val btrResult: StateFlow<BTRResult> = _btrResult.asStateFlow()

    private val _savedCharts = MutableStateFlow<List<ChartEntity>>(emptyList())
    val savedCharts: StateFlow<List<ChartEntity>> = _savedCharts.asStateFlow()

    private val _copilotState = MutableStateFlow<CopilotState>(CopilotState.Idle)
    val copilotState: StateFlow<CopilotState> = _copilotState.asStateFlow()

    private val _placePredictions = MutableStateFlow<List<PlacePrediction>>(emptyList())
    val placePredictions: StateFlow<List<PlacePrediction>> = _placePredictions.asStateFlow()

    private val _isSearchingPlaces = MutableStateFlow(false)
    val isSearchingPlaces: StateFlow<Boolean> = _isSearchingPlaces.asStateFlow()

    val isGooglePlacesConfigured: Boolean
        get() = placesRepository.isApiKeyConfigured

    val chatHistory = mutableStateListOf<ChatMessage>()

    private val _selectedLanguage = MutableStateFlow("English")
    val selectedLanguage: StateFlow<String> = _selectedLanguage.asStateFlow()

    private val _activeTab = MutableStateFlow(0)
    val activeTab: StateFlow<Int> = _activeTab.asStateFlow()

    private var placeSearchJob: Job? = null

    init {
        chatHistory.add(
            ChatMessage(
                sender = "copilot",
                text = "Namaste! I am your Gemini KP Astrology Predictive Copilot. Select an inquiry chip or ask any question about Career, Marriage, Property, or Foreign Travel."
            )
        )

        viewModelScope.launch {
            repository.allSavedCharts.collectLatest { list ->
                _savedCharts.value = list
            }
        }
    }

    fun updateInput(input: ChartInput) {
        _currentInput.value = input
        calculateChart()
    }

    fun calculateChart() {
        val chart = KPEphemerisEngine.calculateChart(_currentInput.value)
        _calculatedChart.value = chart
        _eventScores.value = KPEvaluator.evaluateAllEvents(chart)
        _btrResult.value = KPEphemerisEngine.performBTR(chart)
    }

    fun searchGooglePlaces(query: String) {
        placeSearchJob?.cancel()
        if (query.length < 2) {
            _placePredictions.value = emptyList()
            _isSearchingPlaces.value = false
            return
        }

        placeSearchJob = viewModelScope.launch {
            _isSearchingPlaces.value = true
            delay(300) // Debounce user typing
            val list = placesRepository.getPlacePredictions(query)
            _placePredictions.value = list
            _isSearchingPlaces.value = false
        }
    }

    fun selectPlacePrediction(prediction: PlacePrediction) {
        viewModelScope.launch {
            _isSearchingPlaces.value = true
            val geoPlace = placesRepository.resolvePlaceDetails(prediction)
            if (geoPlace != null) {
                val updated = _currentInput.value.copy(
                    locationName = geoPlace.displayName,
                    latitude = geoPlace.latitude,
                    longitude = geoPlace.longitude,
                    timezoneOffsetHours = geoPlace.timezoneOffsetHours
                )
                updateInput(updated)
            }
            _placePredictions.value = emptyList()
            _isSearchingPlaces.value = false
        }
    }

    fun clearPlaceSearchResults() {
        _placePredictions.value = emptyList()
    }

    fun refreshRulingPlanets() {
        calculateChart()
    }

    fun saveCurrentChart() {
        viewModelScope.launch {
            repository.saveChart(_currentInput.value)
        }
    }

    fun deleteSavedChart(entity: ChartEntity) {
        viewModelScope.launch {
            repository.deleteChart(entity)
        }
    }

    fun setLanguage(lang: String) {
        _selectedLanguage.value = lang
    }

    fun setActiveTab(index: Int) {
        _activeTab.value = index
    }

    fun applyBtrAdjustment(seconds: Int) {
        val cur = _currentInput.value
        val totalSec = cur.second + seconds
        val newSec = (totalSec % 60 + 60) % 60
        val minAdd = if (totalSec < 0) -1 else totalSec / 60
        val newMin = (cur.minute + minAdd % 60 + 60) % 60

        updateInput(cur.copy(minute = newMin, second = newSec))
    }

    fun askCopilot(queryText: String) {
        chatHistory.add(ChatMessage(sender = "user", text = queryText))

        viewModelScope.launch {
            copilot.generatePrediction(
                userQuery = queryText,
                chart = _calculatedChart.value,
                language = _selectedLanguage.value
            ).collect { state ->
                _copilotState.value = state
                if (state is CopilotState.Success) {
                    chatHistory.add(ChatMessage(sender = "copilot", text = state.responseText))
                }
            }
        }
    }
}
