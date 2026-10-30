package com.example.data

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface ChartDao {

    @Query("SELECT * FROM saved_charts ORDER BY createdAt DESC")
    fun getAllCharts(): Flow<List<ChartEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertChart(chart: ChartEntity): Long

    @Delete
    suspend fun deleteChart(chart: ChartEntity)

    @Query("DELETE FROM saved_charts WHERE id = :id")
    suspend fun deleteChartById(id: Long)
}
