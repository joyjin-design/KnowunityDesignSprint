# Design Brief

**Summary**

An active-recall step for Knowunity, driven by voice. After a student revises a section, they explain the key ideas out loud in their own words. They speak, Knowie answers in text.

Speaking forces genuine retrieval in a way that tapping a multiple-choice option doesn't. It surfaces gaps, mirrors how knowledge actually gets used in an exam, and is far lower friction on mobile than typing.

---

## What's changed since the kickoff

Since we recorded the kickoff call, Knowunity has shipped a light version of this feature to beta, on limited availability. If you can reach it, use it and factor it in.

Treat it as one team's first pass, not as the target. It answers some of what's below and leaves a lot open: where the feature lives, how a student first meets it, how the loop behaves, what feedback it gives, what the summary claims, and what happens once the session ends.

Your job is to work out where a stronger version is, and build that. Not to reproduce what's there.

---

## The user problem

After revising a section, a student has *seen* the material but hasn't proven they can *retrieve* it. The existing steps test recognition or application. None of them make a student pull a concept out of memory and say it.

And students lack a felt signal of **"I actually know this now."** That signal is part of what brings them back before an exam. It's also the hardest part of this to design, because it has to be earned rather than asserted.

## The bet

If we give students a voice-based active-recall step, they'll complete it at a healthy rate because speaking is lower friction than typing, and they'll come away with a stronger sense of mastery. That should drive more exam plan usage and better retention.

## What we know

Numbers pulled around the time of the kickoff call, last 30 days.

- **Voice is already normal here.** About 15.2% of active AI Chat users, roughly 642,000 people, sent at least one voice message. The "students won't talk to the app" fear is mostly overblown, though a sustained self-check asks more than a one-off voice query.
- **Exam plan reach.** About 16.6% of daily users touch the exam plan, and 9.6% start a step.
- **The heaviest existing step, the mock exam, completes at 57.2%.** Lighter steps sit around 80%.

## What success looks like

Two numbers matter.

- **Activation.** At least 25% of students who see it, start it.
- **Completion.** At least 70% of students who start it, finish it.

These pull in different directions and both are yours to design for. Activation is about how a student encounters the feature. Completion is about whether the loop is worth staying inside once they're in it.

---

## Hard constraints

These don't move.

- **Voice in, text out.** Knowie never speaks. The student's voice is the input; every response is on screen.
- **Push-to-talk with an explicit send.** The student starts recording and stops it themselves. No auto-endpointing, no guessing when someone has finished talking.
- **Recall only, not tutoring.** If a student asks a question, this doesn't branch into a conversation.
- **Never trap the student.** Every required action has a way out, including for a student who can't speak right now.
- **Judge generously.** A false "wrong" is far more demoralizing here than in multiple choice.
- **Expect a wait.** Transcription plus judging takes a few seconds per turn. Your design has to cover that gap.

And for the prototype itself:

- **Mobile iOS only.** 390px wide, dark mode.
- **The recall is mocked.** No real speech recognition, no real judging. You're designing the experience, not building the engine.

---

## What Knowunity specified at kickoff

This is what the team asked for at the kickoff, before anything was built. It's here so you know their thinking, not because you have to match it.

- **The loop.** Knowie shows a prompt. The student speaks. The answer comes back as pass, partial, or fail. On a miss: a hint that nudges without giving it away, a re-attempt, a second hint, another re-attempt, then reveal. Skip available throughout.
- **Say it back.** After a hinted pass or a reveal, an optional chance to repeat the full answer unaided.
- **Session length.** Three to five terms, drawn from the section just revised.
- **Placement.** A step inside the exam plan section sequence, after the quizzes.
- **First run.** A short screen explaining what active recall is and why it works. Skipped after that.
- **Leaving.** Progress saves, returning resumes.
- **XP.** Counts up during the session, collected at the end.
- **Summary.** How many terms the student explained unaided, with a per-term breakdown of unaided, hinted, revealed, and skipped. Continue as the primary action, Try again as secondary.
- **Feedback rhythm.** One beat of acknowledgment, then the next prompt. Explanations held back until the end.
- **If the student can't speak right now**, a way to type instead.

---

## Your mandate

Design the strongest version of voice-based active recall for Knowunity.

Everything in the section above is open. In particular:

- **Where it lives.** The original spec put it in the exam plan. The beta put it somewhere else. Neither has been tested. It might belong in one place, or in several.
- **How a student first meets it.** What makes someone try this the first time, and what brings them back the second.
- **How the loop behaves.** Prompt, answer, response, recovery from a miss.
- **What feedback the student gets,** and when.
- **What the summary claims, and whether it's earned.** Overconfidence has to cost something and underconfidence has to be rewarded, or the screen is just flattery.
- **What happens after.** The session ends, and then what. This is where retention lives and it's the least designed part of the whole thing.

What isn't open: the hard constraints, and the user problem. If your design doesn't leave a student with a real signal that they know something, it hasn't solved the brief.

---

## Open questions

1. What happens when a student genuinely doesn't know a term at all? Bail out and suggest revisiting, or low-stakes encouragement to try anyway?
2. What the XP mechanic actually is, and how it motivates without pulling attention away from the recall itself.

<aside>
✅

**Read + add to your Claude instructions: (Directions in Module 2)**

[Voice UX Reference](https://app.notion.com/p/Voice-UX-Reference-83462791470982bc91f7818b888bd5cf?pvs=21)

</aside>