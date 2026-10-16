package com.educational.col.ui;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.DashPathEffect;
import android.graphics.Paint;
import android.graphics.RectF;
import android.util.AttributeSet;
import android.view.MotionEvent;
import android.view.View;

import java.util.Random;

public class SolarOrbitView extends View {

    public static class PlanetBody {
        public final String name;
        public final String subtitle;
        public final float orbitRadiusRatio;
        public final float angularSpeed; // rad/sec at 1x
        public final float radiusDp;
        public final int color;
        public final String distanceAu;
        public final String velocityKms;
        public final String gravityMs2;
        public final String tempC;
        public final String moons;
        public final String summary;
        public float currentAngle;
        public float screenX;
        public float screenY;

        public PlanetBody(String name, String subtitle, float orbitRadiusRatio, float angularSpeed,
                          float radiusDp, int color, String distanceAu, String velocityKms,
                          String gravityMs2, String tempC, String moons, String summary, float startAngle) {
            this.name = name;
            this.subtitle = subtitle;
            this.orbitRadiusRatio = orbitRadiusRatio;
            this.angularSpeed = angularSpeed;
            this.radiusDp = radiusDp;
            this.color = color;
            this.distanceAu = distanceAu;
            this.velocityKms = velocityKms;
            this.gravityMs2 = gravityMs2;
            this.tempC = tempC;
            this.moons = moons;
            this.summary = summary;
            this.currentAngle = startAngle;
        }
    }

    public interface OnPlanetSelectedListener {
        void onPlanetSelected(PlanetBody planet);
    }

    private final PlanetBody[] planets = new PlanetBody[]{
            new PlanetBody("Mercury", "Inner Silicate World", 0.13f, 1.65f, 4.5f,
                    Color.parseColor("#A8A29E"), "0.39 AU", "47.4 km/s", "3.7 m/s²", "167 °C", "0",
                    "Fastest orbital velocity in the Solar System; extreme thermal swings from -180 °C to 430 °C.", 0.4f),
            new PlanetBody("Venus", "Super-Greenhouse Atmosphere", 0.20f, 1.18f, 6.2f,
                    Color.parseColor("#FBBF24"), "0.72 AU", "35.0 km/s", "8.87 m/s²", "464 °C", "0",
                    "Retrograde axial rotation with a crushing 92-bar CO₂ atmosphere and sulfuric acid clouds.", 1.9f),
            new PlanetBody("Earth", "Home Biosphere & Lunar System", 0.28f, 0.92f, 6.8f,
                    Color.parseColor("#38BDF8"), "1.00 AU", "29.8 km/s", "9.81 m/s²", "15 °C", "1 (Luna)",
                    "Liquid-water ocean world shielded by a dipolar magnetosphere and stabilized by the Moon.", 3.4f),
            new PlanetBody("Mars", "The Red Frontier", 0.36f, 0.72f, 5.4f,
                    Color.parseColor("#F97316"), "1.52 AU", "24.1 km/s", "3.72 m/s²", "-65 °C", "2 (Phobos, Deimos)",
                    "Home to Olympus Mons (21.9 km volcano) and Valles Marineris canyon system.", 5.1f),
            new PlanetBody("Jupiter", "Gas Giant & Gravity Shield", 0.52f, 0.43f, 11.5f,
                    Color.parseColor("#F59E0B"), "5.20 AU", "13.1 km/s", "24.79 m/s²", "-110 °C", "95 (Io, Europa...)",
                    "Massive hydrogen-helium giant whose gravity shapes the Asteroid Belt and deflects comets.", 0.9f),
            new PlanetBody("Saturn", "Ringed Gas Giant", 0.66f, 0.31f, 9.8f,
                    Color.parseColor("#FDE68A"), "9.58 AU", "9.7 km/s", "10.44 m/s²", "-140 °C", "146 (Titan, Enceladus)",
                    "Spectacular ice-ring system extending 282,000 km and cryo-active moon Enceladus.", 2.7f),
            new PlanetBody("Uranus", "Tilted Ice Giant", 0.79f, 0.21f, 8.0f,
                    Color.parseColor("#67E8F9"), "19.20 AU", "6.8 km/s", "8.69 m/s²", "-195 °C", "28 (Titania, Oberon)",
                    "Rotates on its side at a 97.8° axial tilt with a methane-rich cyan atmosphere.", 4.4f),
            new PlanetBody("Neptune", "Supersonic Ice Giant", 0.91f, 0.16f, 7.8f,
                    Color.parseColor("#60A5FA"), "30.05 AU", "5.4 km/s", "11.15 m/s²", "-200 °C", "16 (Triton)",
                    "Outermost major planet with 2,100 km/h supersonic winds and captured Kuiper moon Triton.", 5.8f)
    };

    private final float[] starX = new float[110];
    private final float[] starY = new float[110];
    private final int[] starAlpha = new int[110];
    private final float[] asteroidAngles = new float[140];
    private final float[] asteroidRadii = new float[140];

    private final Paint bgPaint = new Paint();
    private final Paint orbitPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint planetPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint labelPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint vectorPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint reticlePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final RectF ringRect = new RectF();

    private float timeWarp = 1.0f;
    private float zoomFactor = 1.0f;
    private boolean showOrbits = true;
    private boolean showVectors = true;
    private boolean showLabels = true;
    private boolean paused = false;
    private int selectedIndex = 2; // Earth default
    private long lastFrameNs = 0L;
    private float moonAngle = 0f;

    private OnPlanetSelectedListener listener;

    public SolarOrbitView(Context context) {
        super(context);
        init();
    }

    public SolarOrbitView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    private void init() {
        Random rng = new Random(42L);
        for (int i = 0; i < starX.length; i++) {
            starX[i] = rng.nextFloat();
            starY[i] = rng.nextFloat();
            starAlpha[i] = 70 + rng.nextInt(175);
        }
        for (int i = 0; i < asteroidAngles.length; i++) {
            asteroidAngles[i] = (float) (rng.nextFloat() * Math.PI * 2.0);
            asteroidRadii[i] = 0.425f + (rng.nextFloat() * 0.045f);
        }

        orbitPaint.setStyle(Paint.Style.STROKE);
        orbitPaint.setStrokeWidth(2.2f);
        orbitPaint.setColor(Color.parseColor("#285ED4F5"));
        orbitPaint.setPathEffect(new DashPathEffect(new float[]{8f, 8f}, 0f));

        labelPaint.setColor(Color.parseColor("#E8E3D8"));
        labelPaint.setTextSize(26f);
        labelPaint.setFakeBoldText(true);

        vectorPaint.setStyle(Paint.Style.STROKE);
        vectorPaint.setStrokeWidth(3.5f);
        vectorPaint.setColor(Color.parseColor("#34D399"));

        reticlePaint.setStyle(Paint.Style.STROKE);
        reticlePaint.setStrokeWidth(3.5f);
        reticlePaint.setColor(Color.parseColor("#F2B84B"));
    }

    public void setOnPlanetSelectedListener(OnPlanetSelectedListener l) {
        this.listener = l;
        if (l != null) {
            l.onPlanetSelected(planets[selectedIndex]);
        }
    }

    public PlanetBody getSelectedPlanet() {
        return planets[selectedIndex];
    }

    public void selectPlanetByIndex(int index) {
        if (index >= 0 && index < planets.length) {
            selectedIndex = index;
            if (listener != null) {
                listener.onPlanetSelected(planets[selectedIndex]);
            }
            invalidate();
        }
    }

    public void setTimeWarp(float warp) {
        this.timeWarp = Math.max(0.1f, Math.min(25.0f, warp));
    }

    public float getTimeWarp() {
        return timeWarp;
    }

    public void adjustZoom(float delta) {
        this.zoomFactor = Math.max(0.65f, Math.min(2.2f, this.zoomFactor + delta));
        invalidate();
    }

    public void toggleOrbits() {
        this.showOrbits = !this.showOrbits;
        invalidate();
    }

    public void toggleVectors() {
        this.showVectors = !this.showVectors;
        invalidate();
    }

    public void toggleLabels() {
        this.showLabels = !this.showLabels;
        invalidate();
    }

    public void togglePaused() {
        this.paused = !this.paused;
        lastFrameNs = System.nanoTime();
        invalidate();
    }

    public boolean isPaused() {
        return paused;
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);

        int w = getWidth();
        int h = getHeight();
        if (w <= 0 || h <= 0) return;

        long now = System.nanoTime();
        if (lastFrameNs == 0L) lastFrameNs = now;
        float dt = (now - lastFrameNs) / 1_000_000_000f;
        lastFrameNs = now;
        if (dt > 0.1f) dt = 0.016f;

        // Background void
        bgPaint.setColor(Color.parseColor("#060913"));
        canvas.drawRect(0, 0, w, h, bgPaint);

        // Starfield
        for (int i = 0; i < starX.length; i++) {
            planetPaint.setColor(Color.WHITE);
            planetPaint.setAlpha(starAlpha[i]);
            canvas.drawCircle(starX[i] * w, starY[i] * h, (i % 3 == 0) ? 2.4f : 1.5f, planetPaint);
        }

        float cx = w * 0.5f;
        float cy = h * 0.5f;
        float maxRadius = Math.min(w, h) * 0.46f * zoomFactor;
        float density = getResources().getDisplayMetrics().density;

        // Sun Corona Glow
        planetPaint.setStyle(Paint.Style.FILL);
        planetPaint.setColor(Color.parseColor("#22F59E0B"));
        canvas.drawCircle(cx, cy, 26f * density, planetPaint);
        planetPaint.setColor(Color.parseColor("#55FBBF24"));
        canvas.drawCircle(cx, cy, 17f * density, planetPaint);
        planetPaint.setColor(Color.parseColor("#FDE047"));
        canvas.drawCircle(cx, cy, 11f * density, planetPaint);

        // Asteroid Belt between Mars & Jupiter
        planetPaint.setColor(Color.parseColor("#6694A3B8"));
        for (int i = 0; i < asteroidAngles.length; i++) {
            if (!paused) {
                asteroidAngles[i] += dt * 0.18f * timeWarp;
            }
            float r = maxRadius * asteroidRadii[i];
            float ax = cx + (float) Math.cos(asteroidAngles[i]) * r;
            float ay = cy + (float) Math.sin(asteroidAngles[i]) * r;
            canvas.drawCircle(ax, ay, 1.8f, planetPaint);
        }

        // Planets
        for (int i = 0; i < planets.length; i++) {
            PlanetBody p = planets[i];
            if (!paused) {
                p.currentAngle += dt * p.angularSpeed * 0.45f * timeWarp;
            }
            float orbitR = maxRadius * p.orbitRadiusRatio;

            if (showOrbits) {
                orbitPaint.setColor(i == selectedIndex ? Color.parseColor("#66F2B84B") : Color.parseColor("#245ED4F5"));
                canvas.drawCircle(cx, cy, orbitR, orbitPaint);
            }

            p.screenX = cx + (float) Math.cos(p.currentAngle) * orbitR;
            p.screenY = cy + (float) Math.sin(p.currentAngle) * orbitR;
            float pr = p.radiusDp * density * 0.65f;

            // Saturn rings
            if ("Saturn".equals(p.name)) {
                planetPaint.setStyle(Paint.Style.STROKE);
                planetPaint.setStrokeWidth(3.2f);
                planetPaint.setColor(Color.parseColor("#AAFEF08A"));
                ringRect.set(p.screenX - pr * 1.9f, p.screenY - pr * 0.8f, p.screenX + pr * 1.9f, p.screenY + pr * 0.8f);
                canvas.drawOval(ringRect, planetPaint);
                planetPaint.setStyle(Paint.Style.FILL);
            }

            // Velocity vector tangent
            if (showVectors) {
                float vx = (float) -Math.sin(p.currentAngle) * (pr + 20f);
                float vy = (float) Math.cos(p.currentAngle) * (pr + 20f);
                canvas.drawLine(p.screenX, p.screenY, p.screenX + vx, p.screenY + vy, vectorPaint);
            }

            // Planet body
            planetPaint.setStyle(Paint.Style.FILL);
            planetPaint.setColor(p.color);
            canvas.drawCircle(p.screenX, p.screenY, pr, planetPaint);

            // Earth's Moon
            if ("Earth".equals(p.name)) {
                if (!paused) moonAngle += dt * 4.2f * timeWarp;
                float mx = p.screenX + (float) Math.cos(moonAngle) * (pr + 11f * density);
                float my = p.screenY + (float) Math.sin(moonAngle) * (pr + 11f * density);
                planetPaint.setColor(Color.parseColor("#E2E8F0"));
                canvas.drawCircle(mx, my, 2.4f * density, planetPaint);
            }

            // Selection reticle
            if (i == selectedIndex) {
                canvas.drawCircle(p.screenX, p.screenY, pr + 8f, reticlePaint);
            }

            if (showLabels) {
                labelPaint.setColor(i == selectedIndex ? Color.parseColor("#F2B84B") : Color.parseColor("#CBD5E1"));
                canvas.drawText(p.name, p.screenX + pr + 8f, p.screenY + 6f, labelPaint);
            }
        }

        if (!paused) {
            postInvalidateOnAnimation();
        }
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        if (event.getAction() == MotionEvent.ACTION_DOWN) {
            float tx = event.getX();
            float ty = event.getY();
            float bestDist = Float.MAX_VALUE;
            int bestIdx = -1;
            for (int i = 0; i < planets.length; i++) {
                float dx = tx - planets[i].screenX;
                float dy = ty - planets[i].screenY;
                float dist = (float) Math.hypot(dx, dy);
                if (dist < bestDist && dist < 110f) {
                    bestDist = dist;
                    bestIdx = i;
                }
            }
            if (bestIdx != -1) {
                selectPlanetByIndex(bestIdx);
                return true;
            }
        }
        return super.onTouchEvent(event);
    }
}
