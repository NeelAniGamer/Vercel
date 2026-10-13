package com.educational.col.ui;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;

import com.educational.col.R;
import com.educational.col.data.ColDatabaseHelper;
import com.educational.col.engine.MechanicalSoundEngine;

import java.util.ArrayList;
import java.util.List;

public class TrafficQuizActivity extends AppCompatActivity {

    public static class ScenarioQuestion {
        public final String category;
        public final String lawTag;
        public final String prompt;
        public final String[] options;
        public final int correctIdx;
        public final String explanation;

        public ScenarioQuestion(String category, String lawTag, String prompt,
                                String[] options, int correctIdx, String explanation) {
            this.category = category;
            this.lawTag = lawTag;
            this.prompt = prompt;
            this.options = options;
            this.correctIdx = correctIdx;
            this.explanation = explanation;
        }
    }

    private final List<ScenarioQuestion> allQuestions = new ArrayList<>();
    private final List<ScenarioQuestion> activeQuestions = new ArrayList<>();

    private TextView tvCivicBadge;
    private TextView tvLawTag;
    private TextView tvQuestionCounter;
    private TextView tvQuestionPrompt;
    private final Button[] optButtons = new Button[4];
    private LinearLayout boxExplanation;
    private TextView tvFeedbackHeader;
    private TextView tvFeedbackBody;
    private Button btnNextScenario;

    private TextView chipCatAll, chipCatMva, chipCatMumbai, chipCatEmergency;

    private int currentIndex = 0;
    private int correctCount = 0;
    private int sessionXp = 0;
    private int sessionCivicDelta = 0;
    private boolean answeredCurrent = false;

    private ColDatabaseHelper db;
    private MechanicalSoundEngine sound;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_traffic_quiz);

        db = ColDatabaseHelper.getInstance(this);
        sound = MechanicalSoundEngine.getInstance(this);

        seedQuestions();
        initViews();
        filterByCategory("ALL");
    }

    private void seedQuestions() {
        allQuestions.add(new ScenarioQuestion(
                "MVA", "MVA Section 194E",
                "An ambulance with flashing beacons approaches behind your lane near Haji Ali Junction in heavy traffic. What is your mandatory legal duty?",
                new String[]{
                        "Maintain Speed Until The Next Signal Turns Green",
                        "Immediately Pull To The Side And Clear An Unobstructed Corridor",
                        "Accelerate Ahead Of The Ambulance To Clear The Lane",
                        "Sound Your Horn Continuously To Alert Other Drivers"
                },
                1,
                "Under Section 194E of the Motor Vehicles (Amendment) Act 2019, failing to yield free passage to an ambulance or fire service vehicle attracts a ₹10,000 fine and/or up to 6 months imprisonment."
        ));

        allQuestions.add(new ScenarioQuestion(
                "MUMBAI", "Silence Zone Protocol",
                "You are driving past KEM Hospital in Parel where a 'Silence Zone' sign with a crossed-out horn is posted. A vehicle ahead slows down. What should you do?",
                new String[]{
                        "Use Two Short Horn Taps Instead Of A Long Blast",
                        "Use Dipper Headlights Or Wait Patiently Without Honking",
                        "Honk Only If You Are Driving A Commercial Vehicle",
                        "Overtake From The Left While Honking Once"
                },
                1,
                "Honking is strictly prohibited within 100 meters of hospitals, courts, and educational institutions (Silence Zones) under Mumbai Traffic Police regulations and Noise Pollution Rules."
        ));

        allQuestions.add(new ScenarioQuestion(
                "MVA", "MVA Section 129 & 194D",
                "On a two-wheeler in Mumbai, who is legally required to wear a BIS-certified protective helmet with the chin strap fastened?",
                new String[]{
                        "Only The Rider On Highways",
                        "Both The Rider And The Pillion Passenger On All Roads",
                        "Only Riders Above 25 Years Of Age",
                        "Optional If Speed Is Below 30 km/h"
                },
                1,
                "Section 129 & Section 194D mandate BIS-standard helmets for both the rider and pillion passenger (over 4 years old), carrying a ₹1,000 fine and 3-month license disqualification."
        ));

        allQuestions.add(new ScenarioQuestion(
                "MUMBAI", "School Zone Safety",
                "You see a yellow flashing beacon and a School Zone ahead sign near Don Bosco Matunga during dispersal hours. What is the maximum safe speed limit?",
                new String[]{
                        "25 km/h With Foot Ready Over The Brake",
                        "50 km/h If The Zebra Crossing Looks Empty",
                        "45 km/h In The Rightmost Lane",
                        "60 km/h Outside Peak Morning Hours"
                },
                0,
                "School zones in Mumbai mandate a strict 25 km/h maximum speed limit, zero overtaking near zebra crossings, and complete stops whenever students step onto the crosswalk."
        ));

        allQuestions.add(new ScenarioQuestion(
                "MVA", "MVA Section 185 (BAC Limit)",
                "What is the maximum permissible Blood Alcohol Concentration (BAC) threshold for driving any motor vehicle in India under Section 185?",
                new String[]{
                        "80 mg Per 100 ml Of Blood",
                        "50 mg Per 100 ml Of Blood",
                        "Below 30 mg Per 100 ml Of Blood",
                        "100 mg Per 100 ml Of Blood"
                },
                2,
                "Section 185 sets the legal limit at 30 mg of alcohol per 100 ml of blood. First-time violations carry a ₹10,000 fine and/or 6 months imprisonment."
        ));

        allQuestions.add(new ScenarioQuestion(
                "MUMBAI", "Pedestrian Zebra Crossing",
                "When approaching an unsignalized Zebra Crossing at Marine Drive where pedestrians are waiting to cross, what is the correct action?",
                new String[]{
                        "Slow Down And Stop Behind The White Stop Line To Yield Right Of Way",
                        "Flash Headlights To Tell Pedestrians To Wait",
                        "Swerve Around Pedestrians Without Stopping",
                        "Stop Directly On Top Of The Zebra Stripes"
                },
                0,
                "Pedestrians have priority at unsignalized zebra crossings. Stopping on top of the zebra stripes is an offense under MVA Section 177/184."
        ));

        allQuestions.add(new ScenarioQuestion(
                "EMERGENCY", "MVA Section 134A (Good Samaritan)",
                "You witness a road accident on the Western Express Highway and take the injured victim to a hospital. Under Section 134A, what are your legal protections?",
                new String[]{
                        "You Must Pay The Hospital Deposit Before Leaving",
                        "You Are Protected From Civil/Criminal Liability And Cannot Be Forced To Reveal Personal Details",
                        "You Must Remain At The Police Station For 24 Hours",
                        "Only Licensed Doctors Are Protected Under Good Samaritan Law"
                },
                1,
                "Section 134A (Good Samaritan Law) protects any citizen who helps a crash victim in the Golden Hour from civil or criminal liability and prohibits hospitals from demanding admission fees from them."
        ));

        allQuestions.add(new ScenarioQuestion(
                "MUMBAI", "BEST Bus & Heavy Vehicle Blind Spots",
                "While riding a motorcycle or driving a compact car alongside a turning BEST Bus at Dadar TT Circle, what is the safest positioning?",
                new String[]{
                        "Squeeze Into The Inside Curb Gap While The Bus Turns",
                        "Stay Well Behind The Rear Bumper And Outside The Turning Sweep Zone",
                        "Ride Alongside The Front Left Wheel",
                        "Overtake On The Left While The Bus Indicator Is Flashing"
                },
                1,
                "Long-wheelbase buses have wide front-right and left-side blind spots ('No-Zones') and wide rear tail-swing during turns. Never enter the inside curb gap of a turning bus."
        ));

        allQuestions.add(new ScenarioQuestion(
                "MVA", "MVA Section 184 (Handheld Mobile Use)",
                "While stopped at a red signal or crawling in Bandra-Worli Sea Link approach traffic, is checking messages on a handheld phone legal?",
                new String[]{
                        "Yes, Whenever Speed Is Under 10 km/h",
                        "No, Using A Handheld Mobile Device While Operating A Vehicle Is Strictly Prohibited",
                        "Yes, If One Hand Remains On The Steering Wheel",
                        "Yes, At Red Signals Under 60 Seconds"
                },
                1,
                "Section 184 classifies handheld phone use while operating a vehicle (including at active traffic signals) as dangerous driving, carrying ₹5,000–₹10,000 penalties and e-challan camera enforcement."
        ));

        allQuestions.add(new ScenarioQuestion(
                "EMERGENCY", "Monsoon Waterlogging & Hydroplaning",
                "During heavy Mumbai monsoon rainfall, you encounter a waterlogged stretch on SV Road. How should you drive through safely?",
                new String[]{
                        "Shift To A Low Gear (1st/2nd), Keep Steady Engine RPM, And Test Brakes Gently After Exiting",
                        "Shift To Highest Gear And Coast With The Clutch Pressed Down",
                        "Accelerate Rapidly To Create A Bow Wave",
                        "Follow 1 Meter Behind The Vehicle In Front"
                },
                0,
                "Maintaining a low gear with steady throttle prevents water from entering the exhaust pipe, and gently tapping brakes after exiting dries wet brake rotors."
        ));
    }

    private void initViews() {
        Button btnBack = findViewById(R.id.btnBackTraffic);
        btnBack.setOnClickListener(v -> finish());

        tvCivicBadge = findViewById(R.id.tvCivicBadge);
        tvLawTag = findViewById(R.id.tvLawTag);
        tvQuestionCounter = findViewById(R.id.tvQuestionCounter);
        tvQuestionPrompt = findViewById(R.id.tvQuestionPrompt);

        optButtons[0] = findViewById(R.id.btnOpt0);
        optButtons[1] = findViewById(R.id.btnOpt1);
        optButtons[2] = findViewById(R.id.btnOpt2);
        optButtons[3] = findViewById(R.id.btnOpt3);

        boxExplanation = findViewById(R.id.boxExplanation);
        tvFeedbackHeader = findViewById(R.id.tvFeedbackHeader);
        tvFeedbackBody = findViewById(R.id.tvFeedbackBody);
        btnNextScenario = findViewById(R.id.btnNextScenario);

        chipCatAll = findViewById(R.id.chipCatAll);
        chipCatMva = findViewById(R.id.chipCatMva);
        chipCatMumbai = findViewById(R.id.chipCatMumbai);
        chipCatEmergency = findViewById(R.id.chipCatEmergency);

        chipCatAll.setOnClickListener(v -> filterByCategory("ALL"));
        chipCatMva.setOnClickListener(v -> filterByCategory("MVA"));
        chipCatMumbai.setOnClickListener(v -> filterByCategory("MUMBAI"));
        chipCatEmergency.setOnClickListener(v -> filterByCategory("EMERGENCY"));

        for (int i = 0; i < 4; i++) {
            final int chosen = i;
            optButtons[i].setOnClickListener(v -> onOptionClicked(chosen));
        }

        btnNextScenario.setOnClickListener(v -> {
            if (currentIndex + 1 < activeQuestions.size()) {
                currentIndex++;
                renderCurrentQuestion();
            } else {
                completeDrill();
            }
        });

        updateCivicHeader();
    }

    private void updateCivicHeader() {
        ColDatabaseHelper.LearnerProfile p = db.getProfile();
        tvCivicBadge.setText("Civic: " + (p.civicScore + sessionCivicDelta));
    }

    private void filterByCategory(String cat) {
        sound.hapticTap(10);
        activeQuestions.clear();
        for (ScenarioQuestion q : allQuestions) {
            if ("ALL".equals(cat) || q.category.equals(cat)) {
                activeQuestions.add(q);
            }
        }
        currentIndex = 0;
        correctCount = 0;
        sessionXp = 0;
        sessionCivicDelta = 0;

        styleChip(chipCatAll, "ALL".equals(cat));
        styleChip(chipCatMva, "MVA".equals(cat));
        styleChip(chipCatMumbai, "MUMBAI".equals(cat));
        styleChip(chipCatEmergency, "EMERGENCY".equals(cat));

        renderCurrentQuestion();
    }

    private void styleChip(TextView chip, boolean active) {
        chip.setBackgroundResource(active ? R.drawable.bg_pill_gold : R.drawable.bg_btn_outline);
        chip.setTextColor(Color.parseColor(active ? "#F2B84B" : "#E8E3D8"));
    }

    private void renderCurrentQuestion() {
        answeredCurrent = false;
        boxExplanation.setVisibility(View.GONE);

        ScenarioQuestion q = activeQuestions.get(currentIndex);
        tvLawTag.setText(q.lawTag);
        tvQuestionCounter.setText("Scenario " + (currentIndex + 1) + " Of " + activeQuestions.size());
        tvQuestionPrompt.setText(q.prompt);

        char[] letters = {'A', 'B', 'C', 'D'};
        for (int i = 0; i < 4; i++) {
            optButtons[i].setText(letters[i] + ".  " + q.options[i]);
            optButtons[i].setBackgroundResource(R.drawable.bg_card_glass);
            optButtons[i].setTextColor(Color.parseColor("#E8E3D8"));
            optButtons[i].setEnabled(true);
        }

        btnNextScenario.setText((currentIndex + 1 == activeQuestions.size())
                ? "Finish Drill & Claim Rewards →"
                : "Next Scenario →");
    }

    private void onOptionClicked(int chosen) {
        if (answeredCurrent) return;
        answeredCurrent = true;

        ScenarioQuestion q = activeQuestions.get(currentIndex);
        boolean isCorrect = (chosen == q.correctIdx);

        if (isCorrect) {
            correctCount++;
            sessionXp += 25;
            sessionCivicDelta += 15;
            sound.playSuccessChime();
            tvFeedbackHeader.setText("✓ Law Mastered (+25 XP, +15 Civic Score)");
            tvFeedbackHeader.setTextColor(Color.parseColor("#34D399"));
        } else {
            sessionXp += 5;
            sessionCivicDelta -= 5;
            sound.playKeyClick(null, true);
            tvFeedbackHeader.setText("✕ Challan Alert — Review Legal Rule Below");
            tvFeedbackHeader.setTextColor(Color.parseColor("#EF4444"));
        }

        for (int i = 0; i < 4; i++) {
            optButtons[i].setEnabled(false);
            if (i == q.correctIdx) {
                optButtons[i].setBackgroundResource(R.drawable.bg_pill_emerald);
                optButtons[i].setTextColor(Color.parseColor("#34D399"));
            } else if (i == chosen) {
                optButtons[i].setBackgroundResource(R.drawable.bg_pill_gold);
                optButtons[i].setTextColor(Color.parseColor("#EF4444"));
            }
        }

        tvFeedbackBody.setText(q.explanation);
        boxExplanation.setVisibility(View.VISIBLE);
        updateCivicHeader();
    }

    private void completeDrill() {
        db.recordQuizCompletion(correctCount, activeQuestions.size(), Math.max(20, sessionXp), sessionCivicDelta);
        sound.playSuccessChime();

        new AlertDialog.Builder(this)
                .setTitle("Mumbai Traffic Drill Complete!")
                .setMessage("Scenarios Mastered: " + correctCount + " / " + activeQuestions.size() +
                        "\nXP Earned: +" + Math.max(20, sessionXp) + " XP" +
                        "\nCivic Score Delta: " + (sessionCivicDelta >= 0 ? "+" : "") + sessionCivicDelta)
                .setPositiveButton("Start Another Drill", (d, w) -> filterByCategory("ALL"))
                .setNegativeButton("Return To Hub", (d, w) -> finish())
                .setCancelable(false)
                .show();
    }
}
