package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "saved_charts")
data class ChartEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val name: String,
    val year: Int,
    val month: Int,
    val day: Int,
    val hour: Int,
    val minute: Int,
    val second: Int,
    val latitude: Double,
    val longitude: Double,
    val timezoneOffsetHours: Double,
    val locationName: String,
    val horarySeedNumber: Int,
    val createdAt: Long = System.currentTimeMillis()
)
