# Zach Muhlbauer. Tinkering.

Eight content slides plus the section divider. Source of truth: `index.html` (slides 23 through 31). Updated 2026-04-21 after the ZM3 bricolage cut, the ZM2 rewrite to the Schön/Resnick ladder, and the ZM10 "Cohort 2" removal.

Transitions between slides are framed as three-part spoken bridges. Each ends a slide with a brief gloss of what the slide accomplishes, a contextualization of why that accomplishment matters in the section arc, and a segue that names what the next slide does. Every fragment (`<li class="frag">`, `.zm4-item.frag`, gallery-indexed reveal) is marked as a discrete step, so the presenter can count keypresses through each slide.

---

## 23. Section divider. Tinkering.

**Zach Muhlbauer · 03**

### Tinkering as Critical AI Literacy: Teaching AI Infrastructure through Breakdown and Reconfiguration

*CALI R&D Lead. The Teaching and Learning Center, CUNY Graduate Center.*

No frags on this slide. It is a held title card. Pause on it for one or two beats before advancing.

**Gloss.** The title introduces the section's claim in one sentence: tinkering is a pedagogy with a specific object (infrastructure) and a specific shape (breakdown followed by reconfiguration).

**Why this matters.** The full paper title is the framing contract for the next eight slides. Reading it aloud (or letting the audience read it) sets the expectation that tinkering is going to be treated as a disciplined pedagogical form, not a style or a disposition.

**Move into ZM1.** With the contract named, I want to start from the word itself. Tinkering has a working definition in design studies, and that definition supplies the vocabulary for everything that follows.

---

## 24. ZM1. Tinkering as Critical AI Literacy.

**Zach Muhlbauer · ZM1 · Louridas, 1999**

### Tinkering as Critical AI Literacy

Four-step reveal in a `parallel-points` list. Each step fires on its own keypress.

1. **[frag 1 of 4]** Design proceeds through recombination, not invention from scratch.
2. **[frag 2 of 4]** Ends shift as available materials reveal new constraints and possibilities.
3. **[frag 3 of 4]** Faculty work this way with models, prompts, datasets, and course materials.
4. **[frag 4 of 4]** Tinkering turns those assembled parts into local, course-specific tools.

Right-panel visual: `src/zm1-viz.js` populates the empty `figure-stage`. An animated recombinant-parts figure frames tinkering as assemblage of existing components.

**Gloss.** The four bullets define tinkering in the sense this talk uses the word. The definition is Louridas's: design is recombination of available materials, and ends emerge from what those materials afford.

**Why this matters.** The definition closes the section off from two common framings of AI work. It rules out the image of the heroic inventor and it rules out the image of the passive user. It names a third thing, a faculty member working on models, prompts, datasets, and course materials as an integrated project. Everything downstream in the talk (the pilots, the breakdowns, the sandbox) depends on this definition holding.

**Move into ZM2.** Once recombination is on the table, the question is what recombination looks like inside teaching. Schön and Resnick supply an eight-rung ladder of pedagogical moves.

---

## 25. ZM2. Tinkering in Pedagogy.

**Zach Muhlbauer · ZM2**

### Tinkering in Pedagogy

Eight-step reveal in a `ladder-list`. Each rung carries its own numeral, label, and body, and fires on its own keypress.

1. **[frag 1 of 8] 01 Raising questions.** Each iteration opens with a fresh probe.
2. **[frag 2 of 8] 02 Reflection.** Reflection-in-action at small scale (Schön).
3. **[frag 3 of 8] 03 Hands-on knowing.** Tacit knowledge gained only by doing and failing.
4. **[frag 4 of 8] 04 Undirected exploration.** Bottom-up play converges into focus (Resnick).
5. **[frag 5 of 8] 05 Problem framing.** Constructing the problem from puzzling materials.
6. **[frag 6 of 8] 06 Personal toolbox.** Expanding building blocks through playful use.
7. **[frag 7 of 8] 07 New applications.** Matching tech first to uses "new for the student."
8. **[frag 8 of 8] 08 Design decisions.** Small-scale choices train judgment under incomplete knowledge.

Right-panel visual: reserved `diagram-stage` (aria-hidden, currently empty). The ladder carries the slide.

**Gloss.** The ladder operationalizes the definition from ZM1. Each rung names a pedagogical capacity that a tinkering practice cultivates: questioning, reflecting, framing, deciding.

**Why this matters.** This slide positions tinkering with AI inside a familiar pedagogical lineage. The argument to the audience is that critical AI literacy is continuous with Dewey, Schön, and Resnick. Faculty who already teach through inquiry, through reflection, or through iterative design are already tinkerers. The ladder gives the room a shared vocabulary to name what the pilots are doing.

**Move into ZM3.** With the ladder visible, the next step is to show how CALI threads those eight moves into a single design pipeline across courses and campuses.

---

## 26. ZM3. Infrastructure and Instructional Design.

**Zach Muhlbauer · ZM3**

### Infrastructure and Instructional Design

Four-step reveal on the right stage (`zm4-list`, fills the figure area). Each item carries its own numeral and fires on its own keypress.

1. **[frag 1 of 4] 1 Identify.** Pedagogical challenges faculty face in their classes.
2. **[frag 2 of 4] 2 Translate.** Disciplinary methods into technical control over AI tools.
3. **[frag 3 of 4] 3 Prototype.** Domain-specific AI tools for classroom application.
4. **[frag 4 of 4] Pilots.** Spanish (Hunter, Baruch). English, History, First-Year Writing (CCNY).

Visual: the numbered list occupies the full right stage. No additional figure.

**Gloss.** The identify-translate-prototype pipeline is the path every CALI cohort walks. The fourth frag grounds it by listing the five pilot courses across three campuses where the pipeline is running.

**Why this matters.** This slide is the hinge from conceptual framing to program. Everything up to this point has been a definition of tinkering. Everything after it is evidence drawn from live classrooms. Naming the pilots lets the audience treat the later case material (AmigAI, the prompt signatures, the sandbox) as reports from running courses, not as hypotheticals.

**Move into ZM4.** The prototype stage is where faculty encounter the model as a working system. That encounter is the point at which infrastructure stops being invisible, and the next slide gives the encounter its theoretical name.

---

## 27. ZM4. Teaching Infrastructure through Breakdown.

**Zach Muhlbauer · ZM4 · Star**

### Teaching Infrastructure through Breakdown

Three-step reveal in a `parallel-points` list, paired with a continuous canvas animation.

1. **[frag 1 of 3]** Where does the AI model end and the user interface begin?
2. **[frag 2 of 3]** Consumer chat platforms obfuscate the difference (and its contingency).
3. **[frag 3 of 3]** Susan Leigh Star: infrastructure becomes visible on breakdown.

Right-panel visual: live canvas, `src/zm5-viz.js` rendering into `#zm5-canvas`. Prompt-and-response bubbles flow through a network of interface nodes, visualizing the seam between model and harness. The animation loops for the full duration of the slide, independent of frag progression.

**Gloss.** The opening question is a reframing question. It asks the audience to locate the edge between the model they are using and the interface they are using it through. Star's theorem supplies the answer: that edge only shows itself when the system breaks.

**Why this matters.** This slide is the section's theoretical pivot. Most faculty and students meet generative AI through a single chat box that smooths over every decision a vendor has made about context windows, system prompts, model routing, and safety filtering. The pedagogical move Star gives us is to treat breakdown as the condition of visibility and to design encounters where the hidden system shows itself. The rest of the talk is an answer to the question "what does such an encounter look like."

**Move into ZM5.** Breakdown stays theoretical until a specific knob stages it. The nearest knob is temperature, and temperature behaves in ways that make the model's probabilistic character legible to a classroom.

---

## 28. ZM5. Hyperparameters as Instructional Controls.

**Zach Muhlbauer · ZM5**

### Hyperparameters as Instructional Controls

Four-step reveal in a `parallel-points` list.

1. **[frag 1 of 4] Temperature.** Shapes the probability distribution of an output.
2. **[frag 2 of 4] Low.** Steady, predictable.
3. **[frag 3 of 4] High.** Loose, surprising.
4. **[frag 4 of 4] At 2.0.** Coherence breaks.

Right-panel visual: reserved stage. `src/zm6-viz.js` is loaded for a live temperature-curve overlay if toggled on during rehearsal.

**Gloss.** Temperature is the first control surface most faculty ever touch. The four frags walk the parameter from steady to loose to catastrophic, finishing at the point where the model produces token salad, dialect bleed, and pretraining-corpus shards.

**Why this matters.** This is the slide where Star's abstract claim becomes a classroom exercise. Coherence loss at temperature 2.0 is breakdown in its most vivid form, and it takes a single keypress to produce. Showing the audience that one slider can stage an infrastructure reveal gives them a concrete starting point they can take home to their own courses.

**Move into ZM6.** Temperature shows the model from the outside. Moving inside the model requires a specific tool in a specific class. AmigAI is the case the project has carried furthest, and the breakdowns it produces say something specific about what gets flattened in Spanish.

---

## 29. ZM6. AmigAI. Toward Breakdown and Remediation.

**Zach Muhlbauer · ZM6**

### AmigAI: Toward Breakdown and Remediation

Five-step reveal in a `parallel-points` list, paired with a static screenshot.

1. **[frag 1 of 5]** Conversational language-learning tool running on Gemma-3-27b.
2. **[frag 2 of 5]** Piloted in heritage and non-native Spanish classes at Hunter and Baruch.
3. **[frag 3 of 5]** Flattens regional dialects into a dominant Spanish register.
4. **[frag 4 of 5]** Reveals the absence of low-resource languages in pretraining data.
5. **[frag 5 of 5]** Underscores the value of fine-tuning AI on low-resource languages.

Right-panel visual: `images/amigai.png`. AmigAI-Template chat in Open WebUI. The model introduces itself as Ana and offers to discuss migration, health, or gentrification in New York.

**Gloss.** AmigAI is the project's most developed case. Students working with the tool reported that the model normalized the Spanish of a handful of dominant media markets at the expense of the dialects they grew up with.

**Why this matters.** This slide is the evidence slide for the breakdown frame. Dialect flattening is not a misconfiguration, it is the distribution of Gemma's pretraining data made audible through classroom use. Naming that distribution in class lets students and faculty see the remedy as a research agenda. Fine-tuning on low-resource Spanish corpora becomes a concrete next step that the CALI cohort can take together, with a named technical path.

**Move into ZM7.** A single tool in two classes is a case. The larger picture is how different campuses have tinkered with prompts, parameters, and model choices across the full pilot, and that variation is itself data about how faculty make AI fit their courses.

---

## 30. ZM7. Tinkering with System Prompts.

**Zach Muhlbauer · ZM7**

### Tinkering with System Prompts

Four-step reveal on the left, grouped bar chart on the right. The chart renders with the slide. Each bullet fires on its own keypress.

1. **[frag 1 of 4]** Revisions tracked across participating campuses.
2. **[frag 2 of 4]** Settings shift with pedagogical goals.
3. **[frag 3 of 4]** Faculty test, compare, revise, repeat.
4. **[frag 4 of 4]** AI model configuration as instructional design.

Right-panel visual and caption: `#zm8-chart`, rendered by `src/zm8-chart.js` through `vendor/frappe-charts`. The caption reads the three institutional signatures off the chart.

- **Baruch (SPAN 105).** Prompt rewrites as lesson plans, each one anchored to a single assignment.
- **Hunter (Español).** Prompt and parameters tuned together. Temperature moves from 0.7 to 0. The prompt becomes a companion to a scripted role.
- **Brooklyn.** Six Hugging Face Spaces in parallel, one persona per assignment. Temperature ranges from 0 to 2. Five models are tested within a single Space.

**Gloss.** The chart is the comparative evidence that the four bullets stand on. Three campuses produced three different tinkering signatures across the pilot cycle.

**Why this matters.** This slide answers the "so what" question for the whole section. Tinkering is the right word for what happened at CALI because the pilot data show different campuses developing different craft signatures around the same general-purpose tool. The Baruch signature is curricular (prompts as lesson plans). The Hunter signature is voice-tuning (prompt and parameters co-adjusted). The Brooklyn signature is persona proliferation (many Spaces, many models). Prompt design reads as a discipline-specific craft once the signatures are side by side.

**Move into ZM8.** All of this testing and comparison happened somewhere. The sandbox is the shared environment that made the signatures comparable across campuses, and it is the deliverable the team is leaving the room with.

---

## 31. ZM8. The CUNY AI Lab Sandbox.

**Zach Muhlbauer · ZM8**

### The CUNY AI Lab Sandbox

Five-step reveal on the left. Three-panel carousel on the right (`sandbox-gallery` with `data-frag-sync="1"`). Frags 4 and 5 carry `data-gallery-idx` attributes that advance the carousel as they fire.

1. **[frag 1 of 5]** Self-hosted instance of Open WebUI.
2. **[frag 2 of 5]** Open-weight language models from small to large in a single interface.
3. **[frag 3 of 5]** Only model providers with zero data retention and training turned off.
4. **[frag 4 of 5, `data-gallery-idx="1"`] Carousel advances to panel 2.** Compare models side by side, write system prompts, adjust parameters, export transcripts.
5. **[frag 5 of 5, `data-gallery-idx="2"`] Carousel advances to panel 3.** Model cards with preset system prompt tied to knowledge base, agentic skills, tool calling.

Carousel panels, in reveal order:

- **Panel 1 (active on slide entry).** `images/oi-anatomy.png`. Interface anatomy callouts on AmigAI-Template: (1) new chat, (2) model selector, (3) model card info, (4) prompt input.
- **Panel 2 (revealed by frag 4).** `images/oi-anatomy-2.png`. Side-by-side comparison of AmigAI-Template and Google Gemma 3 27B base, same Spanish greeting prompt.
- **Panel 3 (revealed by frag 5).** `images/oi-anatomy-3.png`. Cohort model cards: AmigAI, Shakespeare 226, Span Film, HIST 24000, Toulmin, and more. Each card is a scaffold tuned to a course or skill.

**Gloss.** The sandbox is the infrastructural correlate of the tinkering pedagogy. Every move named in ZM1 through ZM7 (recombination, reflection, breakdown, parameter tuning, prompt rewriting, comparison) is made possible by the sandbox holding them in one environment.

**Why this matters.** Three pieces of the sandbox carry the pedagogical weight of the section. The zero-retention guarantee is what lets faculty show students the breakdowns without feeding student work to a vendor training loop. The side-by-side compare is what lets faculty treat model selection as a curricular decision, not a default. The model cards are what turn each pilot's prompt-as-instructional-design work into a shareable object the next cohort can inherit and revise. Together these three pieces make the sandbox into an institutional commitment CUNY is staking about how critical AI literacy will be taught across the system.

**Handoff to Şule.** That closes the tinkering arc: definition (ZM1), pedagogy (ZM2), pipeline (ZM3), breakdown (ZM4), knob (ZM5), case (ZM6), comparison (ZM7), sandbox (ZM8). Şule now picks up the question of what this work is up against. Her talk examines the rhetoric of AI inevitability and what that rhetoric does to science education.
