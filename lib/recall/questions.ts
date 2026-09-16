import type { ConceptId, NodeId, QuestionId } from './types';

/**
 * One of a question's 3 concepts: the phrases (preferred term, synonyms, and
 * guessed Safari mis-hearings) that count as a hit. Matched case-insensitive,
 * substring — the same loose matching content/voice-recall-questions.md's
 * own "deliberately loose" question-detection rule uses, not word-boundary.
 */
export interface QuestionConcept {
  id: ConceptId;
  phrases: readonly string[];
}

/** One span of the Why? explanation. `concept` is set only where the span
 * names one of the question's 3 concepts — those are the spans that get
 * bolded when the (mocked) judge found that concept missing. Spans with no
 * `concept` (connecting prose, or a term outside the judge's 3 concepts,
 * like "eukaryotic"/"prokaryotic" on Q5) never bold. */
export interface ExplanationSegment {
  text: string;
  concept?: ConceptId;
}

/** Sample answers for SPEC.md's end-to-end check and the scripted transcript
 * source (lib/recall/scriptedTranscript.ts) standing in for real STT this
 * sprint. `list` only exists where content/voice-recall-questions.md gives
 * one (Q1) — a bare keyword list, capped at Partial regardless of concepts
 * hit. */
export interface QuestionSamples {
  pass: string;
  partial: string;
  fail: string;
  list?: string;
}

export interface Question {
  id: QuestionId;
  node: NodeId;
  prompt: string;
  concepts: readonly [QuestionConcept, QuestionConcept, QuestionConcept];
  explanation: readonly ExplanationSegment[];
  samples: QuestionSamples;
}

/**
 * All 8 questions, transcribed from content/voice-recall-questions.md (the
 * source of truth for wording). Node 1 is Organelle Identification (Q1–Q4),
 * node 2 is Comparing Cell Types (Q5–Q8). The mis-hearings there are
 * educated guesses, marked "Replace with what Safari actually produces
 * during the spike" — unchanged here since the spike hasn't run yet.
 */
export const QUESTIONS: Record<QuestionId, Question> = {
  Q1: {
    id: 'Q1',
    node: 1,
    prompt: 'What does the nucleus do in a cell?',
    concepts: [
      { id: 'A', phrases: ['dna', 'genetic material', 'genes', 'chromosomes', 'instructions', 'd and a', 'the na'] },
      {
        id: 'B',
        phrases: [
          'controls',
          'control center',
          'command center',
          'brain of the cell',
          'tells the cell what to do',
          'directs',
        ],
      },
      {
        id: 'C',
        phrases: [
          'nuclear membrane',
          'nuclear envelope',
          'membrane around it',
          'surrounded by a membrane',
          'new clear membrane',
          'nuclear envelop',
        ],
      },
    ],
    explanation: [
      { text: "The nucleus is the cell's " },
      { text: 'control center', concept: 'B' },
      { text: ". It holds the cell's " },
      { text: 'DNA', concept: 'A' },
      { text: ", the instructions for everything the cell does, and uses them to direct the cell's activities. It's kept separate from the rest of the cell by a " },
      { text: 'nuclear membrane', concept: 'C' },
      { text: '.' },
    ],
    samples: {
      pass: 'The nucleus is like the control center, it holds the DNA.',
      partial: "It's where the DNA is.",
      fail: "It's the part that makes energy.",
      list: 'DNA, control, membrane.',
    },
  },
  Q2: {
    id: 'Q2',
    node: 1,
    prompt: 'What do mitochondria do, and why does a cell need them?',
    concepts: [
      { id: 'A', phrases: ['energy', 'power', 'powerhouse', 'atp', 'power house', 'a t p'] },
      {
        id: 'B',
        phrases: ['respiration', 'cellular respiration', 'respire', 'rest per ation', 'cellular aspiration'],
      },
      { id: 'C', phrases: ['glucose', 'sugar', 'food', 'oxygen', 'glue cose', 'glucos'] },
    ],
    explanation: [
      { text: 'Mitochondria are where the cell gets its ' },
      { text: 'energy', concept: 'A' },
      { text: '. They break down ' },
      { text: 'glucose', concept: 'C' },
      { text: ' (sugar from food) using oxygen in a process called ' },
      { text: 'cellular respiration', concept: 'B' },
      { text: ', and the energy released powers everything else the cell does.' },
    ],
    samples: {
      pass: 'They make energy for the cell by breaking down glucose.',
      partial: "They're the powerhouse of the cell.",
      fail: 'They help the cell divide.',
    },
  },
  Q3: {
    id: 'Q3',
    node: 1,
    prompt: 'What does the cell membrane do?',
    concepts: [
      {
        id: 'A',
        phrases: ['outside', 'outer layer', 'surrounds', 'around the cell', 'boundary', 'edge', 'sell membrane', 'member ain'],
      },
      {
        id: 'B',
        phrases: [
          'in and out',
          'enter and leave',
          'lets things in',
          'lets things through',
          'controls what',
          'gatekeeper',
          'selectively permeable',
          'semi-permeable',
        ],
      },
      { id: 'C', phrases: ['protects', 'protection', 'keeps harmful things out', 'shield'] },
    ],
    explanation: [
      { text: 'The cell membrane is the thin layer that ' },
      { text: 'surrounds', concept: 'A' },
      { text: ' the cell. It ' },
      { text: 'controls what enters and leaves', concept: 'B' },
      { text: ": it lets in things the cell needs, like water and nutrients, and keeps out or removes things it doesn't. That also helps " },
      { text: 'protect', concept: 'C' },
      { text: ' the cell.' },
    ],
    samples: {
      pass: 'It goes around the cell and controls what comes in and out.',
      partial: 'It protects the cell.',
      fail: "It's where photosynthesis happens.",
    },
  },
  Q4: {
    id: 'Q4',
    node: 1,
    prompt: 'What do chloroplasts do, and which cells have them?',
    concepts: [
      {
        id: 'A',
        phrases: ['photosynthesis', 'make food', 'make sugar', 'make glucose', 'photo synthesis', 'photosynthesize'],
      },
      {
        id: 'B',
        phrases: ['light', 'sunlight', 'sun', 'light energy', 'chlorophyll', 'chloro fill', 'clora fill'],
      },
      { id: 'C', phrases: ['plant', 'plants', 'plant cells', 'algae', 'plant sells'] },
    ],
    explanation: [
      { text: 'Chloroplasts are where ' },
      { text: 'photosynthesis', concept: 'A' },
      { text: ' happens. They use a green pigment, chlorophyll, to capture ' },
      { text: 'light energy', concept: 'B' },
      { text: ' from the sun and turn water and carbon dioxide into sugar the cell can use. They\'re found in ' },
      { text: 'plant cells', concept: 'C' },
      { text: ' and algae, but not in animal cells.' },
    ],
    samples: {
      pass: 'They use sunlight to make food, and plants have them.',
      partial: 'Plant cells have them.',
      fail: 'They store water.',
    },
  },
  Q5: {
    id: 'Q5',
    node: 2,
    prompt: 'Where is the DNA in a prokaryotic cell, and where is it in a eukaryotic cell?',
    concepts: [
      {
        id: 'A',
        phrases: ['cytoplasm', 'floats', 'floating', 'loose', 'free', 'circular', 'ring', 'loop', 'site oh plasm', 'psycho plasm'],
      },
      { id: 'B', phrases: ['nucleus', 'in the nucleus', 'new clear us', 'nucleolus'] },
      { id: 'C', phrases: ['bacteria', 'plant', 'animal', 'fungi', 'human', 'back teria', 'fun guy'] },
    ],
    explanation: [
      { text: 'In a eukaryotic cell, like a plant, animal or fungus cell, the DNA is kept inside the ' },
      { text: 'nucleus', concept: 'B' },
      { text: '. A prokaryotic cell, like ' },
      { text: 'bacteria', concept: 'C' },
      { text: ', has no nucleus, so its DNA, usually a single loop, ' },
      { text: 'floats in the cytoplasm', concept: 'A' },
      { text: '.' },
    ],
    samples: {
      pass: "In bacteria the DNA just floats in the cytoplasm, but in animal cells it's in the nucleus.",
      partial: "In eukaryotic cells it's in the nucleus.",
      fail: "It's in the cell wall.",
    },
  },
  Q6: {
    id: 'Q6',
    node: 2,
    prompt: 'Why do plant cells need a cell wall and chloroplasts?',
    concepts: [
      {
        id: 'A',
        phrases: ['support', 'strong', 'stiff', 'rigid', 'shape', 'structure', 'hold up', 'stand up', 'sell wall'],
      },
      { id: 'B', phrases: ['photosynthesis', 'make food', 'make sugar', 'glucose', 'photo synthesis', 'chloro plast'] },
      { id: 'C', phrases: ['sunlight', 'light', 'sun', "can't move", "can't eat", 'stay in one place'] },
    ],
    explanation: [
      { text: "Plants can't move around to find food, so they make their own. Chloroplasts use " },
      { text: 'sunlight', concept: 'C' },
      { text: ' to make sugar through ' },
      { text: 'photosynthesis', concept: 'B' },
      { text: '. And with no skeleton, plants rely on the stiff cell wall around each cell for ' },
      { text: 'support', concept: 'A' },
      { text: ', which is what lets them stand upright.' },
    ],
    samples: {
      pass: 'The cell wall keeps the plant stiff and chloroplasts make its food from sunlight.',
      partial: 'Chloroplasts do photosynthesis.',
      fail: 'So they can store water.',
    },
  },
  Q7: {
    id: 'Q7',
    node: 2,
    prompt: 'What do ribosomes do, and where are they found?',
    concepts: [
      { id: 'A', phrases: ['protein', 'proteins', 'protein synthesis', 'build proteins', 'pro teens'] },
      { id: 'B', phrases: ['all cells', 'every cell', 'both', 'prokaryotic and eukaryotic', 'bacteria too'] },
      {
        id: 'C',
        phrases: ['cytoplasm', 'endoplasmic reticulum', 'er', 'rough er', 'site oh plasm', 'psycho plasm', 'e r'],
      },
    ],
    explanation: [
      { text: 'Ribosomes are where the cell ' },
      { text: 'makes proteins', concept: 'A' },
      { text: ', following instructions that come from DNA. They\'re found in ' },
      { text: 'all cells', concept: 'B' },
      { text: ', prokaryotic and eukaryotic alike, either floating in the ' },
      { text: 'cytoplasm', concept: 'C' },
      { text: ' or attached to the rough endoplasmic reticulum.' },
    ],
    samples: {
      pass: 'Ribosomes make proteins and every cell has them.',
      partial: 'They make proteins.',
      fail: 'They store the DNA.',
    },
  },
  Q8: {
    id: 'Q8',
    node: 2,
    prompt: 'What is cytoplasm, and what happens there?',
    concepts: [
      { id: 'A', phrases: ['jelly', 'gel', 'jelly-like', 'fluid', 'liquid', 'goo', 'site oh plasm', 'psycho plasm'] },
      {
        id: 'B',
        phrases: ['fills', 'holds the organelles', 'surrounds the organelles', 'organelles float'],
      },
      {
        id: 'C',
        phrases: ['reactions', 'chemical reactions', 'where things happen', 'moves materials', "where the cell's work happens"],
      },
    ],
    explanation: [
      { text: 'Cytoplasm is the ' },
      { text: 'jelly-like fluid', concept: 'A' },
      { text: ' that ' },
      { text: 'fills the cell', concept: 'B' },
      { text: ' and surrounds the organelles. Many of the cell\'s ' },
      { text: 'chemical reactions', concept: 'C' },
      { text: " happen in it, and it helps move materials around inside the cell." },
    ],
    samples: {
      pass: "It's the jelly stuff that fills the cell and holds the organelles.",
      partial: "It's a liquid inside the cell.",
      fail: "It's the outer wall of the cell.",
    },
  },
};

/** Node 1's questions in order, then node 2's — content/voice-recall-
 * questions.md's own "written simplest first" order; randomising it is
 * still an open item (SPEC.md). */
export const NODE_QUESTIONS: Record<NodeId, readonly QuestionId[]> = {
  1: ['Q1', 'Q2', 'Q3', 'Q4'],
  2: ['Q5', 'Q6', 'Q7', 'Q8'],
};
