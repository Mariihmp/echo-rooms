import React from 'react';
import type { LessonDef } from './types';
import { LESSON_COLORS as C, StageShell } from './lessonKit';

// Placeholder until the full lesson for this room is written
export const lesson101: LessonDef = {
  episodeId: 1,
  reel: 'LAB REEL 101',
  title: 'Inside Caretaker-8',
  subtitle: '',
  narrator: 'Dr. Morrison',
  accent: C.teal,
  chapters: [{ title: 'Reel still rewinding', body: 'This lesson is being written.' }],
  Stage: () => <StageShell viewBox="0 0 760 430" svg={null} />,
};
