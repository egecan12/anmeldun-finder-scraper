package com.anmeldungfinder.app.network;

import com.google.gson.annotations.SerializedName;

public class DeviceTokenRequest {
    @SerializedName("token")
    private String token;
    
    @SerializedName("platform")
    private String platform;
    
    @SerializedName("userId")
    private String userId;

    public DeviceTokenRequest(String token) {
        this.token = token;
        this.platform = "android-native";
        this.userId = "anonymous";
    }
}

