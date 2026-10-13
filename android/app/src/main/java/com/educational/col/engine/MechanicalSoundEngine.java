package com.educational.col.engine;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioFormat;
import android.media.AudioTrack;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;

import com.educational.col.data.ColDatabaseHelper;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MechanicalSoundEngine {

    private static final int SAMPLE_RATE = 44100;
    private static MechanicalSoundEngine instance;

    private final Context appContext;
    private final ExecutorService audioExecutor = Executors.newSingleThreadExecutor();
    private final Vibrator vibrator;

    public static synchronized MechanicalSoundEngine getInstance(Context context) {
        if (instance == null) {
            instance = new MechanicalSoundEngine(context.getApplicationContext());
        }
        return instance;
    }

    private MechanicalSoundEngine(Context context) {
        this.appContext = context;
        this.vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
    }

    public void hapticTap(int durationMs) {
        try {
            if (vibrator != null && vibrator.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createOneShot(Math.max(5, durationMs), VibrationEffect.DEFAULT_AMPLITUDE));
                } else {
                    vibrator.vibrate(Math.max(5, durationMs));
                }
            }
        } catch (Exception ignored) {
        }
    }

    public void playKeyClick(String switchProfile, boolean isError) {
        ColDatabaseHelper.LearnerProfile p = ColDatabaseHelper.getInstance(appContext).getProfile();
        hapticTap(isError ? 24 : 9);
        if (!p.soundEnabled) return;

        final String profile = switchProfile != null ? switchProfile : p.switchProfile;
        audioExecutor.execute(() -> {
            try {
                int durationMs = isError ? 65 : 28;
                int numSamples = (SAMPLE_RATE * durationMs) / 1000;
                short[] pcm = new short[numSamples];

                double baseFreq = 1850.0;
                double bodyFreq = 320.0;
                double decay = 135.0;

                if ("Topre 45g Thock".equalsIgnoreCase(profile)) {
                    baseFreq = 920.0;
                    bodyFreq = 185.0;
                    decay = 95.0;
                } else if ("Holy Panda".equalsIgnoreCase(profile)) {
                    baseFreq = 1380.0;
                    bodyFreq = 265.0;
                    decay = 115.0;
                } else if ("Buckling Spring".equalsIgnoreCase(profile)) {
                    baseFreq = 2420.0;
                    bodyFreq = 440.0;
                    decay = 85.0;
                }

                if (isError) {
                    baseFreq = 240.0;
                    bodyFreq = 160.0;
                    decay = 45.0;
                }

                for (int i = 0; i < numSamples; i++) {
                    double t = (double) i / SAMPLE_RATE;
                    double env = Math.exp(-t * decay);
                    double click = Math.sin(2.0 * Math.PI * baseFreq * t) * 0.55;
                    double thock = Math.sin(2.0 * Math.PI * bodyFreq * t) * 0.45;
                    double transientNoise = (i < SAMPLE_RATE * 0.003) ? ((Math.random() * 2.0 - 1.0) * 0.35) : 0.0;
                    double val = (click + thock + transientNoise) * env;
                    val = Math.max(-1.0, Math.min(1.0, val));
                    pcm[i] = (short) (val * 22000);
                }

                playPcmBuffer(pcm);
            } catch (Exception ignored) {
            }
        });
    }

    public void playSuccessChime() {
        ColDatabaseHelper.LearnerProfile p = ColDatabaseHelper.getInstance(appContext).getProfile();
        hapticTap(18);
        if (!p.soundEnabled) return;

        audioExecutor.execute(() -> {
            try {
                int durationMs = 180;
                int numSamples = (SAMPLE_RATE * durationMs) / 1000;
                short[] pcm = new short[numSamples];
                for (int i = 0; i < numSamples; i++) {
                    double t = (double) i / SAMPLE_RATE;
                    double freq = (i < numSamples / 2) ? 587.33 : 880.0; // D5 -> A5
                    double env = Math.exp(-t * 16.0);
                    double val = Math.sin(2.0 * Math.PI * freq * t) * env;
                    pcm[i] = (short) (val * 18000);
                }
                playPcmBuffer(pcm);
            } catch (Exception ignored) {
            }
        });
    }

    private void playPcmBuffer(short[] pcm) {
        int byteCount = pcm.length * 2;
        AudioTrack track = new AudioTrack.Builder()
                .setAudioAttributes(new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_GAME)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build())
                .setAudioFormat(new AudioFormat.Builder()
                        .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                        .setSampleRate(SAMPLE_RATE)
                        .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                        .build())
                .setBufferSizeInBytes(Math.max(byteCount, AudioTrack.getMinBufferSize(
                        SAMPLE_RATE, AudioFormat.CHANNEL_OUT_MONO, AudioFormat.ENCODING_PCM_16BIT)))
                .setTransferMode(AudioTrack.MODE_STATIC)
                .build();

        track.write(pcm, 0, pcm.length);
        track.play();
        try {
            Thread.sleep((pcm.length * 1000L / SAMPLE_RATE) + 15);
        } catch (InterruptedException ignored) {
        }
        track.release();
    }
}
