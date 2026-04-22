import { useMemo, useState } from 'react'
import { playClick } from '@/lib/sounds'
import './EpiloguePhase.css'

interface Props {
  onExit: () => void
}

const LESSONS = [
  {
    room: 'The Kitchen',
    icon: '📜',
    color: 'amber',
    mystery:
      'You sorted scattered fragments of Mrs. Bramble\'s records into categories. ' +
      'Each paper held one idea: a purchase, a note, a gap in the log. ' +
      'You had to decide what each piece was about before you could use it.',
    concept: 'Chunking',
    rag:
      'A RAG system can\'t search a document as a whole. It first breaks source material ' +
      'into chunks, small discrete pieces. A good chunk holds one complete idea: ' +
      'large enough to carry meaning, small enough to retrieve precisely.',
  },
  {
    room: 'The Library',
    icon: '🔐',
    color: 'indigo',
    mystery:
      'You ran three queries against the manor archive. Some results matched the words in ' +
      'your query but not the meaning. The right records answered the question behind the words.',
    concept: 'Retrieval',
    rag:
      'Retrieval finds the chunks most relevant to a query by meaning, not just keywords. ' +
      'The wrong document may share the words. The right one shares the context.',
  },
  {
    room: 'Lady Wren\'s Chambers',
    icon: '🧪',
    color: 'crimson',
    mystery:
      'Your first query returned noise. You diagnosed the problem, rewrote the query to target ' +
      'a specific evening, then sharpened it to test a specific claim.',
    concept: 'Query Rewriting',
    rag:
      'If the first query returns useless results, the problem is usually the query itself. ' +
      'Rewriting changes the framing, scope, or specificity until retrieval can surface what you need.',
  },
  {
    room: 'The Study',
    icon: '⚖',
    color: 'emerald',
    mystery:
      'Six pieces of evidence were all relevant to the case, but only three directly answered ' +
      'what happened and how. You ranked them against the murder sequence.',
    concept: 'Reranking',
    rag:
      'Reranking asks a second question after retrieval: of the relevant results, which one is ' +
      'most useful for this exact task? The order of the stack shapes the answer that follows.',
  },
]

type Slide =
  | {
      kind: 'intro'
      kicker: string
      title: string
      body: string[]
    }
  | {
      kind: 'lesson'
      kicker: string
      title: string
      room: string
      icon: string
      color: string
      mystery: string
      rag: string
    }
  | {
      kind: 'pipeline'
      kicker: string
      title: string
      body: string[]
      steps: string[]
    }
  | {
      kind: 'outro'
      kicker: string
      title: string
      body: string[]
    }

export default function EpiloguePhase({ onExit }: Props) {
  const slides = useMemo<Slide[]>(
    () => [
      {
        kind: 'intro',
        kicker: 'Case Closed',
        title: 'The Manor Had Two Mysteries',
        body: [
          'Lady Wren was taken into custody the following morning. She did not resist.',
          'But there was a second investigation running beneath the first: every room in Blackwood Manor taught one step in a retrieval-augmented workflow.',
          'Click anywhere on the card to turn the page.',
        ],
      },
      ...LESSONS.map((lesson) => ({
        kind: 'lesson' as const,
        kicker: lesson.concept,
        title: lesson.room,
        room: lesson.room,
        icon: lesson.icon,
        color: lesson.color,
        mystery: lesson.mystery,
        rag: lesson.rag,
      })),
      {
        kind: 'pipeline',
        kicker: 'The Method',
        title: 'The Full RAG Pipeline',
        body: [
          'Every time an assistant answers from documents, a flow like this runs underneath.',
          'You played through the most important moving parts inside the manor itself.',
        ],
        steps: [
          'Chunk: break source documents into meaningful units',
          'Retrieve: find the chunks most semantically similar to the query',
          'Rewrite: refine the query if the first results miss the mark',
          'Rerank: reorder the retrieved set by usefulness, not similarity alone',
          'Generate: answer using the best retrieved context',
        ],
      },
      {
        kind: 'outro',
        kicker: 'Final Note',
        title: 'Same Method, Different Century',
        body: [
          'You learned chunking, retrieval, query rewriting, and reranking as a detective in a manor house in 1892.',
          'The setting was fiction. The workflow was not.',
          'One final click and you may leave the manor.',
        ],
      },
    ],
    []
  )

  const [slideIndex, setSlideIndex] = useState(0)
  const slide = slides[slideIndex]
  const atLastSlide = slideIndex === slides.length - 1

  function advance() {
    if (atLastSlide) return
    playClick()
    setSlideIndex((current) => Math.min(current + 1, slides.length - 1))
  }

  function goBack(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    if (slideIndex === 0) return
    playClick()
    setSlideIndex((current) => Math.max(current - 1, 0))
  }

  function exit(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    playClick()
    onExit()
  }

  return (
    <div className="epi-root">
      <div className="epi-shell" onClick={advance} role="button" tabIndex={0}>
        <div className="epi-progress">
          {slides.map((_, index) => (
            <span
              key={index}
              className={`epi-progress-dot ${index === slideIndex ? 'active' : ''} ${index < slideIndex ? 'done' : ''}`}
            />
          ))}
        </div>

        <div className="epi-card">
          <div className="epi-card-top">
            <div className="epi-badge">{slide.kicker}</div>
            <p className="epi-count">
              Slide {slideIndex + 1} of {slides.length}
            </p>
          </div>

          {slide.kind === 'intro' && (
            <div className="epi-panel-content">
              <div className="epi-seal">🏛</div>
              <h1 className="epi-title">{slide.title}</h1>
              <div className="epi-copy">
                {slide.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          )}

          {slide.kind === 'lesson' && (
            <div className={`epi-panel-content epi-panel-content--lesson epi-panel-content--${slide.color}`}>
              <div className="epi-lesson-head">
                <div className="epi-lesson-icon">{slide.icon}</div>
                <div>
                  <h1 className="epi-title">{slide.title}</h1>
                  <p className="epi-room-label">{slide.room}</p>
                </div>
              </div>

              <div className="epi-copy epi-copy--framed">
                <p>{slide.mystery}</p>
              </div>

              <div className="epi-rag-panel">
                <p className="epi-rag-label">What That Means In RAG</p>
                <p className="epi-rag-copy">{slide.rag}</p>
              </div>
            </div>
          )}

          {slide.kind === 'pipeline' && (
            <div className="epi-panel-content">
              <h1 className="epi-title">{slide.title}</h1>
              <div className="epi-copy">
                {slide.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <ol className="epi-steps">
                {slide.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {slide.kind === 'outro' && (
            <div className="epi-panel-content">
              <div className="epi-seal">✦</div>
              <h1 className="epi-title">{slide.title}</h1>
              <div className="epi-copy">
                {slide.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          )}

          <div className="epi-actions">
            <button
              className="epi-btn epi-btn-ghost"
              onClick={goBack}
              disabled={slideIndex === 0}
            >
              Previous
            </button>

            {!atLastSlide ? (
              <button className="epi-btn epi-btn-primary" onClick={(event) => { event.stopPropagation(); advance() }}>
                Next Slide
              </button>
            ) : (
              <button className="epi-btn epi-btn-primary" onClick={exit}>
                Exit the Manor
              </button>
            )}
          </div>

          {!atLastSlide && (
            <p className="epi-hint">Click the card or use the button to continue.</p>
          )}
        </div>
      </div>
    </div>
  )
}
