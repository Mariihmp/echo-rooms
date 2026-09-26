import type React from 'react';

export interface LessonChapter {
  title: string;
  // Paragraphs are separated by a blank line
  body: string;
  // Short instruction pointing the player at the interactive stage
  tryIt?: string;
}

export interface LessonStageProps {
  // 0-based index of the chapter currently shown
  chapter: number;
}

export interface LessonDef {
  episodeId: number;
  reel: string; // e.g. 'LAB REEL 204'
  title: string; // e.g. 'Inside Model 204'
  subtitle: string; // the concepts the lesson covers
  narrator: string; // who tells the story
  accent: string; // hex colour for highlights in the lesson frame
  chapters: LessonChapter[];
  // One stage instance lives for the whole lesson, so the model's state carries across chapters
  Stage: React.FC<LessonStageProps>;
}
