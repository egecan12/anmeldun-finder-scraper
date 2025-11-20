package com.anmeldungfinder.app.network;

import com.anmeldungfinder.app.model.ApiResponse;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.POST;

public interface ApiService {
    @GET("/api/appointments")
    Call<ApiResponse> getAppointments();
    
    @GET("/api/appointments/refresh")
    Call<ApiResponse> refreshAppointments();
    
    // Token kaydetme
    @POST("/api/register-device")
    Call<ApiResponse> registerDevice(@Body DeviceTokenRequest request);
}
