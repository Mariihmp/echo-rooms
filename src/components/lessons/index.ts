import type { LessonDef } from './types';
import { lesson101 } from './Room101Lesson';
import { lesson204 } from './Room204Lesson';
import { lesson302 } from './Room302Lesson';
import { lesson405 } from './Room405Lesson';
import { lessonPenthouse } from './PenthouseLesson';

// "Look inside the machine" lessons, keyed by episode id
export const LESSONS: Record<number, LessonDef> = {
  1: lesson101,
  2: lesson204,
  3: lesson302,
  4: lesson405,
  5: lessonPenthouse,
};
