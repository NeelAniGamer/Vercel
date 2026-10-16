package com.educational.col.ui;

import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.FileProvider;

import com.educational.col.R;
import com.educational.col.data.ColDatabaseHelper;
import com.educational.col.engine.MechanicalSoundEngine;
import com.educational.col.engine.QrCodeGenerator;

import java.io.File;
import java.io.FileOutputStream;

public class QrStudioActivity extends AppCompatActivity {

    private EditText etQrPayload;
    private ImageView ivQrPreview;
    private TextView tvQrCountBadge;

    private int fgColor = Color.parseColor("#F2B84B");
    private int bgColor = Color.parseColor("#0B1120");
    private int currentStyle = QrCodeGenerator.STYLE_DOTS;
    private String currentPresetLabel = "Portal URL";
    private Bitmap lastBitmap;

    private ColDatabaseHelper db;
    private MechanicalSoundEngine sound;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_qr_studio);

        db = ColDatabaseHelper.getInstance(this);
        sound = MechanicalSoundEngine.getInstance(this);

        etQrPayload = findViewById(R.id.etQrPayload);
        ivQrPreview = findViewById(R.id.ivQrPreview);
        tvQrCountBadge = findViewById(R.id.tvQrCountBadge);

        findViewById(R.id.btnBackQr).setOnClickListener(v -> finish());

        findViewById(R.id.chipQrUrl).setOnClickListener(v -> {
            currentPresetLabel = "Portal URL";
            etQrPayload.setText("https://advancedlogiclabs.dpdns.org");
            sound.hapticTap(8);
        });

        findViewById(R.id.chipQrWifi).setOnClickListener(v -> {
            currentPresetLabel = "Wi-Fi Access";
            etQrPayload.setText("WIFI:S:ClassOfLearners_5G;T:WPA;P:Mumbai2026;;");
            sound.hapticTap(8);
        });

        findViewById(R.id.chipQrCard).setOnClickListener(v -> {
            ColDatabaseHelper.LearnerProfile p = db.getProfile();
            currentPresetLabel = "Learner Pass";
            etQrPayload.setText("COL-PASS|" + p.username + "|LVL:" + ColDatabaseHelper.getLevelForXp(p.xp) + "|XP:" + p.xp);
            sound.hapticTap(8);
        });

        findViewById(R.id.chipThemeGold).setOnClickListener(v -> setColors("#F2B84B", "#0B1120"));
        findViewById(R.id.chipThemeCyan).setOnClickListener(v -> setColors("#5ED4F5", "#071624"));
        findViewById(R.id.chipThemeEmerald).setOnClickListener(v -> setColors("#34D399", "#051B14"));
        findViewById(R.id.chipThemeClassic).setOnClickListener(v -> setColors("#0F172A", "#FFFFFF"));

        findViewById(R.id.btnStyleSquare).setOnClickListener(v -> setStyle(QrCodeGenerator.STYLE_SQUARE));
        findViewById(R.id.btnStyleDots).setOnClickListener(v -> setStyle(QrCodeGenerator.STYLE_DOTS));
        findViewById(R.id.btnStyleDiamond).setOnClickListener(v -> setStyle(QrCodeGenerator.STYLE_DIAMOND));

        findViewById(R.id.btnSaveQrXp).setOnClickListener(v -> {
            db.recordQrCreated(currentPresetLabel, 25);
            refreshBadge();
            sound.playSuccessChime();
            Toast.makeText(this, "QR Matrix Verified! +25 Engineering XP", Toast.LENGTH_SHORT).show();
        });

        findViewById(R.id.btnShareQr).setOnClickListener(v -> shareCurrentQr());

        etQrPayload.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                renderMatrix();
            }

            @Override
            public void afterTextChanged(Editable s) {}
        });

        refreshBadge();
        renderMatrix();
    }

    private void refreshBadge() {
        tvQrCountBadge.setText("Created: " + db.getProfile().qrCodesCreated);
    }

    private void setColors(String fg, String bg) {
        fgColor = Color.parseColor(fg);
        bgColor = Color.parseColor(bg);
        sound.hapticTap(8);
        renderMatrix();
    }

    private void setStyle(int style) {
        currentStyle = style;
        sound.hapticTap(8);
        renderMatrix();
    }

    private void renderMatrix() {
        String text = etQrPayload.getText().toString().trim();
        if (text.isEmpty()) text = "https://advancedlogiclabs.dpdns.org";
        lastBitmap = QrCodeGenerator.renderQrBitmap(text, 640, fgColor, bgColor, currentStyle);
        ivQrPreview.setImageBitmap(lastBitmap);
    }

    private void shareCurrentQr() {
        if (lastBitmap == null) return;
        try {
            File outFile = new File(getCacheDir(), "CoL_QR_Matrix.png");
            FileOutputStream fos = new FileOutputStream(outFile);
            lastBitmap.compress(Bitmap.CompressFormat.PNG, 100, fos);
            fos.flush();
            fos.close();

            Uri uri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", outFile);
            Intent share = new Intent(Intent.ACTION_SEND);
            share.setType("image/png");
            share.putExtra(Intent.EXTRA_STREAM, uri);
            share.putExtra(Intent.EXTRA_TEXT, "Generated with Class Of Learners QR Studio Matrix");
            share.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivity(Intent.createChooser(share, "Share QR Matrix"));
        } catch (Exception e) {
            Toast.makeText(this, "Could Not Share Image: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }
}
