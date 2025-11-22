package com.anmeldungfinder.app;

import android.os.Bundle;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.anmeldungfinder.app.adapter.AppointmentAdapter;
import com.anmeldungfinder.app.model.ApiResponse;
import com.anmeldungfinder.app.model.Appointment;
import com.anmeldungfinder.app.network.ApiClient;
import com.anmeldungfinder.app.network.ApiService;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

import com.anmeldungfinder.app.network.DeviceTokenRequest;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.messaging.FirebaseMessaging;
import android.util.Log;
import androidx.annotation.NonNull;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

public class MainActivity extends AppCompatActivity {

    private static final String TAG = "MainActivity";
    private static final int REQUEST_CODE_NOTIFICATIONS = 101;

    private RecyclerView recyclerView;
    private AppointmentAdapter adapter;
    private SwipeRefreshLayout swipeRefreshLayout;
    private LinearLayout emptyStateLayout;
    private ProgressBar progressBar;
    private ApiService apiService;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // UI Elemanlarını Bağla
        recyclerView = findViewById(R.id.recyclerView);
        swipeRefreshLayout = findViewById(R.id.swipeRefreshLayout);
        emptyStateLayout = findViewById(R.id.emptyStateLayout);
        progressBar = findViewById(R.id.progressBar);

        // RecyclerView Ayarları
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        adapter = new AppointmentAdapter();
        recyclerView.setAdapter(adapter);

        // Network Servisi
        apiService = ApiClient.getApiService();

        // Bildirim İzni İste (Android 13+)
        checkNotificationPermission();

        // FCM Token al ve sunucuya gönder
        setupFirebaseMessaging();

        // İlk yükleme
        fetchAppointments(false);

        // Pull-to-Refresh
        swipeRefreshLayout.setOnRefreshListener(() -> {
            fetchAppointments(true);
        });
    }

    private void checkNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) !=
                    PackageManager.PERMISSION_GRANTED) {
                
                ActivityCompat.requestPermissions(this,
                        new String[]{Manifest.permission.POST_NOTIFICATIONS},
                        REQUEST_CODE_NOTIFICATIONS);
            }
        }
    }

    private void setupFirebaseMessaging() {
        FirebaseMessaging.getInstance().getToken()
            .addOnCompleteListener(new OnCompleteListener<String>() {
                @Override
                public void onComplete(@NonNull Task<String> task) {
                    if (!task.isSuccessful()) {
                        Log.w(TAG, "Fetching FCM registration token failed", task.getException());
                        return;
                    }

                    // Get new FCM registration token
                    String token = task.getResult();
                    Log.d(TAG, "FCM Token: " + token);

                    // Sunucuya gönder
                    sendRegistrationToServer(token);
                }
            });
    }

    private void sendRegistrationToServer(String token) {
        apiService.registerDevice(new DeviceTokenRequest(token)).enqueue(new Callback<ApiResponse>() {
            @Override
            public void onResponse(Call<ApiResponse> call, Response<ApiResponse> response) {
                if (response.isSuccessful()) {
                    Log.d(TAG, "Token sent to server successfully");
                } else {
                    Log.e(TAG, "Failed to send token: " + response.code());
                }
            }

            @Override
            public void onFailure(Call<ApiResponse> call, Throwable t) {
                Log.e(TAG, "Failed to send token to server", t);
            }
        });
    }

    private void fetchAppointments(boolean isRefresh) {
        if (!isRefresh) {
            progressBar.setVisibility(View.VISIBLE);
        }

        // Refresh isteği ise /refresh endpoint'ine, değilse normal /appointments'a git
        Call<ApiResponse> call = isRefresh ? apiService.refreshAppointments() : apiService.getAppointments();

        call.enqueue(new Callback<ApiResponse>() {
            @Override
            public void onResponse(Call<ApiResponse> call, Response<ApiResponse> response) {
                progressBar.setVisibility(View.GONE);
                swipeRefreshLayout.setRefreshing(false);

                if (response.isSuccessful() && response.body() != null) {
                    List<Appointment> appointments = response.body().getAppointments();
                    
                    if (appointments == null) appointments = new ArrayList<>();

                    adapter.setAppointments(appointments);

                    // Liste boş mu dolu mu kontrolü
                    if (appointments.isEmpty()) {
                        recyclerView.setVisibility(View.GONE);
                        emptyStateLayout.setVisibility(View.VISIBLE);
                    } else {
                        recyclerView.setVisibility(View.VISIBLE);
                        emptyStateLayout.setVisibility(View.GONE);
                    }
                    
                    if (isRefresh) {
                        Toast.makeText(MainActivity.this, getString(R.string.toast_list_updated), Toast.LENGTH_SHORT).show();
                    }
                } else {
                    Toast.makeText(MainActivity.this, getString(R.string.toast_error_prefix) + response.code(), Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ApiResponse> call, Throwable t) {
                progressBar.setVisibility(View.GONE);
                swipeRefreshLayout.setRefreshing(false);
                Toast.makeText(MainActivity.this, getString(R.string.toast_connection_error_prefix) + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }
}

