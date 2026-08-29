import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { SpeedInsights } from '@vercel/speed-insights/react';
import DrivingSimulator from './DrivingSimulator';
import AchievementToast from './components/HUD';
const getSupabase = () => (typeof window !== 'undefined' ? ((window as any).supabaseClient || (window as any).supabase) : null);

const GamePage = () => {
  const [achievement, setAchievement] = useState<{ title: string; message: string } | null>(null);
  const userIdRef = useRef<string | null>(null);
  const globalScoreIdRef = useRef<string | null>(null);

  useEffect(() => {
    const initGameSession = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          userIdRef.current = user.id;
        }

        const { data: def } = await supabase
          .from('achievement_definitions')
          .select('id')
          .eq('slug', 'global_score')
          .single();

        if (def) {
          globalScoreIdRef.current = def.id;
        }
      } catch (error) {
        console.error('Error initializing game session:', error);
      }
    };

    initGameSession();
  }, []);

  const triggerAchievement = useCallback(async (slug: string) => {
    const supabase = getSupabase();
    if (!supabase) return;

    const { data, error } = await supabase.rpc('complete_achievement', { target_achievement_slug: slug });
    if (data) {
      setAchievement({
        title: `Achievement Unlocked!`,
        message: `You've earned the ${slug} achievement!`,
      });
    }
    if (error) {
      console.error('Error triggering achievement:', error);
    }
  }, []);

  const syncScore = useCallback(async (score: number) => {
    const userId = userIdRef.current;
    const achievementId = globalScoreIdRef.current;
    const supabase = getSupabase();

    if (!userId || !achievementId || !supabase) return;

    const { error } = await supabase.from('user_achievements').upsert({
      user_id: userId,
      achievement_id: achievementId,
      current_value: score,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error syncing score:', error);
    }
  }, []);

  const closeAchievement = useCallback(() => {
    setAchievement(null);
  }, []);

  return (
    <div className="relative h-screen w-screen">
      <SpeedInsights />
      <DrivingSimulator
        onScoreChange={syncScore}
        onAchievementTrigger={triggerAchievement}
      />
      <AchievementToast
        isVisible={!!achievement}
        title={achievement?.title || ''}
        message={achievement?.message || ''}
        onClose={closeAchievement}
      />
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<GamePage />);
} else {
  console.error("Root element not found to mount GamePage");
}
