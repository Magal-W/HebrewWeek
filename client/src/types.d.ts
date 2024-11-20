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

interface SuggestedMistake {
  mistake: MistakeSuggestion;
  reporter: string;
}

interface DiscardMistakeSuggestion {
  id: number;
  accepted: boolean;
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

interface TranslationAddition {
  translation: Translation;
  suggestor: string;
}

interface TranslationSuggestion {
  id: number;
  english: string;
  hebrew: string;
}

interface SuggestedTranslation {
  translation: TranslationSuggestion;
  suggestor: string;
}

interface CanonicalRequest {
  word: string;
  canonical: string;
}
