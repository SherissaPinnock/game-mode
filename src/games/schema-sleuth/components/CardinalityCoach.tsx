import { useState } from 'react'

import type { CardinalityExample } from '@/games/schema-sleuth/types'

interface CardinalityCoachProps {
  example: CardinalityExample
}

export function CardinalityCoach({ example }: CardinalityCoachProps) {
  const examples = [example, example.nextExample].filter(Boolean) as CardinalityExample[]
  const [slideIndex, setSlideIndex] = useState(0)
  const activeExample = examples[slideIndex] ?? example
  const [fromSide, toSide] = activeExample.result.split(':')
  const bothSidesRepeat = fromSide === 'M' && toSide === 'M'
  const manyLabel = fromSide === 'M' && toSide === 'M'
    ? `${activeExample.fromLabel} and ${activeExample.toLabel}`
    : fromSide === 'M'
      ? activeExample.fromLabel
      : activeExample.toLabel
  const hasNextSlide = examples.length > 1

  return (
    <div className="ss-cardinality-coach" key={activeExample.result}>
      <div className="ss-cardinality-copy">
        <h4>How do we know which entity gets the crow's feet?</h4>
        <p>The trick is to always read the direction starting with <strong>1</strong> from both sides.</p>
      </div>

      <div className="ss-cardinality-demo" aria-hidden="true">
        <div className="ss-cardinality-read ss-cardinality-read-one">
          <p>{activeExample.fromRule}</p>
          <div className="ss-cardinality-expression">
            <span className="ss-cardinality-entity">{activeExample.fromLabel}</span>
            <strong className="ss-cardinality-token ss-cardinality-token-a">1</strong>
            <span className="ss-cardinality-line" />
            <strong className="ss-cardinality-token ss-cardinality-token-b">{toSide}</strong>
            <span className="ss-cardinality-entity">{activeExample.toLabel}</span>
          </div>
        </div>

        <div className="ss-cardinality-read ss-cardinality-read-two">
          <p>{activeExample.toRule}</p>
          <div className="ss-cardinality-expression">
            <span className="ss-cardinality-entity">{activeExample.fromLabel}</span>
            <strong className="ss-cardinality-token ss-cardinality-token-d">{fromSide}</strong>
            <span className="ss-cardinality-line" />
            <strong className="ss-cardinality-token ss-cardinality-token-c">1</strong>
            <span className="ss-cardinality-entity">{activeExample.toLabel}</span>
          </div>
        </div>
      </div>

      <div className="ss-cardinality-result">
        <p>The side with the many gets the crow's feet.</p>
        <div className="ss-cardinality-final">
          <span>{activeExample.fromLabel}</span>
          <strong className={fromSide === 'M' ? 'is-many' : undefined}>{fromSide}</strong>
          <span className="ss-cardinality-final-line" />
          <strong className={toSide === 'M' ? 'is-many' : undefined}>{toSide}</strong>
          <span>{activeExample.toLabel}</span>
          {fromSide === 'M' && (
            <span className="ss-cardinality-crows-foot is-left">
              <span />
              <span />
              <span />
            </span>
          )}
          {toSide === 'M' && (
            <span className="ss-cardinality-crows-foot is-right">
              <span />
              <span />
              <span />
            </span>
          )}
        </div>
        <small>{manyLabel} {bothSidesRepeat ? 'are' : 'is'} the repeating side.</small>
      </div>

      {hasNextSlide && (
        <button
          type="button"
          className="pal-btn pal-btn-ghost ss-cardinality-next"
          onClick={() => setSlideIndex((slideIndex + 1) % examples.length)}
        >
          {slideIndex === examples.length - 1 ? 'Back to one-to-many' : 'Next slide'}
        </button>
      )}
    </div>
  )
}
