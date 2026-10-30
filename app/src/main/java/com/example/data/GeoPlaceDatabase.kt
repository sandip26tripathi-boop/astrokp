package com.example.data

import com.example.kp.GeoPlace

object GeoPlaceDatabase {

    val GLOBAL_PLACES: List<GeoPlace> = listOf(
        // India - Major Metros & Capitals
        GeoPlace("New Delhi", "Delhi, India", 28.6139, 77.2090, 5.5),
        GeoPlace("Mumbai", "Maharashtra, India", 19.0760, 72.8777, 5.5),
        GeoPlace("Bengaluru (Bangalore)", "Karnataka, India", 12.9716, 77.5946, 5.5),
        GeoPlace("Kolkata", "West Bengal, India", 22.5726, 88.3639, 5.5),
        GeoPlace("Chennai", "Tamil Nadu, India", 13.0827, 80.2707, 5.5),
        GeoPlace("Hyderabad", "Telangana, India", 17.3850, 78.4867, 5.5),
        GeoPlace("Ahmedabad", "Gujarat, India", 23.0225, 72.5714, 5.5),
        GeoPlace("Pune", "Maharashtra, India", 18.5204, 73.8567, 5.5),
        GeoPlace("Jaipur", "Rajasthan, India", 26.9124, 75.7873, 5.5),
        GeoPlace("Lucknow", "Uttar Pradesh, India", 26.8467, 80.9462, 5.5),
        GeoPlace("Varanasi (Kashi)", "Uttar Pradesh, India", 25.3176, 82.9739, 5.5),
        GeoPlace("Patna", "Bihar, India", 25.5941, 85.1376, 5.5),
        GeoPlace("Bhopal", "Madhya Pradesh, India", 23.2599, 77.4126, 5.5),
        GeoPlace("Chandigarh", "Punjab & Haryana, India", 30.7333, 76.7794, 5.5),
        GeoPlace("Dehradun", "Uttarakhand, India", 30.3165, 78.0322, 5.5),
        GeoPlace("Ranchi", "Jharkhand, India", 23.3441, 85.3096, 5.5),
        GeoPlace("Bhubaneswar", "Odisha, India", 20.2961, 85.8245, 5.5),
        GeoPlace("Guwahati", "Assam, India", 26.1445, 91.7362, 5.5),
        GeoPlace("Raipur", "Chhattisgarh, India", 21.2514, 81.6296, 5.5),
        GeoPlace("Thiruvananthapuram", "Kerala, India", 8.5241, 76.9366, 5.5),
        GeoPlace("Panaji", "Goa, India", 15.4909, 73.8278, 5.5),
        GeoPlace("Srinagar", "Jammu & Kashmir, India", 34.0837, 74.7973, 5.5),
        GeoPlace("Shimla", "Himachal Pradesh, India", 31.1048, 77.1734, 5.5),

        // Spiritual & Sacred Indian Towns
        GeoPlace("Ayodhya", "Uttar Pradesh, India", 26.7922, 82.1998, 5.5),
        GeoPlace("Mathura", "Uttar Pradesh, India", 27.4924, 77.6737, 5.5),
        GeoPlace("Vrindavan", "Uttar Pradesh, India", 27.5706, 77.7006, 5.5),
        GeoPlace("Haridwar", "Uttarakhand, India", 29.9457, 78.1642, 5.5),
        GeoPlace("Rishikesh", "Uttarakhand, India", 30.0869, 78.2676, 5.5),
        GeoPlace("Ujjain", "Madhya Pradesh, India", 23.1765, 75.7885, 5.5),
        GeoPlace("Puri", "Odisha, India", 19.8135, 85.8312, 5.5),
        GeoPlace("Kedarnath", "Uttarakhand, India", 30.7346, 79.0669, 5.5),
        GeoPlace("Badrinath", "Uttarakhand, India", 30.7433, 79.4938, 5.5),
        GeoPlace("Tirupati", "Andhra Pradesh, India", 13.6288, 79.4192, 5.5),
        GeoPlace("Rameswaram", "Tamil Nadu, India", 9.2876, 79.3129, 5.5),
        GeoPlace("Madurai", "Tamil Nadu, India", 9.9252, 78.1198, 5.5),
        GeoPlace("Gaya", "Bihar, India", 24.7914, 85.0002, 5.5),
        GeoPlace("Amritsar", "Punjab, India", 31.6340, 74.8723, 5.5),
        GeoPlace("Dwarka", "Gujarat, India", 22.2442, 68.9685, 5.5),
        GeoPlace("Shirdi", "Maharashtra, India", 19.7645, 74.4762, 5.5),
        GeoPlace("Nashik", "Maharashtra, India", 19.9975, 73.7898, 5.5),

        // Major Districts & Industrial Cities (India)
        GeoPlace("Kanpur", "Uttar Pradesh, India", 26.4499, 80.3319, 5.5),
        GeoPlace("Prayagraj (Allahabad)", "Uttar Pradesh, India", 25.4358, 81.8463, 5.5),
        GeoPlace("Gorakhpur", "Uttar Pradesh, India", 26.7606, 83.3732, 5.5),
        GeoPlace("Noida", "Uttar Pradesh, India", 28.5355, 77.3910, 5.5),
        GeoPlace("Ghaziabad", "Uttar Pradesh, India", 28.6692, 77.4538, 5.5),
        GeoPlace("Gurugram (Gurgaon)", "Haryana, India", 28.4595, 77.0266, 5.5),
        GeoPlace("Faridabad", "Haryana, India", 28.4089, 77.3178, 5.5),
        GeoPlace("Agra", "Uttar Pradesh, India", 27.1767, 78.0081, 5.5),
        GeoPlace("Meerut", "Uttar Pradesh, India", 28.9845, 77.7064, 5.5),
        GeoPlace("Aligarh", "Uttar Pradesh, India", 27.8974, 78.0880, 5.5),
        GeoPlace("Bareilly", "Uttar Pradesh, India", 28.3670, 79.4304, 5.5),
        GeoPlace("Nagpur", "Maharashtra, India", 21.1458, 79.0882, 5.5),
        GeoPlace("Indore", "Madhya Pradesh, India", 22.7196, 75.8577, 5.5),
        GeoPlace("Surat", "Gujarat, India", 21.1702, 72.8311, 5.5),
        GeoPlace("Vadodara", "Gujarat, India", 22.3072, 73.1812, 5.5),
        GeoPlace("Rajkot", "Gujarat, India", 22.3039, 70.8022, 5.5),
        GeoPlace("Ludhiana", "Punjab, India", 30.9010, 75.8573, 5.5),
        GeoPlace("Jalandhar", "Punjab, India", 31.3260, 75.5762, 5.5),
        GeoPlace("Udaipur", "Rajasthan, India", 24.5854, 73.7125, 5.5),
        GeoPlace("Jodhpur", "Rajasthan, India", 26.2389, 73.0243, 5.5),
        GeoPlace("Kota", "Rajasthan, India", 25.2138, 75.8648, 5.5),
        GeoPlace("Gwalior", "Madhya Pradesh, India", 26.2183, 78.1828, 5.5),
        GeoPlace("Jabalpur", "Madhya Pradesh, India", 23.1815, 79.9864, 5.5),
        GeoPlace("Visakhapatnam", "Andhra Pradesh, India", 17.6868, 83.2185, 5.5),
        GeoPlace("Vijayawada", "Andhra Pradesh, India", 16.5062, 80.6480, 5.5),
        GeoPlace("Coimbatore", "Tamil Nadu, India", 11.0168, 76.9558, 5.5),
        GeoPlace("Kochi (Cochin)", "Kerala, India", 9.9312, 76.2673, 5.5),
        GeoPlace("Kozhikode (Calicut)", "Kerala, India", 11.2588, 75.7804, 5.5),
        GeoPlace("Mysore", "Karnataka, India", 12.2958, 76.6394, 5.5),
        GeoPlace("Mangalore", "Karnataka, India", 12.9141, 74.8560, 5.5),
        GeoPlace("Jamshedpur", "Jharkhand, India", 22.8046, 86.2029, 5.5),
        GeoPlace("Dhanbad", "Jharkhand, India", 23.7957, 86.4304, 5.5),
        GeoPlace("Cuttack", "Odisha, India", 20.4625, 85.8828, 5.5),
        GeoPlace("Siliguri", "West Bengal, India", 26.7271, 88.3953, 5.5),
        GeoPlace("Muzaffarpur", "Bihar, India", 26.1209, 85.3647, 5.5),
        GeoPlace("Bhagalpur", "Bihar, India", 25.2425, 86.9842, 5.5),
        GeoPlace("Darbhanga", "Bihar, India", 26.1542, 85.8918, 5.5),

        // South Asia Neighbors
        GeoPlace("Kathmandu", "Nepal", 27.7172, 85.3240, 5.75),
        GeoPlace("Pokhara", "Nepal", 28.2096, 83.9856, 5.75),
        GeoPlace("Janakpur", "Nepal", 26.7288, 85.9254, 5.75),
        GeoPlace("Dhaka", "Bangladesh", 23.8103, 90.4125, 6.0),
        GeoPlace("Chittagong", "Bangladesh", 22.3569, 91.7832, 6.0),
        GeoPlace("Colombo", "Sri Lanka", 6.9271, 79.8612, 5.5),
        GeoPlace("Karachi", "Pakistan", 24.8607, 67.0011, 5.0),
        GeoPlace("Lahore", "Pakistan", 31.5204, 74.3587, 5.0),
        GeoPlace("Islamabad", "Pakistan", 33.6844, 73.0479, 5.0),

        // Middle East
        GeoPlace("Dubai", "United Arab Emirates", 25.2048, 55.2708, 4.0),
        GeoPlace("Abu Dhabi", "United Arab Emirates", 24.4539, 54.3773, 4.0),
        GeoPlace("Sharjah", "United Arab Emirates", 25.3463, 55.4209, 4.0),
        GeoPlace("Doha", "Qatar", 25.2854, 51.5310, 3.0),
        GeoPlace("Riyadh", "Saudi Arabia", 24.7136, 46.6753, 3.0),
        GeoPlace("Jeddah", "Saudi Arabia", 21.5433, 39.1728, 3.0),
        GeoPlace("Muscat", "Oman", 23.5880, 58.3829, 4.0),
        GeoPlace("Kuwait City", "Kuwait", 29.3759, 47.9774, 3.0),

        // Americas
        GeoPlace("New York", "NY, United States", 40.7128, -74.0060, -5.0),
        GeoPlace("Los Angeles", "CA, United States", 34.0522, -118.2437, -8.0),
        GeoPlace("Chicago", "IL, United States", 41.8781, -87.6298, -6.0),
        GeoPlace("Houston", "TX, United States", 29.7604, -95.3698, -6.0),
        GeoPlace("San Francisco", "CA, United States", 37.7749, -122.4194, -8.0),
        GeoPlace("San Jose / Silicon Valley", "CA, United States", 37.3382, -121.8863, -8.0),
        GeoPlace("Seattle", "WA, United States", 47.6062, -122.3321, -8.0),
        GeoPlace("Dallas", "TX, United States", 32.7767, -96.7970, -6.0),
        GeoPlace("Washington D.C.", "United States", 38.9072, -77.0369, -5.0),
        GeoPlace("Toronto", "Ontario, Canada", 43.6532, -79.3832, -5.0),
        GeoPlace("Vancouver", "BC, Canada", 49.2827, -123.1207, -8.0),

        // Europe & UK
        GeoPlace("London", "United Kingdom", 51.5074, -0.1278, 0.0),
        GeoPlace("Birmingham", "United Kingdom", 52.4862, -1.8904, 0.0),
        GeoPlace("Manchester", "United Kingdom", 53.4808, -2.2426, 0.0),
        GeoPlace("Paris", "France", 48.8566, 2.3522, 1.0),
        GeoPlace("Berlin", "Germany", 52.5200, 13.4050, 1.0),
        GeoPlace("Frankfurt", "Germany", 50.1109, 8.6821, 1.0),
        GeoPlace("Amsterdam", "Netherlands", 52.3676, 4.9041, 1.0),
        GeoPlace("Zurich", "Switzerland", 47.3769, 8.5417, 1.0),

        // Asia Pacific & Africa
        GeoPlace("Singapore", "Singapore", 1.3521, 103.8198, 8.0),
        GeoPlace("Tokyo", "Japan", 35.6762, 139.6503, 9.0),
        GeoPlace("Sydney", "Australia", -33.8688, 151.2093, 10.0),
        GeoPlace("Melbourne", "Australia", -37.8136, 144.9631, 10.0),
        GeoPlace("Bangkok", "Thailand", 13.7563, 100.5018, 7.0),
        GeoPlace("Kuala Lumpur", "Malaysia", 3.1390, 101.6869, 8.0),
        GeoPlace("Auckland", "New Zealand", -36.8485, 174.7633, 12.0)
    )

    fun searchPlaces(query: String): List<GeoPlace> {
        if (query.isBlank()) return GLOBAL_PLACES.take(12)
        val lower = query.lowercase().trim()
        return GLOBAL_PLACES.filter { place ->
            place.cityName.lowercase().contains(lower) ||
                    place.stateOrCountry.lowercase().contains(lower)
        }.take(20)
    }
}
