package com.educational.col.data;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class ColDatabaseHelper extends SQLiteOpenHelper {

    private static final String DB_NAME = "col_companion_v2.db";
    private static final int DB_VERSION = 1;

    private static ColDatabaseHelper instance;

    public static synchronized ColDatabaseHelper getInstance(Context context) {
        if (instance == null) {
            instance = new ColDatabaseHelper(context.getApplicationContext());
        }
        return instance;
    }

    public static class LearnerProfile {
        public String displayName = "Mumbai Learner";
        public String username = "@learner_ind";
        public String preferredVehicle = "Car";
        public String academicStream = "STEM & Engineering";
        public int xp = 120;
        public int civicScore = 850;
        public int bestWpm = 0;
        public int quizzesCompleted = 0;
        public int focusMinutes = 0;
        public int solarExperiments = 0;
        public int qrCodesCreated = 0;
        public int streakDays = 1;
        public String lastActiveDate = "";
        public boolean soundEnabled = true;
        public String switchProfile = "Cherry MX Blue";
        public String lastModule = "Traffic Academy";
        public String topCareerMatch = "Systems & AI Architect";
    }

    public static class BadgeItem {
        public final String id;
        public final String icon;
        public final String title;
        public final String description;
        public final String accentHex;
        public boolean unlocked;

        public BadgeItem(String id, String icon, String title, String description, String accentHex, boolean unlocked) {
            this.id = id;
            this.icon = icon;
            this.title = title;
            this.description = description;
            this.accentHex = accentHex;
            this.unlocked = unlocked;
        }
    }

    public static class ActivityEntry {
        public final String moduleName;
        public final String summary;
        public final int xpEarned;
        public final String timestamp;

        public ActivityEntry(String moduleName, String summary, int xpEarned, String timestamp) {
            this.moduleName = moduleName;
            this.summary = summary;
            this.xpEarned = xpEarned;
            this.timestamp = timestamp;
        }
    }

    private ColDatabaseHelper(Context context) {
        super(context, DB_NAME, null, DB_VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        db.execSQL("CREATE TABLE IF NOT EXISTS learner_profile (" +
                "id INTEGER PRIMARY KEY CHECK (id = 1)," +
                "display_name TEXT DEFAULT 'Mumbai Learner'," +
                "username TEXT DEFAULT '@learner_ind'," +
                "preferred_vehicle TEXT DEFAULT 'Car'," +
                "academic_stream TEXT DEFAULT 'STEM & Engineering'," +
                "xp INTEGER DEFAULT 120," +
                "civic_score INTEGER DEFAULT 850," +
                "best_wpm INTEGER DEFAULT 0," +
                "quizzes_completed INTEGER DEFAULT 0," +
                "focus_minutes INTEGER DEFAULT 0," +
                "solar_experiments INTEGER DEFAULT 0," +
                "qr_codes_created INTEGER DEFAULT 0," +
                "streak_days INTEGER DEFAULT 1," +
                "last_active_date TEXT DEFAULT ''," +
                "sound_enabled INTEGER DEFAULT 1," +
                "switch_profile TEXT DEFAULT 'Cherry MX Blue'," +
                "last_module TEXT DEFAULT 'Traffic Academy'," +
                "top_career_match TEXT DEFAULT 'Systems & AI Architect'" +
                ")");

        db.execSQL("CREATE TABLE IF NOT EXISTS unlocked_badges (" +
                "badge_id TEXT PRIMARY KEY," +
                "unlocked_at TEXT" +
                ")");

        db.execSQL("CREATE TABLE IF NOT EXISTS activity_log (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "module_name TEXT," +
                "summary TEXT," +
                "xp_earned INTEGER," +
                "created_at TEXT" +
                ")");

        String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
        ContentValues cv = new ContentValues();
        cv.put("id", 1);
        cv.put("display_name", "Mumbai Learner");
        cv.put("username", "@learner_ind");
        cv.put("preferred_vehicle", "Car");
        cv.put("academic_stream", "STEM & Engineering");
        cv.put("xp", 150);
        cv.put("civic_score", 850);
        cv.put("streak_days", 1);
        cv.put("last_active_date", today);
        cv.put("sound_enabled", 1);
        cv.put("switch_profile", "Cherry MX Blue");
        cv.put("last_module", "Traffic Academy");
        cv.put("top_career_match", "Systems & AI Architect");
        db.insert("learner_profile", null, cv);

        // Unlock starter badge
        ContentValues bcv = new ContentValues();
        bcv.put("badge_id", "first_ignition");
        bcv.put("unlocked_at", today);
        db.insert("unlocked_badges", null, bcv);

        // Starter log entry
        ContentValues lcv = new ContentValues();
        lcv.put("module_name", "CoL Suite v2.0");
        lcv.put("summary", "Initialized Native Mobile Engineering Workspace");
        lcv.put("xp_earned", 150);
        lcv.put("created_at", "Just Now");
        db.insert("activity_log", null, lcv);
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        onCreate(db);
    }

    public LearnerProfile getProfile() {
        SQLiteDatabase db = getReadableDatabase();
        LearnerProfile p = new LearnerProfile();
        Cursor c = db.rawQuery("SELECT * FROM learner_profile WHERE id = 1", null);
        if (c.moveToFirst()) {
            p.displayName = c.getString(c.getColumnIndexOrThrow("display_name"));
            p.username = c.getString(c.getColumnIndexOrThrow("username"));
            p.preferredVehicle = c.getString(c.getColumnIndexOrThrow("preferred_vehicle"));
            p.academicStream = c.getString(c.getColumnIndexOrThrow("academic_stream"));
            p.xp = c.getInt(c.getColumnIndexOrThrow("xp"));
            p.civicScore = c.getInt(c.getColumnIndexOrThrow("civic_score"));
            p.bestWpm = c.getInt(c.getColumnIndexOrThrow("best_wpm"));
            p.quizzesCompleted = c.getInt(c.getColumnIndexOrThrow("quizzes_completed"));
            p.focusMinutes = c.getInt(c.getColumnIndexOrThrow("focus_minutes"));
            p.solarExperiments = c.getInt(c.getColumnIndexOrThrow("solar_experiments"));
            p.qrCodesCreated = c.getInt(c.getColumnIndexOrThrow("qr_codes_created"));
            p.streakDays = c.getInt(c.getColumnIndexOrThrow("streak_days"));
            p.lastActiveDate = c.getString(c.getColumnIndexOrThrow("last_active_date"));
            p.soundEnabled = c.getInt(c.getColumnIndexOrThrow("sound_enabled")) == 1;
            p.switchProfile = c.getString(c.getColumnIndexOrThrow("switch_profile"));
            p.lastModule = c.getString(c.getColumnIndexOrThrow("last_module"));
            p.topCareerMatch = c.getString(c.getColumnIndexOrThrow("top_career_match"));
        }
        c.close();
        checkDailyStreak(p);
        return p;
    }

    private void checkDailyStreak(LearnerProfile p) {
        String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
        if (!today.equals(p.lastActiveDate)) {
            p.lastActiveDate = today;
            p.streakDays = Math.max(1, p.streakDays + 1);
            SQLiteDatabase db = getWritableDatabase();
            ContentValues cv = new ContentValues();
            cv.put("last_active_date", today);
            cv.put("streak_days", p.streakDays);
            db.update("learner_profile", cv, "id = 1", null);
            evaluateBadges(p);
        }
    }

    public void updateIdentity(String displayName, String username, String vehicle, String stream) {
        SQLiteDatabase db = getWritableDatabase();
        ContentValues cv = new ContentValues();
        String cleanName = (displayName == null || displayName.trim().isEmpty()) ? "Mumbai Learner" : displayName.trim();
        String cleanUser = (username == null || username.trim().isEmpty()) ? "@learner_ind" : username.trim();
        if (!cleanUser.startsWith("@")) {
            cleanUser = "@" + cleanUser;
        }
        cv.put("display_name", cleanName);
        cv.put("username", cleanUser);
        cv.put("preferred_vehicle", vehicle != null ? vehicle : "Car");
        cv.put("academic_stream", stream != null ? stream : "STEM & Engineering");
        db.update("learner_profile", cv, "id = 1", null);
        unlockBadge("identity_forged");
    }

    public void setSoundPreferences(boolean soundEnabled, String switchProfile) {
        SQLiteDatabase db = getWritableDatabase();
        ContentValues cv = new ContentValues();
        cv.put("sound_enabled", soundEnabled ? 1 : 0);
        if (switchProfile != null && !switchProfile.isEmpty()) {
            cv.put("switch_profile", switchProfile);
        }
        db.update("learner_profile", cv, "id = 1", null);
    }

    public void setLastModule(String moduleName) {
        SQLiteDatabase db = getWritableDatabase();
        ContentValues cv = new ContentValues();
        cv.put("last_module", moduleName);
        db.update("learner_profile", cv, "id = 1", null);
    }

    public void recordQuizCompletion(int correctCount, int totalQuestions, int xpReward, int civicDelta) {
        LearnerProfile p = getProfile();
        p.xp += Math.max(10, xpReward);
        p.civicScore = Math.max(100, Math.min(2000, p.civicScore + civicDelta));
        p.quizzesCompleted += 1;

        SQLiteDatabase db = getWritableDatabase();
        ContentValues cv = new ContentValues();
        cv.put("xp", p.xp);
        cv.put("civic_score", p.civicScore);
        cv.put("quizzes_completed", p.quizzesCompleted);
        cv.put("last_module", "Traffic Academy");
        db.update("learner_profile", cv, "id = 1", null);

        logActivity("Traffic Academy", "Scored " + correctCount + "/" + totalQuestions + " In MVA Safety Drill", xpReward);
        evaluateBadges(p);
    }

    public void recordTypingSprint(int wpm, int accuracy, String modeName, int xpReward) {
        LearnerProfile p = getProfile();
        p.xp += Math.max(15, xpReward);
        if (wpm > p.bestWpm) {
            p.bestWpm = wpm;
        }

        SQLiteDatabase db = getWritableDatabase();
        ContentValues cv = new ContentValues();
        cv.put("xp", p.xp);
        cv.put("best_wpm", p.bestWpm);
        cv.put("last_module", "Typing Instructor");
        db.update("learner_profile", cv, "id = 1", null);

        logActivity("Typing Arena", wpm + " WPM (" + accuracy + "% Acc) In " + modeName, xpReward);
        evaluateBadges(p);
    }

    public void recordSolarExperiment(String planetOrExperiment, int xpReward) {
        LearnerProfile p = getProfile();
        p.xp += Math.max(10, xpReward);
        p.solarExperiments += 1;

        SQLiteDatabase db = getWritableDatabase();
        ContentValues cv = new ContentValues();
        cv.put("xp", p.xp);
        cv.put("solar_experiments", p.solarExperiments);
        cv.put("last_module", "Solar Engine");
        db.update("learner_profile", cv, "id = 1", null);

        logActivity("Solar Engine", "Completed Telemetry Analysis: " + planetOrExperiment, xpReward);
        evaluateBadges(p);
    }

    public void recordQrCreated(String typeLabel, int xpReward) {
        LearnerProfile p = getProfile();
        p.xp += Math.max(10, xpReward);
        p.qrCodesCreated += 1;

        SQLiteDatabase db = getWritableDatabase();
        ContentValues cv = new ContentValues();
        cv.put("xp", p.xp);
        cv.put("qr_codes_created", p.qrCodesCreated);
        cv.put("last_module", "QR Studio Matrix");
        db.update("learner_profile", cv, "id = 1", null);

        logActivity("QR Matrix", "Generated Custom " + typeLabel + " Matrix", xpReward);
        evaluateBadges(p);
    }

    public void recordCareerCompassResult(String topMatchTitle, int xpReward) {
        LearnerProfile p = getProfile();
        p.xp += Math.max(20, xpReward);
        p.topCareerMatch = topMatchTitle;

        SQLiteDatabase db = getWritableDatabase();
        ContentValues cv = new ContentValues();
        cv.put("xp", p.xp);
        cv.put("top_career_match", topMatchTitle);
        cv.put("last_module", "Career Compass");
        db.update("learner_profile", cv, "id = 1", null);

        unlockBadge("career_pathfinder");
        logActivity("Career Compass", "Matched Track: " + topMatchTitle, xpReward);
        evaluateBadges(p);
    }

    public void recordFocusSession(int minutes, int xpReward) {
        LearnerProfile p = getProfile();
        p.xp += Math.max(15, xpReward);
        p.focusMinutes += minutes;

        SQLiteDatabase db = getWritableDatabase();
        ContentValues cv = new ContentValues();
        cv.put("xp", p.xp);
        cv.put("focus_minutes", p.focusMinutes);
        db.update("learner_profile", cv, "id = 1", null);

        logActivity("Focus Studio", "Completed " + minutes + " Min Deep Focus Sprint", xpReward);
        evaluateBadges(p);
    }

    public void awardXp(int points, String moduleName, String summary) {
        LearnerProfile p = getProfile();
        p.xp += Math.max(5, points);
        SQLiteDatabase db = getWritableDatabase();
        ContentValues cv = new ContentValues();
        cv.put("xp", p.xp);
        db.update("learner_profile", cv, "id = 1", null);
        logActivity(moduleName, summary, points);
        evaluateBadges(p);
    }

    public void logActivity(String moduleName, String summary, int xpEarned) {
        SQLiteDatabase db = getWritableDatabase();
        String timeStr = new SimpleDateFormat("MMM d, HH:mm", Locale.US).format(new Date());
        ContentValues cv = new ContentValues();
        cv.put("module_name", moduleName);
        cv.put("summary", summary);
        cv.put("xp_earned", xpEarned);
        cv.put("created_at", timeStr);
        db.insert("activity_log", null, cv);
    }

    public List<ActivityEntry> getRecentActivities(int limit) {
        List<ActivityEntry> list = new ArrayList<>();
        SQLiteDatabase db = getReadableDatabase();
        Cursor c = db.rawQuery("SELECT module_name, summary, xp_earned, created_at FROM activity_log ORDER BY id DESC LIMIT " + limit, null);
        while (c.moveToNext()) {
            list.add(new ActivityEntry(
                    c.getString(0),
                    c.getString(1),
                    c.getInt(2),
                    c.getString(3)
            ));
        }
        c.close();
        return list;
    }

    public void unlockBadge(String badgeId) {
        SQLiteDatabase db = getWritableDatabase();
        ContentValues cv = new ContentValues();
        cv.put("badge_id", badgeId);
        cv.put("unlocked_at", new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date()));
        db.insertWithOnConflict("unlocked_badges", null, cv, SQLiteDatabase.CONFLICT_IGNORE);
    }

    private void evaluateBadges(LearnerProfile p) {
        unlockBadge("first_ignition");
        if (p.quizzesCompleted >= 1) unlockBadge("mva_scholar");
        if (p.civicScore >= 950) unlockBadge("mumbai_guardian");
        if (p.bestWpm >= 35) unlockBadge("velocity_typist");
        if (p.bestWpm >= 65) unlockBadge("grandmaster_keys");
        if (p.solarExperiments >= 1) unlockBadge("orbital_architect");
        if (p.qrCodesCreated >= 1) unlockBadge("qr_cryptographer");
        if (p.focusMinutes >= 15) unlockBadge("deep_work_zen");
        if (p.streakDays >= 3) unlockBadge("streak_champion");
        if (p.xp >= 500) unlockBadge("col_veteran");
        if (p.quizzesCompleted >= 1 && p.bestWpm >= 20 && p.solarExperiments >= 1 && p.qrCodesCreated >= 1) {
            unlockBadge("polymath_engineer");
        }
    }

    public List<BadgeItem> getAllBadges() {
        SQLiteDatabase db = getReadableDatabase();
        List<String> unlockedIds = new ArrayList<>();
        Cursor c = db.rawQuery("SELECT badge_id FROM unlocked_badges", null);
        while (c.moveToNext()) {
            unlockedIds.add(c.getString(0));
        }
        c.close();

        List<BadgeItem> badges = new ArrayList<>();
        badges.add(new BadgeItem("first_ignition", "🚀", "First Ignition", "Launch Class Of Learners v2.0 Mobile Suite", "#F2B84B", unlockedIds.contains("first_ignition")));
        badges.add(new BadgeItem("identity_forged", "🪪", "Identity Forged", "Customize Your Learner Handle & Preferred Vehicle", "#5ED4F5", unlockedIds.contains("identity_forged")));
        badges.add(new BadgeItem("mva_scholar", "🚦", "MVA Road Scholar", "Complete A Mumbai Motor Vehicles Act Drill", "#34D399", unlockedIds.contains("mva_scholar")));
        badges.add(new BadgeItem("mumbai_guardian", "🛡️", "Mumbai Civic Guardian", "Reach 950+ Civic Score In Road Safety", "#34D399", unlockedIds.contains("mumbai_guardian")));
        badges.add(new BadgeItem("velocity_typist", "⌨️", "Velocity Typist", "Achieve 35+ WPM In Native Typing Arena", "#F2B84B", unlockedIds.contains("velocity_typist")));
        badges.add(new BadgeItem("grandmaster_keys", "⚡", "Actuation Apex", "Achieve 65+ WPM In Native Typing Arena", "#F2B84B", unlockedIds.contains("grandmaster_keys")));
        badges.add(new BadgeItem("orbital_architect", "🪐", "Orbital Architect", "Run Telemetry Simulation In Solar Lab", "#5ED4F5", unlockedIds.contains("orbital_architect")));
        badges.add(new BadgeItem("qr_cryptographer", "🔳", "QR Cryptographer", "Generate A Custom Matrix In QR Studio", "#B89BFF", unlockedIds.contains("qr_cryptographer")));
        badges.add(new BadgeItem("career_pathfinder", "🧭", "Career Pathfinder", "Complete The 6-Axis Career Compass Assessment", "#F2B84B", unlockedIds.contains("career_pathfinder")));
        badges.add(new BadgeItem("deep_work_zen", "⏱️", "Deep Work Master", "Log 15+ Minutes In Engineering Focus Studio", "#5ED4F5", unlockedIds.contains("deep_work_zen")));
        badges.add(new BadgeItem("col_veteran", "👑", "CoL Vanguard", "Accumulate 500+ Total Engineering XP", "#34D399", unlockedIds.contains("col_veteran")));
        badges.add(new BadgeItem("polymath_engineer", "🌟", "Mumbai Polymath", "Master All 4 Offline Labs (Traffic, Typing, Solar, QR)", "#B89BFF", unlockedIds.contains("polymath_engineer")));
        return badges;
    }

    public static int getLevelForXp(int xp) {
        return Math.max(1, (xp / 100) + 1);
    }

    public static int getProgressWithinLevel(int xp) {
        return xp % 100;
    }

    public static String getRankTitleForXp(int xp) {
        int lvl = getLevelForXp(xp);
        if (lvl <= 2) return "Cadet Explorer";
        if (lvl <= 4) return "Junior Technologist";
        if (lvl <= 7) return "Mumbai Civic Scholar";
        if (lvl <= 11) return "Systems Architect";
        if (lvl <= 16) return "Principal Innovator";
        return "CoL Grandmaster";
    }
}
