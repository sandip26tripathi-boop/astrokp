package com.example.data

import com.example.kp.ChartInput
import kotlinx.coroutines.flow.Flow

class ChartRepository(private val chartDao: ChartDao) {

    val allSavedCharts: Flow<List<ChartEntity>> = chartDao.getAllCharts()

    suspend fun saveChart(input: ChartInput): Long {
        val entity = ChartEntity(
            name = input.name,
            year = input.year,
            month = input.month,
            day = input.day,
            hour = input.hour,
            minute = input.minute,
            second = input.second,
            latitude = input.latitude,
            longitude = input.longitude,
            timezoneOffsetHours = input.timezoneOffsetHours,
            locationName = input.locationName,
            horarySeedNumber = input.horarySeedNumber
        )
        return chartDao.insertChart(entity)
    }

    suspend fun deleteChart(chart: ChartEntity) {
        chartDao.deleteChart(chart)
    }

    fun entityToInput(entity: ChartEntity): ChartInput {
        return ChartInput(
            name = entity.name,
            year = entity.year,
            month = entity.month,
            day = entity.day,
            hour = entity.hour,
            minute = entity.minute,
            second = entity.second,
            latitude = entity.latitude,
            longitude = entity.longitude,
            timezoneOffsetHours = entity.timezoneOffsetHours,
            locationName = entity.locationName,
            horarySeedNumber = entity.horarySeedNumber
        )
    }
}
