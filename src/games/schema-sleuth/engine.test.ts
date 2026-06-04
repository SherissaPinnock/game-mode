import { describe, expect, it } from 'vitest'

import { SCHEMA_SLEUTH_CASES } from '@/games/schema-sleuth/data/cases'
import { evaluateDiagram } from '@/games/schema-sleuth/engine'

describe('schema sleuth engine', () => {
  it('gives full credit for a clean attribute level', () => {
    const caseDefinition = SCHEMA_SLEUTH_CASES.find(item => item.id === 'field-kit')
    expect(caseDefinition).toBeTruthy()
    if (!caseDefinition) return

    const result = evaluateDiagram(caseDefinition, {
      entities: [
        {
          id: 'user',
          x: 0.1,
          y: 0.1,
          attributeIds: ['userId', 'handle', 'email'],
        },
        {
          id: 'profile',
          x: 0.5,
          y: 0.1,
          attributeIds: ['profileId', 'bio', 'avatarUrl'],
        },
      ],
      relationships: [],
    })

    expect(result).toMatchObject({
      score: 100,
      passed: true,
      perfect: true,
      breakdown: {
        entities: { matched: 2, total: 2 },
        attributes: { matched: 6, total: 6 },
        relationships: { matched: 0, total: 0 },
      },
    })
  })

  it('gives full credit for a clean full case', () => {
    const caseDefinition = SCHEMA_SLEUTH_CASES.find(item => item.id === 'coffee-counter')
    expect(caseDefinition).toBeTruthy()
    if (!caseDefinition) return

    const result = evaluateDiagram(caseDefinition, {
      entities: [
        {
          id: 'customer',
          x: 0.08,
          y: 0.12,
          attributeIds: ['customerId', 'fullName', 'email'],
        },
        {
          id: 'order',
          x: 0.4,
          y: 0.12,
          attributeIds: ['orderId', 'placedAt', 'totalCents', 'customerId'],
        },
        {
          id: 'drink',
          x: 0.12,
          y: 0.46,
          attributeIds: ['drinkId', 'name', 'priceCents'],
        },
        {
          id: 'orderItem',
          x: 0.48,
          y: 0.48,
          attributeIds: ['orderItemId', 'quantity', 'orderId', 'drinkId'],
        },
      ],
      relationships: [
        {
          id: 'customer-order',
          from: 'customer',
          to: 'order',
          cardinality: '1:M',
        },
        {
          id: 'order-orderItem',
          from: 'order',
          to: 'orderItem',
          cardinality: '1:M',
        },
        {
          id: 'drink-orderItem',
          from: 'drink',
          to: 'orderItem',
          cardinality: '1:M',
        },
      ],
    })

    expect(result).toMatchObject({
      score: 100,
      passed: true,
      perfect: true,
      breakdown: {
        entities: { matched: 4, total: 4 },
        attributes: { matched: 14, total: 14 },
        relationships: { matched: 3, total: 3 },
      },
    })
  })

  it('accepts either direction for many-to-many links', () => {
    const caseDefinition = SCHEMA_SLEUTH_CASES.find(item => item.id === 'social-pulse')
    expect(caseDefinition).toBeTruthy()
    if (!caseDefinition) return

    const result = evaluateDiagram(caseDefinition, {
      entities: [
        {
          id: 'user',
          x: 0.08,
          y: 0.12,
          attributeIds: ['userId', 'handle', 'email'],
        },
        {
          id: 'post',
          x: 0.4,
          y: 0.12,
          attributeIds: ['postId', 'caption', 'createdAt', 'userId'],
        },
        {
          id: 'comment',
          x: 0.26,
          y: 0.46,
          attributeIds: ['commentId', 'body', 'postId', 'userId'],
        },
        {
          id: 'tag',
          x: 0.62,
          y: 0.44,
          attributeIds: ['tagId', 'label'],
        },
      ],
      relationships: [
        {
          id: 'user-post',
          from: 'user',
          to: 'post',
          cardinality: '1:M',
        },
        {
          id: 'user-comment',
          from: 'user',
          to: 'comment',
          cardinality: '1:M',
        },
        {
          id: 'post-comment',
          from: 'post',
          to: 'comment',
          cardinality: '1:M',
        },
        {
          id: 'tag-post',
          from: 'tag',
          to: 'post',
          cardinality: 'M:M',
        },
      ],
    })

    expect(result).toMatchObject({
      passed: true,
      perfect: true,
      breakdown: {
        relationships: { matched: 4, total: 4 },
      },
    })
  })

  it('catches reverse direction in the cardinality level', () => {
    const caseDefinition = SCHEMA_SLEUTH_CASES.find(item => item.id === 'cardinality-map')
    expect(caseDefinition).toBeTruthy()
    if (!caseDefinition) return

    const result = evaluateDiagram(caseDefinition, {
      entities: [
        {
          id: 'customer',
          x: 0.1,
          y: 0.1,
          attributeIds: [],
        },
        {
          id: 'car',
          x: 0.5,
          y: 0.25,
          attributeIds: [],
        },
      ],
      relationships: [
        {
          id: 'car-customer',
          from: 'car',
          to: 'customer',
          cardinality: '1:M',
        },
      ],
    })

    expect(result.passed).toBe(false)
    expect(result.breakdown.relationships).toEqual({ matched: 0, total: 1 })
    expect(result.feedback).toContain('At least one relationship reads backwards.')
  })

  it('catches wrong cardinality in a full case', () => {
    const caseDefinition = SCHEMA_SLEUTH_CASES.find(item => item.id === 'social-pulse')
    expect(caseDefinition).toBeTruthy()
    if (!caseDefinition) return

    const result = evaluateDiagram(caseDefinition, {
      entities: [
        {
          id: 'user',
          x: 0.08,
          y: 0.1,
          attributeIds: ['userId', 'handle', 'email'],
        },
        {
          id: 'post',
          x: 0.42,
          y: 0.1,
          attributeIds: ['postId', 'caption', 'createdAt', 'userId'],
        },
        {
          id: 'comment',
          x: 0.26,
          y: 0.46,
          attributeIds: ['commentId', 'body', 'postId', 'userId'],
        },
        {
          id: 'tag',
          x: 0.62,
          y: 0.44,
          attributeIds: ['tagId', 'label'],
        },
      ],
      relationships: [
        {
          id: 'user-post',
          from: 'user',
          to: 'post',
          cardinality: '1:M',
        },
        {
          id: 'user-comment',
          from: 'user',
          to: 'comment',
          cardinality: '1:M',
        },
        {
          id: 'post-comment',
          from: 'post',
          to: 'comment',
          cardinality: '1:1',
        },
        {
          id: 'post-tag',
          from: 'post',
          to: 'tag',
          cardinality: 'M:M',
        },
      ],
    })

    expect(result.passed).toBe(false)
    expect(result.breakdown.relationships).toEqual({ matched: 3, total: 4 })
    expect(result.feedback).toContain('At least one relationship uses the wrong cardinality.')
  })

  it('penalizes extra entities in the entity level without erasing progress', () => {
    const caseDefinition = SCHEMA_SLEUTH_CASES.find(item => item.id === 'entity-sweep')
    expect(caseDefinition).toBeTruthy()
    if (!caseDefinition) return

    const result = evaluateDiagram(caseDefinition, {
      entities: [
        {
          id: 'doctor',
          x: 0.1,
          y: 0.1,
          attributeIds: ['doctorId', 'fullName', 'specialty'],
        },
        {
          id: 'patient',
          x: 0.4,
          y: 0.2,
          attributeIds: ['patientId', 'fullName'],
        },
        {
          id: 'appointment',
          x: 0.6,
          y: 0.25,
          attributeIds: ['appointmentId'],
        },
        {
          id: 'room',
          x: 0.76,
          y: 0.22,
          attributeIds: ['roomId'],
        },
      ],
      relationships: [],
    })

    expect(result.score).toBeGreaterThan(20)
    expect(result.score).toBeLessThan(100)
    expect(result.extraEntityIds).toEqual(['room'])
    expect(result.feedback).toContain('The board may be modeling more concepts than this case needs.')
  })
})
