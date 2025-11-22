package com.anmeldungfinder.app.network;

import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;
import okhttp3.OkHttpClient;
import java.util.concurrent.TimeUnit;

public class ApiClient {
    // Render'daki backend URL'imiz
    private static final String BASE_URL = "https://anmeldun-finder-api.onrender.com";
    private static Retrofit retrofit = null;

    public static ApiService getApiService() {
        if (retrofit == null) {
            // Timeout süresini uzatalım (Render cold start + Scraping süresi için)
            OkHttpClient client = new OkHttpClient.Builder()
                .connectTimeout(60, TimeUnit.SECONDS) // Bağlantı zaman aşımı
                .readTimeout(60, TimeUnit.SECONDS)    // Okuma zaman aşımı
                .writeTimeout(60, TimeUnit.SECONDS)   // Yazma zaman aşımı
                .build();

            retrofit = new Retrofit.Builder()
                    .baseUrl(BASE_URL)
                    .client(client)
                    .addConverterFactory(GsonConverterFactory.create())
                    .build();
        }
        return retrofit.create(ApiService.class);
    }
}

