import React from 'react';
import { Composition } from 'remotion';
import './index.css';
import { ViralSixProjectsShort } from './scenes/ViralSixProjectsShort';
import { TrafficHeroShorts } from './scenes/TrafficHeroShorts';
import { TechSpotlightShorts } from './scenes/TechSpotlightShorts';
import { LongFormStudioShowcase } from './scenes/LongFormStudioShowcase';
import { TenMinuteMasterDocumentary } from './scenes/TenMinuteMasterDocumentary';
import { MumbaiTrafficHeroThreeMinShort } from './scenes/MumbaiTrafficHeroThreeMinShort';
import { PhonkDriftShort } from './scenes/PhonkDriftShort';
import { BuildProjectsWithAIFreeShort } from './scenes/BuildProjectsWithAIFreeShort';
import { FreeAIToolsAndJioGoogleProShort } from './scenes/FreeAIToolsAndJioGoogleProShort';
import { MasterTechEcosystemShort } from './scenes/MasterTechEcosystemShort';
import { ResearchTechStackReport, RESEARCH_TOTAL_FRAMES } from './scenes/ResearchTechStackReport';
import { ResearchShorts, RESEARCH_SHORTS_TOTAL } from './scenes/ResearchShorts';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 0. YOUTUBE SHORTS — Comprehensive Research 60s Vertical (1080x1920, ~83s) */}
      <Composition
        id="ResearchShorts"
        component={ResearchShorts}
        durationInFrames={RESEARCH_SHORTS_TOTAL}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* 0-L. COMPREHENSIVE RESEARCH REPORT — Tech Stack, AI Ecosystem & Infrastructure (1920x1080, ~3:01) */}
      <Composition
        id="ResearchTechStackReport"
        component={ResearchTechStackReport}
        durationInFrames={RESEARCH_TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* 0.1 MASTER TECH ECOSYSTEM & ARCHITECTURE SHOWCASE (1080x1920, ~80s) */}
      <Composition
        id="MasterTechEcosystemShort"
        component={MasterTechEcosystemShort}
        durationInFrames={2420}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* 0A. FREE AI TOOLS & JIO GOOGLE PRO SHORT (1080x1920, 66s) */}
      <Composition
        id="FreeAIToolsAndJioGoogleProShort"
        component={FreeAIToolsAndJioGoogleProShort}
        durationInFrames={1980}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* 0B. BUILD WITH AI FOR FREE SHORT (1080x1920, 68s) */}
      <Composition
        id="BuildProjectsWithAIFreeShort"
        component={BuildProjectsWithAIFreeShort}
        durationInFrames={2060}
        fps={30}
        width={1080}
        height={1920}
      />


      {/* 1. VIRAL PHONK / FUNK DRIFT SHORT (1080x1920, 30s) */}
      <Composition
        id="PhonkDriftShort"
        component={PhonkDriftShort}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* 2. VIRAL MASTER 6-PROJECTS SHORT (1080x1920, 39s) */}
      <Composition
        id="ViralSixProjectsShort"
        component={ViralSixProjectsShort}
        durationInFrames={1180}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* 3. 3-MINUTE MUMBAI TRAFFIC HERO ACTION SHORT (1080x1920, ~2.18 Mins) */}
      <Composition
        id="MumbaiTrafficHeroThreeMinShort"
        component={MumbaiTrafficHeroThreeMinShort}
        durationInFrames={3950}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* 4. MUMBAI TRAFFIC HERO QUICK SHORT (1080x1920, 30s) */}
      <Composition
        id="TrafficHeroShort"
        component={TrafficHeroShorts}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* 5. TECH & AI SPOTLIGHT SHORT (1080x1920, 30s) */}
      <Composition
        id="TechSpotlightShort"
        component={TechSpotlightShorts}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* 6. LONG-FORM STUDIO SHOWCASE LANDSCAPE (1920x1080, 60s) */}
      <Composition
        id="LongFormShowcase"
        component={LongFormStudioShowcase}
        durationInFrames={1800}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* 7. TEN-MINUTE MASTERCLASS DOCUMENTARY LANDSCAPE (1920x1080, ~9 Mins) */}
      <Composition
        id="TenMinuteMasterDocumentary"
        component={TenMinuteMasterDocumentary}
        durationInFrames={15200}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
