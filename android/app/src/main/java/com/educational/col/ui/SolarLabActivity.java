package com.educational.col.ui;

import android.graphics.Color;
import android.os.Bundle;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.SeekBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.educational.col.R;
import com.educational.col.data.ColDatabaseHelper;
import com.educational.col.engine.MechanicalSoundEngine;

import java.util.Locale;

public class SolarLabActivity extends AppCompatActivity {

    private static final String[] PLANET_NAMES = {
            "Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"
    };

    private SolarOrbitView solarOrbitView;
    private LinearLayout planetChipContainer;
    private final TextView[] planetChips = new TextView[PLANET_NAMES.length];

    private TextView tvPlanetName, tvPlanetSubtitle, tvMetricDist, tvMetricVel, tvMetricGrav, tvPlanetSummary;
    private TextView tvTimeWarpLabel;

    private ColDatabaseHelper db;
    private MechanicalSoundEngine sound;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_solar_lab);

        db = ColDatabaseHelper.getInstance(this);
        sound = MechanicalSoundEngine.getInstance(this);

        solarOrbitView = findViewById(R.id.solarOrbitView);
        planetChipContainer = findViewById(R.id.planetChipContainer);

        tvPlanetName = findViewById(R.id.tvPlanetName);
        tvPlanetSubtitle = findViewById(R.id.tvPlanetSubtitle);
        tvMetricDist = findViewById(R.id.tvMetricDist);
        tvMetricVel = findViewById(R.id.tvMetricVel);
        tvMetricGrav = findViewById(R.id.tvMetricGrav);
        tvPlanetSummary = findViewById(R.id.tvPlanetSummary);
        tvTimeWarpLabel = findViewById(R.id.tvTimeWarpLabel);

        findViewById(R.id.btnBackSolar).setOnClickListener(v -> finish());

        Button btnLogMission = findViewById(R.id.btnLogSolarMission);
        btnLogMission.setOnClickListener(v -> {
            SolarOrbitView.PlanetBody selected = solarOrbitView.getSelectedPlanet();
            db.recordSolarExperiment(selected.name + " (" + selected.velocityKms + ")", 35);
            sound.playSuccessChime();
            Toast.makeText(this, "Logged " + selected.name + " Telemetry! +35 XP Earned", Toast.LENGTH_SHORT).show();
        });

        buildPlanetChips();

        solarOrbitView.setOnPlanetSelectedListener(planet -> {
            sound.hapticTap(8);
            tvPlanetName.setText(planet.name + "  •  " + planet.tempC);
            tvPlanetSubtitle.setText(planet.subtitle + " • Moons: " + planet.moons);
            tvMetricDist.setText("Orbit: " + planet.distanceAu);
            tvMetricVel.setText("Speed: " + planet.velocityKms);
            tvMetricGrav.setText("Grav: " + planet.gravityMs2);
            tvPlanetSummary.setText(planet.summary);

            for (int i = 0; i < PLANET_NAMES.length; i++) {
                boolean active = PLANET_NAMES[i].equals(planet.name);
                planetChips[i].setBackgroundResource(active ? R.drawable.bg_pill_cyan : R.drawable.bg_btn_outline);
                planetChips[i].setTextColor(Color.parseColor(active ? "#5ED4F5" : "#E8E3D8"));
            }
        });

        Button btnPause = findViewById(R.id.btnSolarPause);
        btnPause.setOnClickListener(v -> {
            solarOrbitView.togglePaused();
            btnPause.setText(solarOrbitView.isPaused() ? "Resume" : "Pause");
            sound.hapticTap(8);
        });

        findViewById(R.id.btnSolarOrbits).setOnClickListener(v -> {
            solarOrbitView.toggleOrbits();
            sound.hapticTap(8);
        });

        findViewById(R.id.btnSolarVectors).setOnClickListener(v -> {
            solarOrbitView.toggleVectors();
            sound.hapticTap(8);
        });

        findViewById(R.id.btnZoomIn).setOnClickListener(v -> {
            solarOrbitView.adjustZoom(0.20f);
            sound.hapticTap(8);
        });

        findViewById(R.id.btnZoomOut).setOnClickListener(v -> {
            solarOrbitView.adjustZoom(-0.20f);
            sound.hapticTap(8);
        });

        SeekBar seekWarp = findViewById(R.id.seekTimeWarp);
        seekWarp.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override
            public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
                float warp = 0.2f + (progress / 100.0f) * 14.8f;
                solarOrbitView.setTimeWarp(warp);
                tvTimeWarpLabel.setText(String.format(Locale.US, "Time Warp: %.1fx", warp));
            }

            @Override
            public void onStartTrackingTouch(SeekBar seekBar) {}

            @Override
            public void onStopTrackingTouch(SeekBar seekBar) {}
        });
    }

    private void buildPlanetChips() {
        float density = getResources().getDisplayMetrics().density;
        for (int i = 0; i < PLANET_NAMES.length; i++) {
            final int idx = i;
            TextView chip = new TextView(this);
            chip.setText(PLANET_NAMES[i]);
            chip.setTextSize(12f);
            chip.setPadding((int) (14 * density), (int) (6 * density), (int) (14 * density), (int) (6 * density));
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
            );
            lp.setMarginEnd((int) (8 * density));
            chip.setLayoutParams(lp);
            chip.setOnClickListener(v -> solarOrbitView.selectPlanetByIndex(idx));
            planetChips[i] = chip;
            planetChipContainer.addView(chip);
        }
    }
}
