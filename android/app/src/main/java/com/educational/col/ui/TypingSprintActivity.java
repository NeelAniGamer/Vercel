package com.educational.col.ui;

import android.graphics.Color;
import android.os.Bundle;
import android.text.Editable;
import android.text.SpannableStringBuilder;
import android.text.Spanned;
import android.text.TextWatcher;
import android.text.style.BackgroundColorSpan;
import android.text.style.ForegroundColorSpan;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;

import com.educational.col.R;
import com.educational.col.data.ColDatabaseHelper;
import com.educational.col.engine.MechanicalSoundEngine;

public class TypingSprintActivity extends AppCompatActivity {

    private static final String[][] PASSAGES = {
            // Mode 0: English Mastery
            {
                    "Engineering excellence begins with deliberate practice, clear systems thinking, and precision at every keystroke.",
                    "Students across Mumbai build interactive simulations to master physics, civic responsibility, and modern software craft.",
                    "Consistent daily sprints train muscle memory, sharpen accuracy, and turn complex ideas into working code."
            },
            // Mode 1: Python & JS Code
            {
                    "def calc_orbital_v(gm, r): return (gm / r) ** 0.5",
                    "const safeSpeed = (zone === 'SCHOOL') ? 25 : 50;",
                    "for (let i = 0; i < nodes.length; i++) { syncState(nodes[i]); }"
            },
            // Mode 2: Mumbai Traffic Law
            {
                    "Under Section 194E of the Motor Vehicles Act, every driver must immediately clear a corridor for emergency ambulances.",
                    "Honking is strictly prohibited within 100 meters of Mumbai hospitals, schools, and court silence zones.",
                    "Always stop behind the white line at unsignalized zebra crossings and wear a BIS-certified helmet on two-wheelers."
            },
            // Mode 3: Astrophysics
            {
                    "Kepler's third law states that the square of a planet's orbital period is proportional to the cube of its semi-major axis.",
                    "Jupiter acts as a gravitational shield in the Solar System, deflecting long-period comets away from the inner rocky worlds.",
                    "Escape velocity from Earth requires a kinetic launch speed of 11.2 kilometers per second to overcome gravity."
            }
    };

    private static final String[] MODE_NAMES = {
            "English Mastery", "Python & JS Syntax", "Mumbai MVA Law", "Astrophysics"
    };

    private TextView tvBestWpmBadge, tvLiveWpm, tvLiveAcc, tvLiveProgress, tvTargetPassage;
    private EditText etTypingInput;
    private TextView chipModeProse, chipModeCode, chipModeLaw, chipModeSpace;
    private TextView chipSwBlue, chipSwTopre, chipSwPanda, chipSwBuckling;

    private int currentMode = 0;
    private int passageIndex = 0;
    private String currentSwitch = "Cherry MX Blue";
    private String targetText = "";

    private long startTimeMs = 0L;
    private int lastLength = 0;
    private int lastComputedWpm = 0;
    private int lastComputedAcc = 100;
    private boolean sprintFinished = false;

    private ColDatabaseHelper db;
    private MechanicalSoundEngine sound;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_typing_sprint);

        db = ColDatabaseHelper.getInstance(this);
        sound = MechanicalSoundEngine.getInstance(this);
        currentSwitch = db.getProfile().switchProfile;

        initViews();
        selectMode(0);
        updateSwitchChips();
    }

    private void initViews() {
        findViewById(R.id.btnBackTyping).setOnClickListener(v -> finish());

        tvBestWpmBadge = findViewById(R.id.tvBestWpmBadge);
        tvLiveWpm = findViewById(R.id.tvLiveWpm);
        tvLiveAcc = findViewById(R.id.tvLiveAcc);
        tvLiveProgress = findViewById(R.id.tvLiveProgress);
        tvTargetPassage = findViewById(R.id.tvTargetPassage);
        etTypingInput = findViewById(R.id.etTypingInput);

        chipModeProse = findViewById(R.id.chipModeProse);
        chipModeCode = findViewById(R.id.chipModeCode);
        chipModeLaw = findViewById(R.id.chipModeLaw);
        chipModeSpace = findViewById(R.id.chipModeSpace);

        chipSwBlue = findViewById(R.id.chipSwBlue);
        chipSwTopre = findViewById(R.id.chipSwTopre);
        chipSwPanda = findViewById(R.id.chipSwPanda);
        chipSwBuckling = findViewById(R.id.chipSwBuckling);

        chipModeProse.setOnClickListener(v -> selectMode(0));
        chipModeCode.setOnClickListener(v -> selectMode(1));
        chipModeLaw.setOnClickListener(v -> selectMode(2));
        chipModeSpace.setOnClickListener(v -> selectMode(3));

        chipSwBlue.setOnClickListener(v -> setSwitch("Cherry MX Blue"));
        chipSwTopre.setOnClickListener(v -> setSwitch("Topre 45g Thock"));
        chipSwPanda.setOnClickListener(v -> setSwitch("Holy Panda"));
        chipSwBuckling.setOnClickListener(v -> setSwitch("Buckling Spring"));

        findViewById(R.id.btnNewPassage).setOnClickListener(v -> {
            passageIndex = (passageIndex + 1) % PASSAGES[currentMode].length;
            loadPassage();
        });

        findViewById(R.id.btnFinishEarly).setOnClickListener(v -> {
            if (lastComputedWpm <= 0) {
                Toast.makeText(this, "Type A Few Words First To Record Your Sprint!", Toast.LENGTH_SHORT).show();
                return;
            }
            completeSprint();
        });

        etTypingInput.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                if (sprintFinished) return;
                String typed = s.toString();

                if (typed.length() == 1 && startTimeMs == 0L) {
                    startTimeMs = System.currentTimeMillis();
                }

                if (typed.length() > lastLength) {
                    int idx = typed.length() - 1;
                    boolean err = idx < targetText.length() && typed.charAt(idx) != targetText.charAt(idx);
                    sound.playKeyClick(currentSwitch, err);
                }
                lastLength = typed.length();

                updateTelemetryAndHighlight(typed);

                if (typed.length() >= targetText.length()) {
                    completeSprint();
                }
            }

            @Override
            public void afterTextChanged(Editable s) {}
        });

        refreshBestBadge();
    }

    private void refreshBestBadge() {
        tvBestWpmBadge.setText("Best: " + db.getProfile().bestWpm + " WPM");
    }

    private void setSwitch(String sw) {
        currentSwitch = sw;
        db.setSoundPreferences(true, sw);
        sound.playKeyClick(sw, false);
        updateSwitchChips();
    }

    private void updateSwitchChips() {
        styleSwitchChip(chipSwBlue, "Cherry MX Blue".equals(currentSwitch));
        styleSwitchChip(chipSwTopre, "Topre 45g Thock".equals(currentSwitch));
        styleSwitchChip(chipSwPanda, "Holy Panda".equals(currentSwitch));
        styleSwitchChip(chipSwBuckling, "Buckling Spring".equals(currentSwitch));
    }

    private void styleSwitchChip(TextView tv, boolean active) {
        tv.setBackgroundResource(active ? R.drawable.bg_pill_cyan : R.drawable.bg_btn_outline);
        tv.setTextColor(Color.parseColor(active ? "#5ED4F5" : "#E8E3D8"));
    }

    private void selectMode(int mode) {
        currentMode = mode;
        passageIndex = 0;

        styleModeChip(chipModeProse, mode == 0);
        styleModeChip(chipModeCode, mode == 1);
        styleModeChip(chipModeLaw, mode == 2);
        styleModeChip(chipModeSpace, mode == 3);

        loadPassage();
    }

    private void styleModeChip(TextView tv, boolean active) {
        tv.setBackgroundResource(active ? R.drawable.bg_pill_gold : R.drawable.bg_btn_outline);
        tv.setTextColor(Color.parseColor(active ? "#F2B84B" : "#E8E3D8"));
    }

    private void loadPassage() {
        sprintFinished = false;
        startTimeMs = 0L;
        lastLength = 0;
        lastComputedWpm = 0;
        lastComputedAcc = 100;
        targetText = PASSAGES[currentMode][passageIndex];
        etTypingInput.setText("");
        tvLiveWpm.setText("0");
        tvLiveAcc.setText("100%");
        tvLiveProgress.setText("0%");
        updateTelemetryAndHighlight("");
    }

    private void updateTelemetryAndHighlight(String typed) {
        SpannableStringBuilder ssb = new SpannableStringBuilder(targetText);
        int tLen = targetText.length();
        int uLen = Math.min(typed.length(), tLen);

        int correctChars = 0;
        for (int i = 0; i < uLen; i++) {
            if (typed.charAt(i) == targetText.charAt(i)) {
                correctChars++;
                ssb.setSpan(new ForegroundColorSpan(Color.parseColor("#34D399")), i, i + 1, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
            } else {
                ssb.setSpan(new ForegroundColorSpan(Color.parseColor("#FFFFFF")), i, i + 1, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
                ssb.setSpan(new BackgroundColorSpan(Color.parseColor("#AAEF4444")), i, i + 1, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
            }
        }

        if (uLen < tLen) {
            ssb.setSpan(new BackgroundColorSpan(Color.parseColor("#44F2B84B")), uLen, uLen + 1, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
            ssb.setSpan(new ForegroundColorSpan(Color.parseColor("#F2B84B")), uLen, uLen + 1, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
        }

        tvTargetPassage.setText(ssb);

        if (uLen > 0 && startTimeMs > 0L) {
            double elapsedMin = Math.max(0.03, (System.currentTimeMillis() - startTimeMs) / 60000.0);
            lastComputedWpm = (int) Math.round((correctChars / 5.0) / elapsedMin);
            lastComputedAcc = (int) Math.round((correctChars * 100.0) / uLen);
            int prog = (int) Math.round((uLen * 100.0) / tLen);

            tvLiveWpm.setText(String.valueOf(lastComputedWpm));
            tvLiveAcc.setText(lastComputedAcc + "%");
            tvLiveProgress.setText(prog + "%");
        }
    }

    private void completeSprint() {
        sprintFinished = true;
        int xpEarned = Math.max(20, (lastComputedWpm / 2) + (lastComputedAcc / 5));
        db.recordTypingSprint(lastComputedWpm, lastComputedAcc, MODE_NAMES[currentMode], xpEarned);
        refreshBestBadge();
        sound.playSuccessChime();

        new AlertDialog.Builder(this)
                .setTitle("Sprint Complete — " + lastComputedWpm + " WPM!")
                .setMessage("Mode: " + MODE_NAMES[currentMode] +
                        "\nSwitch: " + currentSwitch +
                        "\nSpeed: " + lastComputedWpm + " WPM" +
                        "\nAccuracy: " + lastComputedAcc + "%" +
                        "\nReward: +" + xpEarned + " Engineering XP")
                .setPositiveButton("Next Passage", (d, w) -> {
                    passageIndex = (passageIndex + 1) % PASSAGES[currentMode].length;
                    loadPassage();
                })
                .setNegativeButton("Return To Hub", (d, w) -> finish())
                .show();
    }
}
