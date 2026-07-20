import React, { useEffect } from 'react';

interface AchievementToastProps {
  isVisible: boolean;
  title: string;
  message: string;
  onClose?: () => void;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({ isVisible, title, message, onClose }) => {
  useEffect(() => {
    if (isVisible && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-6 right-6 z-50 pointer-events-none">
      <div
        className="translate-x-0 transition-transform duration-500 ease-out transform"
        style={{
          animation: 'slideIn 0.5s ease-out forwards'
        }}
      >
        <div
          className="min-w-[300px] max-w-sm rounded-2xl border border-white/20 p-4 backdrop-blur-xl shadow-2xl"
          style={{
            backgroundColor: 'rgba(var(--void), 0.6)', // Using --void if it's defined as RGB or similar, but let's use standard glassmorphism
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
            borderColor: 'var(--ion)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl"
              style={{ backgroundColor: 'var(--signal)' }}
            >
              🏆
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg leading-tight">
                {title}
              </h3>
              <p className="text-white/80 text-sm mt-1">
                {message}
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default AchievementToast;
