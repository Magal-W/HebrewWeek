/* This file is generated and managed by tsync */

type Mistake = string

interface MistakeReport {
  name: string;
  mistake: Mistake;
}

interface CountedMistake {
  mistake: Mistake;
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
