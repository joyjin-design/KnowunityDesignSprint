# Sprint Context

## What this is
Voice-based active recall for Knowunity. Student speaks a term aloud, Knowie judges pass/partial/fail in text only.

## Committed concept
Voice recall is a toggleable mode on the exam plan, not a new node type. Turning it on changes how existing topic nodes work.

## Where the recall step lives
Exam plan path screen. A "Voice recall" toggle pill sits at top; when on, topic nodes swap to a mic icon and open into the voice loop instead of their normal activity.

## Decisions log
- Toggle off, nodes keep current default behavior unchanged, this sprint designs only the on-mode variant, toggle, and banner
- Node icon swaps to mic only when mode is on, because the icon signals mode state, not step type
- Toggle label is "Voice recall" with no on/off suffix, state is shown by the pill's fill, not by text
- A readiness banner ("Voice recall is ready... Show me") appears above the section before a node is reached, because prior steps give no warning that speaking is coming
- "Show me" highlights the toggle, it does not jump into the loop, because enabling the mode comes first
- Push to talk only, no auto-endpointing, because guessing when someone stops talking is voice's most common failure
- Knowie never speaks, every response is text
- Verdict is pass, partial, or fail, not binary, because a false "wrong" costs more here than in multiple choice
- Transcript is always shown back, so a wrong verdict reads as heard wrong, not app broken
- Text fallback reachable in one tap every turn, because voice-only excludes students who can't speak right now
- Skip is available on any term, no hard wall
- transcriptDisplay's four states (Empty, Filled, Overflow, Silence) each have fixed content, not one shared property
- buttonVoice's Recording state is a CTA-text-only swap, no mic/waveform icon exists yet to animate
- bottomSheetVerdict's Partial state uses accent/blue as a placeholder, no real Partial token exists yet

## Not building
- Auto-endpointing or continuous listening
- Tutoring or open conversation branch if the student asks Knowie something
- Real speech-to-text or real judging (mocked)
