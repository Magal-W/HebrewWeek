/* This file is generated and managed by tsync */

interface MistakeReport {
  name: string;
  mistake: string;
}

interface MistakeSuggestion {
  id: number;
  name: string;
  mistake: string;
  context: string;
}

interface CountedMistake {
  mistake: string;
  count: number;
}

interface PersonMistake {
  name: string;
  counted_mistake: CountedMistake;
}

interface PersonMistakes {
  name: string;
  counted_mistakes: Array<CountedMistake>;
}

interface Translation {
  english: string;
  hebrew: string;
}

interface TranslationSuggestion {
  id: number;
  english: string;
  hebrew: string;
}

interface CanonicalRequest {
  word: string;
  canonical: string;
}
