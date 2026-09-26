export type CharacterId = 'sal' | 'larry' | 'morrison' | 'caretaker' | 'echo7' | 'system';

export interface DialogueLine {
  id: string;
  speaker: CharacterId;
  speakerName: string;
  text: string;
  choices?: {
    text: string;
    nextDialogueId?: string;
    action?: () => void;
  }[];
}

export interface CaseFile {
  id: string;
  episodeId: number;
  title: string;
  subtitle: string;
  conceptName: string;
  realWorldPaper: string;
  incidentLog: string;
  educationalTakeaway: string[];
  unlocked: boolean;
}

export interface PuzzleHint {
  level: 1 | 2 | 3;
  title: string;
  text: string;
}

export interface Episode {
  id: number;
  roomNumber: string;
  title: string;
  subtitle: string;
  concept: string;
  description: string;
  storyIntro: string;
  status: 'locked' | 'unlocked' | 'completed';
  hints: PuzzleHint[];
  caseFileId: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  icon: string;
}
