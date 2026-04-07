import type { Challenge } from './types'

// ─── Challenge 1: Haiku Precision ────────────────────────────────────────────
// Beginner - but with trickier distractors

const haiku: Challenge = {
  id: 'haiku-precision',
  title: 'Haiku Precision',
  emoji: '🌊',
  difficulty: 'Beginner',
  conceptLabel: 'Format Control',
  description:
    'The base prompt asks for a poem about the ocean — but mockGPT produces a rambling rhyming verse. You need exactly a haiku: 3 lines, 5-7-5 syllables. Beware: role alone changes style but NOT form.',
  basePrompt: 'Write a poem about the ocean.',
  targetOutput: 'Waves crash on shoreline\nSalt and mist fill the cool air\nSea calls me to drift',
  targetLabel: 'Target: Haiku (5-7-5)',
  minimumCost: 1,
  hint: 'Format or Constraints alone can solve this. Role alone only changes the style, not the form. Examples work but cost more points.',
  availableTechniques: [
    {
      id: 'role-haiku',
      type: 'role',
      label: 'Haiku Poet Role',
      description: 'Assign a haiku expert persona.',
      promptText: 'You are a masterful haiku poet trained in the Japanese tradition.',
      cost: 1,
    },
    {
      id: 'format-haiku',
      type: 'format',
      label: 'Haiku Format',
      description: 'Specify the exact 3-line / 5-7-5 structure.',
      promptText: 'Write as a haiku with exactly three lines: 5 syllables, 7 syllables, 5 syllables.',
      cost: 1,
    },
    {
      id: 'constraints-syllables',
      type: 'constraints',
      label: 'Syllable Constraints',
      description: 'Enumerate hard syllable rules per line.',
      promptText:
        'Requirements:\n- Exactly 3 lines\n- Line 1: 5 syllables\n- Line 2: 7 syllables\n- Line 3: 5 syllables\n- No rhyming',
      cost: 1,
    },
    {
      id: 'examples-haiku',
      type: 'examples',
      label: 'Haiku Examples',
      description: 'Show two example haikus as reference.',
      promptText:
        'Examples of correct haikus:\n"An old silent pond\nA frog jumps into the pond\nSplash! Silence again"\n\n"Over the wintry\nForest, winds howl in rage\nWith no leaves to blow"',
      cost: 2,
    },
    {
      id: 'cot-poem',
      type: 'cot',
      label: 'Think Step by Step',
      description: 'Chain-of-thought reasoning before responding.',
      promptText: 'Think step by step about the poem structure before writing.',
      cost: 2,
    },
  ],
  getOutput(applied) {
    if (
      applied.has('format-haiku') ||
      applied.has('constraints-syllables') ||
      applied.has('examples-haiku')
    ) {
      return 'Waves crash on shoreline\nSalt and mist fill the cool air\nSea calls me to drift'
    }
    if (applied.has('role-haiku')) {
      // Role alone changes style but NOT form — the distractor!
      return "The ocean's mighty roar echoes through time,\nIts waves like whispered verses, pure sublime,\nA poet's soul forever bound to rhyme."
    }
    if (applied.has('cot-poem')) {
      return "Let me think about this step by step.\n\nFirst, I need to consider the ocean as a subject. The ocean is vast, mysterious, powerful. It has waves, tides, marine life. It covers most of Earth's surface.\n\nNow I'll write a poem:\n\nThe mighty ocean stretches far and wide,\nWith crashing waves and currents deep inside,\nA world of wonder that we cannot hide."
    }
    return "The ocean is wide and deep and blue,\nWith crashing waves and salty dew,\nThe seagulls cry and the dolphins play,\nAs the sun sets at the end of the day."
  },
}

// ─── Challenge 2: JSON Strict ────────────────────────────────────────────────
// Beginner - requires combining 2 techniques

const jsonStrict: Challenge = {
  id: 'json-strict',
  title: 'JSON Strict',
  emoji: '📋',
  difficulty: 'Beginner',
  conceptLabel: 'Format + Constraints',
  description:
    'The model must return a specific JSON object for a movie. Format alone gives you JSON but with wrong field names. Constraints alone gives you prose. You need both working together.',
  basePrompt:
    'Tell me about the movie Inception (2010, directed by Christopher Nolan, IMDb rating 8.8).',
  targetOutput: '{"title":"Inception","year":2010,"director":"Christopher Nolan","rating":8.8}',
  targetLabel: 'Target: Strict JSON',
  minimumCost: 2,
  hint: 'Format tells the model HOW to structure the output. Constraints tell it WHAT fields to use. You need both.',
  availableTechniques: [
    {
      id: 'format-json',
      type: 'format',
      label: 'JSON Output Format',
      description: 'Instruct the model to output valid JSON only.',
      promptText: 'Output valid JSON only. No explanation, no markdown, no other text.',
      cost: 1,
    },
    {
      id: 'constraints-keys',
      type: 'constraints',
      label: 'Exact Field Names',
      description: 'Specify exactly which fields and types to use.',
      promptText:
        'Include exactly these fields and types: title (string), year (number), director (string), rating (number). No other fields.',
      cost: 1,
    },
    {
      id: 'role-parser',
      type: 'role',
      label: 'Data Extraction Role',
      description: 'Set a structured-data-extraction persona.',
      promptText:
        'You are a database extraction tool that converts text to structured data.',
      cost: 1,
    },
    {
      id: 'cot-json',
      type: 'cot',
      label: 'Think Step by Step',
      description: 'Chain-of-thought reasoning before responding.',
      promptText: 'Think step by step before responding.',
      cost: 2,
    },
    {
      id: 'examples-json',
      type: 'examples',
      label: 'JSON Example',
      description: 'Show an example of the expected JSON format.',
      promptText:
        'Example output:\n{"title":"The Matrix","year":1999,"director":"The Wachowskis","rating":8.7}',
      cost: 2,
    },
  ],
  getOutput(applied) {
    if (applied.has('cot-json')) {
      return "Let me think through this step by step.\n\nFirst, I need to identify all the information provided: the movie title is Inception, the year is 2010, the director is Christopher Nolan, and the IMDb rating is 8.8.\n\nNext, I should consider what format to use. The question asks me to 'tell you about' the movie, so a natural language response seems appropriate.\n\nInception (2010) is a science fiction thriller directed by Christopher Nolan. It stars Leonardo DiCaprio as a thief who enters people's dreams to steal secrets. The film holds an impressive 8.8 rating on IMDb, making it one of the highest-rated films on the platform."
    }
    if (applied.has('format-json') && applied.has('constraints-keys')) {
      return '{"title":"Inception","year":2010,"director":"Christopher Nolan","rating":8.8}'
    }
    if (applied.has('examples-json') && applied.has('format-json')) {
      return '{"title":"Inception","year":2010,"director":"Christopher Nolan","rating":8.8}'
    }
    if (applied.has('examples-json') && applied.has('constraints-keys')) {
      return '{"title":"Inception","year":2010,"director":"Christopher Nolan","rating":8.8}'
    }
    if (applied.has('format-json') && applied.has('role-parser')) {
      return '{"title":"Inception","releaseYear":2010,"directedBy":"Christopher Nolan","imdbScore":8.8,"genre":"sci-fi thriller"}'
    }
    if (applied.has('format-json')) {
      return '{"title":"Inception","releaseYear":"2010","directedBy":"Christopher Nolan","imdbScore":"8.8/10","genre":"thriller"}'
    }
    if (applied.has('constraints-keys')) {
      return "Movie details:\n- title: Inception\n- year: 2010\n- director: Christopher Nolan\n- rating: 8.8"
    }
    if (applied.has('role-parser')) {
      return "{\n  title: 'Inception',\n  year: 2010,\n  director: 'Christopher Nolan',\n  rating: 8.8\n}"
    }
    if (applied.has('examples-json')) {
      return '{"title":"Inception","year":2010,"director":"Christopher Nolan","rating":8.8}\n\nInception is a mind-bending thriller about dream infiltration.'
    }
    return "Inception is a 2010 science fiction action thriller film written and directed by Christopher Nolan. The film stars Leonardo DiCaprio as a professional thief who steals information by infiltrating the subconscious of his targets. It has an IMDb rating of 8.8 out of 10, making it one of the highest-rated films ever made."
  },
}

// ─── Challenge 3: Voice of Authority ─────────────────────────────────────────
// Intermediate - role is optimal but constraints+format also works (costlier)

const voiceOfAuthority: Challenge = {
  id: 'voice-of-authority',
  title: 'Voice of Authority',
  emoji: '🔬',
  difficulty: 'Intermediate',
  conceptLabel: 'Role Priming',
  description:
    'The base prompt gets a casual, simplified explanation of climate change. You need a precise, peer-review-quality scientific sentence. Which technique shifts the register most efficiently?',
  basePrompt: 'Explain climate change in one sentence.',
  targetOutput:
    "Climate change refers to long-term shifts in global temperatures and weather patterns, primarily driven by anthropogenic greenhouse gas emissions that intensify Earth's natural greenhouse effect, with cascading impacts on ecosystems, sea levels, and human systems.",
  targetLabel: 'Target: Scientific Definition',
  minimumCost: 1,
  hint: 'Role priming is the most direct path — it sets tone, vocabulary, and authority level in one move. But combinations also work at higher cost.',
  availableTechniques: [
    {
      id: 'role-scientist',
      type: 'role',
      label: 'Climate Scientist Role',
      description: 'Assign a peer-reviewed-publishing scientist persona.',
      promptText: 'You are a climate scientist publishing in peer-reviewed journals.',
      cost: 1,
    },
    {
      id: 'constraints-formal',
      type: 'constraints',
      label: 'Formal Language Rules',
      description: 'Ban casual language and analogies.',
      promptText:
        'Use scientific terminology. No analogies, no casual language, no colloquialisms.',
      cost: 1,
    },
    {
      id: 'format-oneline',
      type: 'format',
      label: 'One Sentence Only',
      description: 'Constrain the response to a single sentence.',
      promptText: 'Respond in exactly one sentence.',
      cost: 1,
    },
    {
      id: 'examples-science',
      type: 'examples',
      label: 'Scientific Sentence Example',
      description: 'Provide an example of a formal scientific definition.',
      promptText:
        'Example of the style required:\n"Quantum entanglement is a phenomenon in which two or more particles become correlated such that the quantum state of each particle cannot be described independently of the others, even when separated by large distances."',
      cost: 2,
    },
    {
      id: 'cot-science',
      type: 'cot',
      label: 'Think Step by Step',
      description: 'Chain-of-thought reasoning before responding.',
      promptText: 'Think step by step about the scientific accuracy of your response.',
      cost: 2,
    },
  ],
  getOutput(applied) {
    if (applied.has('role-scientist')) {
      return "Climate change refers to long-term shifts in global temperatures and weather patterns, primarily driven by anthropogenic greenhouse gas emissions that intensify Earth's natural greenhouse effect, with cascading impacts on ecosystems, sea levels, and human systems."
    }
    if (applied.has('constraints-formal') && applied.has('examples-science')) {
      return "Climate change is the long-term alteration of global temperature and precipitation patterns resulting from increased concentrations of greenhouse gases in Earth's atmosphere due to human activities."
    }
    if (applied.has('constraints-formal') && applied.has('format-oneline')) {
      return "Climate change denotes persistent alterations in Earth's atmospheric composition and thermal equilibrium, predominantly attributable to anthropogenic carbon emissions."
    }
    if (applied.has('constraints-formal')) {
      return "Climate change refers to significant and long-lasting changes in global temperatures and weather patterns, mainly resulting from human activities that release greenhouse gases into the atmosphere."
    }
    if (applied.has('examples-science')) {
      return "Climate change is the long-term shift in global temperatures and weather patterns that has accelerated significantly since the industrial revolution due to human greenhouse gas emissions."
    }
    if (applied.has('format-oneline')) {
      return "So basically, climate change is when the Earth keeps getting warmer and weirder because we humans keep pumping CO2 and other gases into the air by burning fossil fuels, driving cars, and doing all sorts of industrial stuff — and it's causing all kinds of problems like melting ice caps and crazy storms."
    }
    if (applied.has('cot-science')) {
      return "Let me think about this scientifically.\n\nClimate change involves: (1) long-term temperature shifts, (2) altered weather patterns, (3) anthropogenic causes, (4) greenhouse gas mechanisms, (5) systemic impacts.\n\nClimate change is when humans burn fossil fuels and release gases that trap heat in the atmosphere, causing the planet to warm up and weather to get more extreme over long periods of time."
    }
    return "So basically, climate change is when the Earth keeps getting warmer and weirder because we humans keep pumping CO2 and other gases into the air by burning fossil fuels, driving cars, and doing all sorts of industrial stuff — and it's causing all kinds of problems like melting ice caps and crazy storms."
  },
}

// ─── Challenge 4: Label It ───────────────────────────────────────────────────
// Intermediate - multiple paths but efficiency matters

const labelIt: Challenge = {
  id: 'label-it',
  title: 'Label It',
  emoji: '🏷️',
  difficulty: 'Intermediate',
  conceptLabel: 'Format Efficiency',
  description:
    'You need a single-word sentiment label for a review. Multiple techniques can solve this — but the lesson is finding the cheapest path. Format alone works, but so do other combinations.',
  basePrompt:
    "What's the sentiment of this review: 'The pacing was uneven but the performances were absolutely stunning.'",
  targetOutput: 'MIXED',
  targetLabel: 'Target: Single-Word Label',
  minimumCost: 1,
  hint: 'Format is 1pt and solves it directly. Examples also work but cost 2pt. Role alone produces a verbose analysis, not a label.',
  availableTechniques: [
    {
      id: 'format-label',
      type: 'format',
      label: 'Single-Word Format',
      description: 'Require exactly one ALL-CAPS word from a fixed list.',
      promptText:
        'Respond with exactly one word in ALL CAPS. Choose from: POSITIVE, NEGATIVE, MIXED, NEUTRAL.',
      cost: 1,
    },
    {
      id: 'examples-sentiment',
      type: 'examples',
      label: 'Classification Examples',
      description: 'Show 3 example sentiment classifications.',
      promptText:
        "Examples:\nReview: 'This film is a masterpiece.' → POSITIVE\nReview: 'Boring and predictable.' → NEGATIVE\nReview: 'Great cast, terrible script.' → MIXED",
      cost: 2,
    },
    {
      id: 'role-analyst',
      type: 'role',
      label: 'Sentiment Analyst Role',
      description: 'Assign a sentiment analysis model persona.',
      promptText: 'You are a sentiment analysis model.',
      cost: 1,
    },
    {
      id: 'constraints-brief',
      type: 'constraints',
      label: 'One Word Maximum',
      description: 'Hard constraint: one word maximum.',
      promptText: 'Be extremely concise. One word maximum.',
      cost: 1,
    },
    {
      id: 'cot-sentiment',
      type: 'cot',
      label: 'Think Step by Step',
      description: 'Chain-of-thought reasoning before responding.',
      promptText: 'Analyze the sentiment step by step before concluding.',
      cost: 2,
    },
  ],
  getOutput(applied) {
    if (applied.has('format-label')) {
      return 'MIXED'
    }
    if (applied.has('examples-sentiment')) {
      return 'MIXED'
    }
    if (applied.has('constraints-brief') && applied.has('role-analyst')) {
      return 'MIXED'
    }
    if (applied.has('constraints-brief') && applied.has('format-label')) {
      return 'MIXED'
    }
    if (applied.has('role-analyst')) {
      return "As a sentiment analysis model, I detect a mixed sentiment in this review. The reviewer acknowledges a weakness (uneven pacing) while expressing strong appreciation for the performances (absolutely stunning). Overall sentiment: Mixed/Ambivalent with positive lean."
    }
    if (applied.has('constraints-brief')) {
      return "Mixed — the review contains both a criticism (uneven pacing) and strong praise (stunning performances), making it difficult to classify as purely positive or negative."
    }
    if (applied.has('cot-sentiment')) {
      return "Let me analyze this step by step.\n\nStep 1: Identify positive elements — 'performances were absolutely stunning' is strongly positive.\nStep 2: Identify negative elements — 'pacing was uneven' is a criticism.\nStep 3: Weigh the overall sentiment — both positive and negative are present.\n\nThe sentiment of this review is mixed, as it contains both positive and negative assessments."
    }
    return "This review expresses a mixed sentiment. On one hand, the reviewer criticises the pacing, describing it as 'uneven', which indicates a negative reaction to that aspect of the film. On the other hand, the reviewer is highly positive about the performances, using the emphatic phrase 'absolutely stunning'. Overall, the sentiment is balanced between praise and criticism, leaning slightly positive due to the strong language used to describe the performances."
  },
}

// ─── Challenge 5: The Trifecta ───────────────────────────────────────────────
// Advanced - requires precise combination

const trifecta: Challenge = {
  id: 'the-trifecta',
  title: 'The Trifecta',
  emoji: '📊',
  difficulty: 'Advanced',
  conceptLabel: 'Technique Combination',
  description:
    'Format a standup update into a precise emoji-annotated template. Multiple techniques are available — but the lesson is that you often need fewer than you think. Find the 2-point solution.',
  basePrompt:
    "Summarize this standup update: 'Completed the auth module. Working on payment integration. Blocked by missing API docs from the finance team.'",
  targetOutput:
    'STANDUP SUMMARY\n✅ Done: Auth module complete\n🔄 In Progress: Payment integration\n🚫 Blocker: Finance team API docs missing',
  targetLabel: 'Target: Standup Template',
  minimumCost: 2,
  hint: 'Role + Format = 2pt and produces the exact output. Adding Constraints is redundant — the template already encodes the emoji rules. COT actually makes it worse!',
  availableTechniques: [
    {
      id: 'role-scrum',
      type: 'role',
      label: 'Scrum Master Role',
      description: 'Assign a scrum master persona focused on clarity.',
      promptText:
        'You are an expert scrum master who formats standup updates for maximum clarity.',
      cost: 1,
    },
    {
      id: 'format-standup',
      type: 'format',
      label: 'Standup Template',
      description: 'Provide the exact 4-line emoji template.',
      promptText:
        'Use this exact template:\nSTANDUP SUMMARY\n✅ Done: [completed items]\n🔄 In Progress: [current work]\n🚫 Blocker: [blockers]',
      cost: 1,
    },
    {
      id: 'constraints-emoji',
      type: 'constraints',
      label: 'Emoji Status Rules',
      description: 'Define which emoji maps to which status.',
      promptText:
        'Use status emojis: ✅ for done, 🔄 for in-progress, 🚫 for blockers. Be ultra concise.',
      cost: 1,
    },
    {
      id: 'cot-standup',
      type: 'cot',
      label: 'Think Step by Step',
      description: 'Chain-of-thought reasoning before responding.',
      promptText: 'Think step by step before responding.',
      cost: 2,
    },
    {
      id: 'examples-standup',
      type: 'examples',
      label: 'Standup Example',
      description: 'Show an example of a formatted standup.',
      promptText:
        'Example:\nSTANDUP SUMMARY\n✅ Done: User authentication\n🔄 In Progress: Database optimization\n🚫 Blocker: Waiting on DevOps for server access',
      cost: 2,
    },
  ],
  getOutput(applied) {
    if (applied.has('cot-standup')) {
      return "Let me break this down step by step.\n\nStep 1: Identify completed work. The engineer mentions 'Completed the auth module' — so the done item is the auth module.\n\nStep 2: Identify in-progress work. They are 'Working on payment integration'.\n\nStep 3: Identify blockers. They are 'Blocked by missing API docs from the finance team'.\n\nStep 4: Now I'll summarize:\n\nCompleted: Auth module\nIn progress: Payment integration\nBlocker: Missing API documentation from finance team\n\nThe team should follow up with the finance team to unblock the payment integration work."
    }
    if (
      (applied.has('role-scrum') && applied.has('format-standup')) ||
      (applied.has('format-standup') && applied.has('constraints-emoji')) ||
      (applied.has('role-scrum') && applied.has('constraints-emoji')) ||
      (applied.has('examples-standup') && applied.has('format-standup'))
    ) {
      return 'STANDUP SUMMARY\n✅ Done: Auth module complete\n🔄 In Progress: Payment integration\n🚫 Blocker: Finance team API docs missing'
    }
    if (applied.has('role-scrum')) {
      return "Team Update:\n• Completed: Auth module ✓\n• In Progress: Payment integration\n• Blocked on: API docs (finance team)\n\nAction needed: Follow up with finance team on API documentation."
    }
    if (applied.has('format-standup')) {
      return 'STANDUP SUMMARY\n✅ Done: Auth module\n🔄 In Progress: Payment integration\n🚫 Blocker: Missing API docs'
    }
    if (applied.has('constraints-emoji')) {
      return '✅ Auth done. 🔄 Working on payments. 🚫 Blocked: no finance API docs.'
    }
    if (applied.has('examples-standup')) {
      return "STANDUP SUMMARY\n✅ Done: User authentication\n🔄 In Progress: Database optimization\n🚫 Blocker: Waiting on DevOps for server access\n\n---\n\nFor your update:\n✅ Done: Auth module\n🔄 In Progress: Payment integration\n🚫 Blocker: Missing API docs from finance team"
    }
    return "Here's a summary of the standup update: The engineer has finished work on the authentication module, which is a positive step forward. They are currently in the middle of building out the payment integration feature. However, their progress is being held up because the finance team has not yet provided the necessary API documentation."
  },
}

// ─── Challenge 6: Code Review Bot ────────────────────────────────────────────
// Advanced - requires role + format + constraints

const codeReviewBot: Challenge = {
  id: 'code-review-bot',
  title: 'Code Review Bot',
  emoji: '🤖',
  difficulty: 'Advanced',
  conceptLabel: 'Multi-Technique Synthesis',
  description:
    'Transform a chatty code review into a structured, actionable format. This requires combining role, format, AND constraints. One technique alone won\'t cut it.',
  basePrompt:
    "Review this code:\n```python\ndef calculate_average(numbers):\n    return sum(numbers) / len(numbers)\n```",
  targetOutput:
    'CODE REVIEW\n\n✅ Strengths:\n- Clear function name\n- Simple implementation\n\n⚠️ Issues:\n- No handling for empty list (division by zero)\n- No type hints\n\n📝 Suggestions:\n- Add: if not numbers: return 0\n- Add type hints: List[float] -> float',
  targetLabel: 'Target: Structured Code Review',
  minimumCost: 3,
  hint: 'You need all three: Role sets the reviewer persona, Format provides the template structure, Constraints ensure the specific sections and emoji usage.',
  availableTechniques: [
    {
      id: 'role-reviewer',
      type: 'role',
      label: 'Senior Dev Role',
      description: 'Assign a senior developer code reviewer persona.',
      promptText: 'You are a senior developer conducting thorough code reviews.',
      cost: 1,
    },
    {
      id: 'format-review',
      type: 'format',
      label: 'Review Template',
      description: 'Provide the exact review structure.',
      promptText:
        'Use this template:\nCODE REVIEW\n\n✅ Strengths:\n- [strengths]\n\n⚠️ Issues:\n- [issues]\n\n📝 Suggestions:\n- [suggestions]',
      cost: 1,
    },
    {
      id: 'constraints-review',
      type: 'constraints',
      label: 'Review Rules',
      description: 'Define what each section must contain.',
      promptText:
        'Strengths: list 2 positive aspects. Issues: list 2 problems. Suggestions: list 2 improvements. Use emojis as section headers.',
      cost: 1,
    },
    {
      id: 'examples-review',
      type: 'examples',
      label: 'Review Example',
      description: 'Show an example code review.',
      promptText:
        'Example:\nCODE REVIEW\n\n✅ Strengths:\n- Good variable naming\n- Efficient algorithm\n\n⚠️ Issues:\n- Missing error handling\n- No input validation\n\n📝 Suggestions:\n- Add try/except block\n- Validate input types',
      cost: 2,
    },
    {
      id: 'cot-review',
      type: 'cot',
      label: 'Think Step by Step',
      description: 'Chain-of-thought reasoning before responding.',
      promptText: 'Analyze the code step by step: first strengths, then issues, then suggestions.',
      cost: 2,
    },
  ],
  getOutput(applied) {
    const hasAllThree =
      applied.has('role-reviewer') &&
      applied.has('format-review') &&
      applied.has('constraints-review')

    if (hasAllThree) {
      return 'CODE REVIEW\n\n✅ Strengths:\n- Clear function name\n- Simple implementation\n\n⚠️ Issues:\n- No handling for empty list (division by zero)\n- No type hints\n\n📝 Suggestions:\n- Add: if not numbers: return 0\n- Add type hints: List[float] -> float'
    }
    if (applied.has('examples-review') && applied.has('format-review')) {
      return 'CODE REVIEW\n\n✅ Strengths:\n- Clear function name\n- Simple implementation\n\n⚠️ Issues:\n- No handling for empty list (division by zero)\n- No type hints\n\n📝 Suggestions:\n- Add: if not numbers: return 0\n- Add type hints: List[float] -> float'
    }
    if (applied.has('role-reviewer') && applied.has('format-review')) {
      return 'CODE REVIEW\n\n✅ Strengths:\n- Clear function name\n- Simple and readable\n\n⚠️ Issues:\n- Division by zero risk\n- Missing type hints\n\n📝 Suggestions:\n- Add empty list check\n- Add type annotations'
    }
    if (applied.has('format-review')) {
      return 'CODE REVIEW\n\n✅ Strengths:\n- Simple code\n- Clear purpose\n\n⚠️ Issues:\n- Edge cases not handled\n- No types\n\n📝 Suggestions:\n- Add error handling\n- Add type hints'
    }
    if (applied.has('role-reviewer')) {
      return "Code Review:\n\nThis is a straightforward average calculation function. The implementation is clean and easy to understand. However, I notice there's no handling for an empty list, which would cause a division by zero error. I'd also recommend adding type hints for better code clarity and IDE support. Consider adding input validation and using Python's statistics module for production code."
    }
    if (applied.has('cot-review')) {
      return "Let me analyze this code step by step.\n\nFirst, let's look at what the code does well: It has a clear, descriptive function name and implements a simple mathematical operation correctly.\n\nNext, potential issues: The function will raise a ZeroDivisionError if passed an empty list. There are also no type hints, which makes the code harder to maintain.\n\nFinally, suggestions: Add a check for empty input and consider adding type annotations for better code quality.\n\nHere's my review:\nThe function is well-named and simple, but needs error handling for empty lists and should include type hints for production use."
    }
    return "This code calculates the average of a list of numbers. It's a simple and clean implementation using Python's built-in sum() and len() functions. The function name is descriptive and the logic is straightforward. However, it doesn't handle the edge case of an empty list, which would cause a division by zero error. Consider adding input validation or a default return value. Also, adding type hints would improve code clarity and help catch type-related bugs early."
  },
}

// ─── Challenge 7: API Documentation ──────────────────────────────────────────
// Advanced - format + constraints with subtle requirements

const apiDocs: Challenge = {
  id: 'api-documentation',
  title: 'API Documentation',
  emoji: '📡',
  difficulty: 'Advanced',
  conceptLabel: 'Precision Constraints',
  description:
    'Generate API documentation in a very specific format. The challenge: format alone gives structure but wrong content style. Constraints alone gives content but wrong structure. Role alone gives verbose docs.',
  basePrompt:
    'Document this API endpoint: GET /users/{id} - Returns user details by ID',
  targetOutput:
    '## GET /users/{id}\n\n**Description:** Retrieves a user by their unique identifier.\n\n**Parameters:**\n| Name | Type | Required | Description |\n|------|------|----------|-------------|\n| id | string | Yes | User\'s unique identifier |\n\n**Response:** `200 OK` - User object with id, name, email fields.',
  targetLabel: 'Target: Markdown API Docs',
  minimumCost: 2,
  hint: 'Format gives the markdown structure. Constraints specify the exact table format and response style. Together they produce the target.',
  availableTechniques: [
    {
      id: 'format-markdown',
      type: 'format',
      label: 'Markdown Format',
      description: 'Use markdown with specific heading and table structure.',
      promptText:
        'Use markdown format with ## heading, **bold** labels, and a parameter table with pipes.',
      cost: 1,
    },
    {
      id: 'constraints-api',
      type: 'constraints',
      label: 'API Doc Rules',
      description: 'Specify exact content requirements.',
      promptText:
        'Include: Description line, Parameters table (Name|Type|Required|Description), Response line with status code format `200 OK`.',
      cost: 1,
    },
    {
      id: 'role-techwriter',
      type: 'role',
      label: 'Tech Writer Role',
      description: 'Assign a technical documentation writer persona.',
      promptText: 'You are a technical writer specializing in API documentation.',
      cost: 1,
    },
    {
      id: 'examples-api',
      type: 'examples',
      label: 'API Doc Example',
      description: 'Show an example API documentation.',
      promptText:
        'Example:\n## POST /users\n\n**Description:** Creates a new user.\n\n**Parameters:**\n| Name | Type | Required | Description |\n|------|------|----------|-------------|\n| name | string | Yes | User\'s full name |\n\n**Response:** `201 Created` - Created user object.',
      cost: 2,
    },
    {
      id: 'cot-api',
      type: 'cot',
      label: 'Think Step by Step',
      description: 'Chain-of-thought reasoning before responding.',
      promptText: 'Think step by step about what sections the documentation needs.',
      cost: 2,
    },
  ],
  getOutput(applied) {
    if (applied.has('format-markdown') && applied.has('constraints-api')) {
      return '## GET /users/{id}\n\n**Description:** Retrieves a user by their unique identifier.\n\n**Parameters:**\n| Name | Type | Required | Description |\n|------|------|----------|-------------|\n| id | string | Yes | User\'s unique identifier |\n\n**Response:** `200 OK` - User object with id, name, email fields.'
    }
    if (applied.has('examples-api') && applied.has('format-markdown')) {
      return '## GET /users/{id}\n\n**Description:** Retrieves a user by their unique identifier.\n\n**Parameters:**\n| Name | Type | Required | Description |\n|------|------|----------|-------------|\n| id | string | Yes | User\'s unique identifier |\n\n**Response:** `200 OK` - User object with id, name, email fields.'
    }
    if (applied.has('format-markdown')) {
      return '## GET /users/{id}\n\n**Description:** This endpoint fetches user information.\n\n**Parameters:**\n| Parameter | Type | Description |\n|-----------|------|-------------|\n| id | string | The user ID |\n\n**Response:** Returns user data in JSON format.'
    }
    if (applied.has('constraints-api')) {
      return "API Documentation:\n\nDescription: Retrieves a user by their unique identifier.\n\nParameters:\nName: id, Type: string, Required: Yes, Description: User's unique identifier\n\nResponse: 200 OK - User object with id, name, email fields."
    }
    if (applied.has('role-techwriter')) {
      return "# API Endpoint Documentation\n\n## Overview\nThis endpoint allows clients to retrieve detailed information about a specific user by providing their unique identifier.\n\n## Endpoint Details\n- **Method:** GET\n- **Path:** /users/{id}\n- **Authentication:** Required\n\n## Parameters\nThe endpoint accepts a path parameter `id` which should be a valid user identifier string.\n\n## Response\nUpon successful execution, the endpoint returns a 200 OK status code along with a JSON object containing the user's information including their id, name, and email address."
    }
    if (applied.has('examples-api')) {
      return "## GET /users/{id}\n\n**Description:** Fetches user details.\n\n**Parameters:**\n| Name | Type | Required | Description |\n|------|------|----------|-------------|\n| id | string | Yes | User ID |\n\n**Response:** `200 OK` - Returns user JSON."
    }
    if (applied.has('cot-api')) {
      return "Let me think about what this API documentation needs.\n\nFirst, I need to identify the HTTP method (GET) and the endpoint path (/users/{id}). Then I should document what it does - it retrieves user details. I need to document the path parameter 'id'. Finally, I should describe the response format.\n\n## GET /users/{id}\n\nThis endpoint retrieves user information by ID. The id parameter is required and should be a string. The response includes user data like name and email."
    }
    return "The GET /users/{id} endpoint is used to fetch information about a specific user. You need to provide the user's ID as a path parameter. The endpoint will return the user's details including their name, email, and other profile information in JSON format. Make sure to handle cases where the user doesn't exist (404 response)."
  },
}

// ─── Export ───────────────────────────────────────────────────────────────────

export const CHALLENGES: Challenge[] = [
  haiku,
  jsonStrict,
  voiceOfAuthority,
  labelIt,
  trifecta,
  codeReviewBot,
  apiDocs,
]