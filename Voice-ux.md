# Voice UX Reference

A short, practical companion to the Design Brief. It exists because voice has a few
traps that aren't obvious from GUI experience. This is **not** an exhaustive
voice-UI manual…it's the handful of things that actually matter for *this*
feature (voice-in / text-out, push-to-talk, inside the exam plan) in a 2.5-week
sprint.

Read it once before designing the recall loop. Come back to the **States to
design** checklist when you're working on screens.

---

## First, the one misconception to kill

Voice input is **not** a voice assistant. We are not building Siri, Alexa, or a
talking tutor (the brief rules out voice output entirely: see Non-Goals). The
student speaks; Knowie answers in **text**. That's a much smaller, safer design
problem than two-way voice conversation.

The good news: you don't need new rules for it. Nielsen Norman Group's core
finding on voice is that *classic usability principles still apply:* error
prevention, visibility of system status, flexibility, and recognition over
recall are exactly the heuristics that make or break a voice feature, same as
any screen.

([NN/g — Voice Interaction UX](https://www.nngroup.com/articles/voice-interaction-ux/))

---

## Six principles that matter here

### 1. Show system status at every single moment

This is the #1 voice-input principle. With a button you can *see* that a tap
registered. With voice, the student is talking into the void unless the screen
tells them what's happening. At all times the UI must make the current state
obvious:

`idle → listening/recording → processing → result`

If the student can't tell whether the app is recording, they freeze. If they
can't tell it's "thinking" after they stop, they assume it broke and tap again.
Design a distinct, unmistakable visual for each state (and remember: **no
hover** on mobile, and color alone isn't enough: pair it with a shape, icon,
or motion, per the platform constraints).

### 2. Keep the student in control of start and stop

The brief's **push-to-talk** mechanic (hold/tap to record, explicit stop =
send) is the right call, and it's worth understanding *why*: the most common
voice failure isn't bad transcription, it's the system guessing wrong about
*when the user is speaking:* especially with background noise.

([NN/g](https://www.nngroup.com/articles/voice-interaction-ux/)) Push-to-talk: removes that guess entirely. Don't "improve" it by adding auto-detection of when someone's done talking, that's explicitly out of scope, and for good reason.

Always let the student **cancel and re-record before sending** (also in the
brief). A fumbled first sentence should never force a bad submission.

### 3. Ask for the mic permission *in context*, with a primer: and design the "No"

You get **one** native OS permission prompt per feature. If the student taps
"Don't Allow," getting them back is painful (they have to dig into OS settings).
So:

- **Never** fire the mic request cold on app open or before the student
understands why. Trigger it from a clear user action (tapping the mic / "Start
speaking"). Context-related requests are far less likely to be denied than
system-initiated ones.
([NN/g — Permission Requests](https://www.nngroup.com/articles/permission-requests/))
- **Prime it first** with our own screen that explains the value, *then* let the
OS dialog appear. Our closest real-world analogue is **Babbel**, a
language-learning app that asks for the mic at the speaking-practice moment,
framed as *"Would you like to practice speaking?"*, and lets users opt out
just as easily.
([Babbel teardown](https://goodux.appcues.com/blog/babbel-mobile-permission-priming))
- **Design the denied state.** If permission is refused, the student must still
have a way forward — that's the text fallback (F9). Tell them what they're
missing and how to re-enable, don't dead-end them.
([Permission priming strategies](https://www.appcues.com/blog/mobile-permission-priming))

This maps cleanly onto the brief's F5 "first encounter" intro screen, that
screen is your primer.

### 4. Be generous, and separate "misheard" from "didn't know it"

The brief is right that a false "wrong" is more demoralizing here than in a
multiple-choice quiz. A big chunk of false wrongs come from **speech-to-text
mishearing the student**, not from the student being wrong. So:

- Briefly **show what was heard** (the transcript) alongside the result, so a
misheard answer reads as "the app misheard me," not "I failed." Showing the
recognized text back is a standard transcription pattern.
- But **don't make correcting the transcript a required step,** typing
corrections re-introduces exactly the keyboard friction voice is meant to
remove (and would muddy the experiment). Lean on **generous judging** instead
of student correction.
- Tune the judge to be encouraging. When in doubt between pass and partial on a
close answer, prefer the kinder read.

### 5. Always offer a non-voice path: it's accessibility *and* situational

The text fallback (F9) isn't just a "nice to have." Some students physically
can't or don't speak; many more simply *can't speak right now* (library, shared
room, late at night, on a bus). A voice-only feature excludes all of them and,
per the brief, drops them from both activation and completion. Keep voice the
**primary** affordance, but make sure text is always reachable in one tap. Never
trap the student, this is the brief's core principle applied to modality.

### 6. Design for the wait: latency is a UX problem, not just an engineering one

Every turn has an STT + judge round-trip (the brief targets <4s). Four seconds
of blank screen feels broken. The "processing" state from Principle 1 is what
covers this gap: show a clear, calm "thinking" state (a skeleton/animated state,
not a dead spinner,  see platform constraints) so the student knows their answer
landed and an answer is coming. This matters doubly on the budget Android phones
a lot of students use.

---

## States to design: and what to actually build in 2.5 weeks

This is the realistic part. You can't design for infinite edge cases in a
sprint, and you shouldn't try. Here's a bounded list, triaged. **Build the
"Must" column well; sketch the "If time" column; explicitly note the "Out of
scope" ones as known gaps** rather than pretending they don't exist.

| State / edge case | Priority | Notes |
| --- | --- | --- |
| Idle (mic ready, prompt shown) | **Must** | The resting state of every term. |
| Recording / listening | **Must** | Must be unmistakable. |
| Processing (STT + judge) | **Must** | Covers the <4s wait. Don't skip this. |
| Result: pass / partial / fail | **Must** | Drives the hint ladder + affirmation. |
| Cancel & re-record before send | **Must** | In the brief (F2). Cheap, high-value. |
| Text fallback turn | **Must** | Accessibility + situational. Non-negotiable. |
| Mic permission primer + OS prompt | **Must** | First-encounter screen (F5). |
| Permission **denied** → route to text | **Must** | The dead-end you can't afford. |
| Skip a term | **Must** | "I don't know" escape (F1). |
| Empty / silent recording (nothing said) | **If time** | Gentle "didn't catch that — try again." |
| Very noisy / garbled transcript | **If time** | Falls back to generous judge or re-record. |
| Judge slow / times out past target | **If time** | Friendly "taking a moment" → retry, not a crash. |
| No / dropped network mid-answer | **If time** | Save progress (F7 already implies this). |
| Mic hardware busy (on a call, etc.) | **Out of scope** | Note as known gap; rare in practice. |
| Student switches language mid-answer | **Out of scope** | Real (multilingual product) but not a v1 sprint problem. |
| Pause/resume into one take | **Out of scope** | Brief already defers this. |

**Rule of thumb for unlisted cases:** the brief already gives you the answer,
*"when in doubt, give the student a way forward."* If you hit an edge case not
in this table, the safe default is always: don't trap them, offer skip or text,
save progress.

---

## How this connects back to the brief

- **F2 (push-to-talk):** Principle 2: already a strong voice-UX decision.
- **F5 (first-encounter intro):** Principle 3: that screen *is* your permission
primer.
- **F9 (text fallback):** Principle 5: frame it as accessibility, not just a
fallback.
- **NFRs (latency <4s, judge reliability):** Principles 6 and 4.
- **"Never trap the student":** the connective tissue across all six.

---

## Sources & evidence quality

- **Nielsen Norman Group: Voice Interaction UX** (primary, design research).
Note: examples are dated (Alexa/Siri, 2016) and about voice *assistants*, but
the heuristics it argues for are durable — that's the article's own point.
[https://www.nngroup.com/articles/voice-interaction-ux/](https://www.nngroup.com/articles/voice-interaction-ux/)
- **Nielsen Norman Group: Mobile Permission Requests** (primary, current).
[https://www.nngroup.com/articles/permission-requests/](https://www.nngroup.com/articles/permission-requests/)
- **Babbel permission-priming teardown** (secondary write-up, but the closest
domain-matched example we have, a learning app priming mic access at the
speaking moment). [https://goodux.appcues.com/blog/babbel-mobile-permission-priming](https://goodux.appcues.com/blog/babbel-mobile-permission-priming)
- **Mobile permission-priming strategies** (secondary, practitioner). Used for
the "design the denied state" guidance.
[https://www.appcues.com/blog/mobile-permission-priming](https://www.appcues.com/blog/mobile-permission-priming)
- **"Show the transcript back"** is a common implementation pattern (vendor STT
docs and prior art), not design-research-backed. Treated here as a transparency
aid, deliberately *not* as a required correction step, to protect the brief's
anti-friction intent.

*Flag: voice-input UX has less rigorous published design research than most GUI
patterns , a lot of "best practice" online is practitioner opinion. Where that's
the case above, it's marked secondary. The two NN/g pieces are the firmest
ground.*