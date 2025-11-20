package com.anmeldungfinder.app.model;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class ApiResponse {
    @SerializedName("success")
    private boolean success;

    @SerializedName("count")
    private int count;

    @SerializedName("appointments")
    private List<Appointment> appointments;

    public boolean isSuccess() { return success; }
    public int getCount() { return count; }
    public List<Appointment> getAppointments() { return appointments; }
}

