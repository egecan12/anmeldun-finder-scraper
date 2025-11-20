package com.anmeldungfinder.app.model;

import com.google.gson.annotations.SerializedName;

public class Appointment {
    @SerializedName("date")
    private String date;

    @SerializedName("time")
    private String time;

    @SerializedName("fullText")
    private String fullText;

    @SerializedName("href")
    private String href;

    public String getDate() { return date; }
    public String getTime() { return time; }
    public String getFullText() { return fullText; }
    public String getHref() { return href; }
}

