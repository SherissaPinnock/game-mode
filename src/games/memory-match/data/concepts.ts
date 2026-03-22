/**
 * 12 JavaScript concept pairs.
 * `term`  = the concept name shown on one card
 * `match` = the syntax / answer shown on the paired card
 */
export const concepts = [
  { id: 'array',        term: 'Array',        match: '[ ]'       },
  { id: 'object',       term: 'Object',       match: '{ }'       },
  { id: 'arrow',        term: 'Arrow fn',     match: '=>'        },
  { id: 'strict-eq',   term: 'Strict eq',    match: '==='       },
  { id: 'spread',       term: 'Spread',       match: '...'       },
  { id: 'template',     term: 'Template str', match: '`${}`'     },
  { id: 'ternary',      term: 'Ternary',      match: '? :'       },
  { id: 'nullish',      term: 'Nullish',      match: '??'        },
  { id: 'opt-chain',   term: 'Opt chain',    match: '?.'        },
  { id: 'typeof',       term: 'typeof',       match: '"string"'  },
  { id: 'promise',      term: 'Promise',      match: '.then()'   },
  { id: 'regex',        term: 'Regex',        match: '/ /'       },
] as const
