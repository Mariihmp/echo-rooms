import React from 'react';
import type { LessonDef } from './types';
import { LESSON_COLORS as C, StageShell } from './lessonKit';

// Placeholder until the full lesson for this room is written
export const lesson405: LessonDef = {
  episodeId: 4,
  reel: 'LAB REEL 405',
  title: 'Inside the Thermal Core',
  subtitle: '',
  narrator: 'Dr. Morrison',
  accent: C.teal,
  chapters: [{ title: 'Reel still rewinding', body: 'This lesson is being written.' }],
  Stage: () => <StageShell viewBox="0 0 760 430" svg={null} />,
};
