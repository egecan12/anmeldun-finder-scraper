package com.anmeldungfinder.app.adapter;

import android.content.Intent;
import android.net.Uri;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.anmeldungfinder.app.R;
import com.anmeldungfinder.app.model.Appointment;
import java.util.ArrayList;
import java.util.List;

public class AppointmentAdapter extends RecyclerView.Adapter<AppointmentAdapter.ViewHolder> {

    private List<Appointment> appointments = new ArrayList<>();

    public void setAppointments(List<Appointment> newAppointments) {
        this.appointments = newAppointments;
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_appointment, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Appointment appointment = appointments.get(position);
        holder.textDate.setText(appointment.getDate());
        holder.textTime.setText(appointment.getTime());

        // Tıklama özelliği: Linki aç 🔗
        holder.itemView.setOnClickListener(v -> {
            String url = appointment.getHref();
            if (url != null && !url.isEmpty()) {
                // Eğer URL tam değilse (relative path ise) domain ekle
                if (!url.startsWith("http")) {
                    url = "https://allaboutberlin.com" + url;
                }
                
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                v.getContext().startActivity(intent);
            }
        });
    }

    @Override
    public int getItemCount() {
        return appointments.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView textDate;
        TextView textTime;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            textDate = itemView.findViewById(R.id.textDate);
            textTime = itemView.findViewById(R.id.textTime);
        }
    }
}

