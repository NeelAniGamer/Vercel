import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { Background } from './components/Background';
import { ProgressBar } from './components/ProgressBar';
import { IntroScene } from './scenes/IntroScene';
import { AboutScene } from './scenes/AboutScene';
import { ProjectsScene } from './scenes/ProjectsScene';
import { OutroScene } from './scenes/OutroScene';

export const ShortsShowcase: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#05070e', overflow: 'hidden' }}>
      {/* Dynamic Ambient Background */}
      <Background />

      {/* Top Animated Progress Indicator */}
      <ProgressBar />

      {/* SCENE 1: Hook & Studio Intro (0s - 5s / Frames 0 - 150) */}
      <Sequence from={0} durationInFrames={150}>
        <IntroScene />
      </Sequence>

      {/* SCENE 2: About Our Studio & Mission (5s - 10s / Frames 150 - 300) */}
      <Sequence from={150} durationInFrames={150}>
        <AboutScene />
      </Sequence>

      {/* SCENE 3: Project Showcases (10s - 22s / Frames 300 - 660) */}
      <Sequence from={300} durationInFrames={360}>
        <ProjectsScene />
      </Sequence>

      {/* SCENE 4: URL Reveal & Call To Action (22s - 30s / Frames 660 - 900) */}
      <Sequence from={660} durationInFrames={240}>
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
