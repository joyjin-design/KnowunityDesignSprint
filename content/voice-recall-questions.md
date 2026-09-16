# Voice recall questions (draft)

Middle school biology, easy to medium. Topic: **Eukaryotic and Prokaryotic Cells**, split across the two nodes already on the exam plan screen in Figma (`13547:1235`): *Organelle Identification* and *Comparing Cell Types*. Each node is one 4-question session. The review node tops up from any question below.

How the judge reads this file, per `SPEC.md`: each question has **3 concepts**. A concept counts if the transcript contains any of its phrases (the preferred term, a synonym, or a likely Safari mis-hearing). **2+ concepts in a sentence → Pass, 1 → Partial, 0 → Fail.** The explanation bolds the concept words so the Why? sheet can highlight the ones the student missed.

The mis-hearings are educated guesses. Replace them with what Safari actually produces during the spike.

Each question also carries sample answers for the end-to-end check in `SPEC.md`.

---

## Node 1: Organelle Identification

### Q1. What does the nucleus do in a cell?

| Concept | Counts if the transcript says |
| --- | --- |
| A. Holds the genetic material | DNA, genetic material, genes, chromosomes, instructions · *mis-heard:* "D and A", "the NA", "NDA" (confirmed on-device, spike 2026-09-16) |
| B. Controls the cell | controls, control center, command center, brain of the cell, tells the cell what to do, directs |
| C. Wrapped in its own membrane | nuclear membrane, nuclear envelope, membrane around it, surrounded by a membrane · *mis-heard:* "new clear membrane", "nuclear envelop" |

**Explanation (Why?):** The nucleus is the cell's **control center**. It holds the cell's **DNA**, the instructions for everything the cell does, and uses them to direct the cell's activities. It's kept separate from the rest of the cell by a **nuclear membrane**.

- **Pass:** "The nucleus is like the control center, it holds the DNA."
- **Partial:** "It's where the DNA is."
- **Fail:** "It's the part that makes energy."
- **List:** "DNA, control, membrane." (at most Partial)

### Q2. What do mitochondria do, and why does a cell need them?

| Concept | Counts if the transcript says |
| --- | --- |
| A. Release energy | energy, power, powerhouse, ATP · *mis-heard:* "power house", "A T P" |
| B. By cellular respiration | respiration, cellular respiration, respire · *mis-heard:* "rest per ation", "cellular aspiration" |
| C. From food and oxygen | glucose, sugar, food, oxygen · *mis-heard:* "glue cose", "glucos" |

**Explanation (Why?):** Mitochondria are where the cell gets its **energy**. They break down **glucose** (sugar from food) using oxygen in a process called **cellular respiration**, and the energy released powers everything else the cell does.

- **Pass:** "They make energy for the cell by breaking down glucose."
- **Partial:** "They're the powerhouse of the cell."
- **Fail:** "They help the cell divide."

### Q3. What does the cell membrane do?

| Concept | Counts if the transcript says |
| --- | --- |
| A. Forms the outer boundary | outside, outer layer, surrounds, around the cell, boundary, edge · *mis-heard:* "sell membrane", "member ain" |
| B. Controls what goes in and out | in and out, enter and leave, lets things in, lets things through, controls what, gatekeeper, selectively permeable, semi-permeable |
| C. Protects the cell | protects, protection, keeps harmful things out, shield |

**Explanation (Why?):** The cell membrane is the thin layer that **surrounds** the cell. It **controls what enters and leaves**: it lets in things the cell needs, like water and nutrients, and keeps out or removes things it doesn't. That also helps **protect** the cell.

- **Pass:** "It goes around the cell and controls what comes in and out."
- **Partial:** "It protects the cell."
- **Fail:** "It's where photosynthesis happens."

### Q4. What do chloroplasts do, and which cells have them?

| Concept | Counts if the transcript says |
| --- | --- |
| A. Carry out photosynthesis | photosynthesis, make food, make sugar, make glucose · *mis-heard:* "photo synthesis", "photosynthesize" |
| B. Using light energy | light, sunlight, sun, light energy, chlorophyll · *mis-heard:* "chloro fill", "clora fill" |
| C. Found in plant cells | plant, plants, plant cells, algae · *mis-heard:* "plant sells" |

**Explanation (Why?):** Chloroplasts are where **photosynthesis** happens. They use a green pigment, chlorophyll, to capture **light energy** from the sun and turn water and carbon dioxide into sugar the cell can use. They're found in **plant cells** and algae, but not in animal cells.

- **Pass:** "They use sunlight to make food, and plants have them."
- **Partial:** "Plant cells have them."
- **Fail:** "They store water."

---

## Node 2: Comparing Cell Types

### Q5. Where is the DNA in a prokaryotic cell, and where is it in a eukaryotic cell?

Reworded 2026-09-14 from "What is the main difference between prokaryotic and eukaryotic cells?". The original leaned on "has / doesn't have a nucleus", and a keyword judge can't tell those apart. Asking *where* the DNA is makes most answers positive statements. It doesn't fully fix it: "the DNA is in the nucleus in prokaryotes" (wrong) still hits concept B.

| Concept | Counts if the transcript says |
| --- | --- |
| A. Prokaryote: loose in the cytoplasm | cytoplasm, floats, floating, loose, free, circular, ring, loop · *mis-heard:* "site oh plasm", "psycho plasm" |
| B. Eukaryote: inside the nucleus | nucleus, in the nucleus · *mis-heard:* "new clear us", "nucleolus" |
| C. Examples of each | bacteria (prokaryote); plant, animal, fungi, human (eukaryote) · *mis-heard:* "back teria", "fun guy" |

**Explanation (Why?):** In a **eukaryotic** cell, like a plant, animal or fungus cell, the DNA is kept inside the **nucleus**. A **prokaryotic** cell, like **bacteria**, has no nucleus, so its DNA, usually a single loop, **floats in the cytoplasm**.

- **Pass:** "In bacteria the DNA just floats in the cytoplasm, but in animal cells it's in the nucleus."
- **Partial:** "In eukaryotic cells it's in the nucleus."
- **Fail:** "It's in the cell wall."

### Q6. Why do plant cells need a cell wall and chloroplasts?

Reworded 2026-09-14 from "Name two structures plant cells have that animal cells don't". The original asked for a list, so the bare-list cap would have marked a correct answer down. This version asks for explanation.

| Concept | Counts if the transcript says |
| --- | --- |
| A. Cell wall gives support | support, strong, stiff, rigid, shape, structure, hold up, stand up · *mis-heard:* "sell wall" |
| B. Chloroplasts make food by photosynthesis | photosynthesis, make food, make sugar, glucose · *mis-heard:* "photo synthesis", "chloro plast" |
| C. Plants can't move or eat, so they use sunlight | sunlight, light, sun, can't move, can't eat, stay in one place |

**Explanation (Why?):** Plants can't move around to find food, so they make their own. **Chloroplasts** use **sunlight** to make sugar through **photosynthesis**. And with no skeleton, plants rely on the stiff **cell wall** around each cell for **support**, which is what lets them stand upright.

- **Pass:** "The cell wall keeps the plant stiff and chloroplasts make its food from sunlight."
- **Partial:** "Chloroplasts do photosynthesis."
- **Fail:** "So they can store water."

### Q7. What do ribosomes do, and where are they found?

| Concept | Counts if the transcript says |
| --- | --- |
| A. Make proteins | protein, proteins, protein synthesis, build proteins · *mis-heard:* "pro teens" |
| B. In all cells | all cells, every cell, both, prokaryotic and eukaryotic, bacteria too |
| C. In the cytoplasm or on the ER | cytoplasm, endoplasmic reticulum, ER, rough ER · *mis-heard:* "site oh plasm", "psycho plasm", "E R" |

**Explanation (Why?):** Ribosomes are where the cell **makes proteins**, following instructions that come from DNA. They're found in **all cells**, prokaryotic and eukaryotic alike, either floating in the **cytoplasm** or attached to the rough endoplasmic reticulum.

- **Pass:** "Ribosomes make proteins and every cell has them."
- **Partial:** "They make proteins."
- **Fail:** "They store the DNA."

### Q8. What is cytoplasm, and what happens there?

| Concept | Counts if the transcript says |
| --- | --- |
| A. Jelly-like fluid | jelly, gel, jelly-like, fluid, liquid, goo · *mis-heard:* "site oh plasm", "psycho plasm" |
| B. Fills the cell and holds the organelles | fills, inside the cell, holds the organelles, surrounds the organelles, organelles float |
| C. Where chemical reactions happen | reactions, chemical reactions, where things happen, moves materials, where the cell's work happens |

**Explanation (Why?):** Cytoplasm is the **jelly-like fluid** that **fills the cell** and surrounds the organelles. Many of the cell's **chemical reactions** happen in it, and it helps move materials around inside the cell.

- **Pass:** "It's the jelly stuff that fills the cell and holds the organelles."
- **Partial:** "It's a liquid inside the cell."
- **Fail:** "It's the outer wall of the cell."

---

## Open (content)

- **Resolved:** Q5 and Q6 reworded (see each question). Negation remains a general limit of the keyword judge on any question.
- **Concept B in Q8** is loosely phrased and may be hard to match against real speech. Check it against spike transcripts.
- **Question order within a node** is written simplest first. Randomising it isn't decided.
