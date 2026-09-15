# Component gaps

Things built inline during a screen build because Storybook had no component for them. When the same thing is needed on a second screen, it gets built as a real component instead, and both lines are marked `→ promoted to <Name>`. Items `SPEC.md` says to build inline stay inline.

- Knowie's speech bubble holding the question (surface fill, left-pointing tail), plus the flat shadow under the mascot — for 1 Verdict sheet — inline in app/screens/VerdictScreen.tsx. `SPEC.md` screen 10 says to build the bubble inline, not as a component, so it isn't promoted when the loop screen needs it.
- Static XP chip "⚡2" (Phosphor Lightning and a label in `accent/blue/onSubtle`, no fill) — for 1 Verdict sheet — inline in app/screens/VerdictScreen.tsx. `Chip`'s colours (Primary, pro) don't cover it, and Figma draws it as a plain frame; whether it should be `Chip` is `SPEC.md` Open #8.
