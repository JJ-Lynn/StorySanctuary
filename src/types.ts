export type StoryStatus = 'Yet' | '-ing' | 'Done';

export interface Story {
  id: string;
  originalTitle: string;
  englishTitle: string;
  vietnameseTitle: string;
  author: string;
  couple: string;
  fandom: string;
  chapters: number;
  isCompleted: boolean;
  readingStatus: StoryStatus;
  translationStatus: StoryStatus;
  rating: number;
  summary?: string;
  tags?: string[];
  wordCount?: number;
  links: {
    original?: string;
    translation?: string;
  };
}

export interface Stat {
  label: string;
  value: string;
  icon: string;
  color: string;
}
