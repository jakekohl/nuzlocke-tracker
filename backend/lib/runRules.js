/**
 * Configurable Nuzlocke rules stored on each run.
 * Core rules default on; optional clauses default to community-common values.
 *
 * Sources: Bulbapedia Nuzlocke Challenge, Nuzlocke University, Smogon intro.
 */

export const RULE_KEYS = {
  // Core (nearly always on)
  firstEncounterOnly: 'firstEncounterOnly',
  permadeath: 'permadeath',
  nicknameRequired: 'nicknameRequired',

  // Near-universal / common optional
  dupesClause: 'dupesClause',
  shinyClause: 'shinyClause',
  setMode: 'setMode',
  levelCap: 'levelCap',
  blackoutIsFailure: 'blackoutIsFailure',
  giftPokemonAreEncounters: 'giftPokemonAreEncounters',
  noOutsideTrading: 'noOutsideTrading',

  // Difficulty / item restrictions
  noItemsInBattle: 'noItemsInBattle',
  noHeldItems: 'noHeldItems',
  noHealingItems: 'noHealingItems',
  noMasterBall: 'noMasterBall',
  noRareCandy: 'noRareCandy',

  // Softeners / helpers
  shinyImmuneToPermadeath: 'shinyImmuneToPermadeath',
  hmHelper: 'hmHelper',
  safariZonePerSection: 'safariZonePerSection',
  allowTradeEvolutions: 'allowTradeEvolutions',
  slowStart: 'slowStart',
}

/** Human-readable catalog for clients (create-run UI, docs). */
export const RULE_DEFINITIONS = [
  {
    key: RULE_KEYS.firstEncounterOnly,
    label: 'First encounter only',
    description:
      'Only the first wild Pokémon in each area may be caught. If it faints or flees, the area is lost.',
    category: 'core',
    default: true,
  },
  {
    key: RULE_KEYS.permadeath,
    label: 'Permadeath',
    description: 'Any Pokémon that faints is dead and must be released or permanently boxed.',
    category: 'core',
    default: true,
  },
  {
    key: RULE_KEYS.nicknameRequired,
    label: 'Nicknames required',
    description: 'Every caught or obtained Pokémon must be nicknamed.',
    category: 'core',
    default: true,
  },
  {
    key: RULE_KEYS.dupesClause,
    label: 'Dupes / species clause',
    description:
      'Skip encounters that are a species (or evolution line) you already own until a new line appears.',
    category: 'optional',
    default: true,
  },
  {
    key: RULE_KEYS.shinyClause,
    label: 'Shiny clause',
    description: 'Shinies may be caught even if they are not the first encounter in an area.',
    category: 'optional',
    default: true,
  },
  {
    key: RULE_KEYS.setMode,
    label: 'Set mode',
    description: 'Battle style must be Set (no free switch when an opponent’s Pokémon faints).',
    category: 'optional',
    default: false,
  },
  {
    key: RULE_KEYS.levelCap,
    label: 'Level cap',
    description:
      'Party Pokémon may not exceed the next gym / major boss ace level until that fight is cleared.',
    category: 'optional',
    default: false,
  },
  {
    key: RULE_KEYS.blackoutIsFailure,
    label: 'Blackout = run over',
    description:
      'A full party wipe / blackout fails the run even if living Pokémon remain in the PC.',
    category: 'optional',
    default: true,
  },
  {
    key: RULE_KEYS.giftPokemonAreEncounters,
    label: 'Gifts count as encounters',
    description:
      'Gift and static Pokémon (starter, Lapras, fossils, etc.) each count as that area’s encounter.',
    category: 'optional',
    default: true,
  },
  {
    key: RULE_KEYS.noOutsideTrading,
    label: 'No outside trading',
    description: 'Only in-game obtains; no trades from other saves or Mystery Gift.',
    category: 'optional',
    default: true,
  },
  {
    key: RULE_KEYS.noItemsInBattle,
    label: 'No items in battle',
    description: 'Bag / status items (and typically X-items) may not be used during battles.',
    category: 'hardcore',
    default: false,
  },
  {
    key: RULE_KEYS.noHeldItems,
    label: 'No held items',
    description: 'Held items may not be used.',
    category: 'hardcore',
    default: false,
  },
  {
    key: RULE_KEYS.noHealingItems,
    label: 'No healing items',
    description: 'Potions and status heals may not be used (Pokémon Centers still allowed).',
    category: 'hardcore',
    default: false,
  },
  {
    key: RULE_KEYS.noMasterBall,
    label: 'No Master Ball',
    description: 'The Master Ball may not be used.',
    category: 'hardcore',
    default: false,
  },
  {
    key: RULE_KEYS.noRareCandy,
    label: 'No Rare Candy',
    description: 'Rare Candies may not be used for leveling.',
    category: 'hardcore',
    default: false,
  },
  {
    key: RULE_KEYS.shinyImmuneToPermadeath,
    label: 'Shinies ignore permadeath',
    description: 'Caught shinies need not be released if they faint (often paired with shiny clause).',
    category: 'softener',
    default: false,
  },
  {
    key: RULE_KEYS.hmHelper,
    label: 'HM helper',
    description:
      'An extra catch is allowed solely for required field moves; it cannot battle and is released when no longer needed.',
    category: 'softener',
    default: false,
  },
  {
    key: RULE_KEYS.safariZonePerSection,
    label: 'Safari Zone per section',
    description: 'Each Safari Zone section is its own encounter area instead of one zone-wide encounter.',
    category: 'softener',
    default: true,
  },
  {
    key: RULE_KEYS.allowTradeEvolutions,
    label: 'Allow trade evolutions',
    description: 'Trading away and back solely to evolve (Kadabra, Machoke, etc.) is allowed.',
    category: 'softener',
    default: true,
  },
  {
    key: RULE_KEYS.slowStart,
    label: 'Slow start',
    description:
      'Core encounter/death rules do not apply until the player can catch Pokémon (and often until after the first rival fight).',
    category: 'softener',
    default: false,
  },
]

export function defaultRunRules() {
  return Object.fromEntries(RULE_DEFINITIONS.map((rule) => [rule.key, rule.default]))
}

function httpError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

const VALID_KEYS = new Set(RULE_DEFINITIONS.map((rule) => rule.key))

/**
 * Merge partial user rules onto defaults. Unknown keys rejected; non-booleans rejected.
 */
export function normalizeRunRules(input, { partial = false } = {}) {
  const base = partial ? {} : defaultRunRules()
  if (input == null) {
    if (partial) return base
    return defaultRunRules()
  }
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw httpError(400, 'rules must be an object')
  }

  const result = { ...base }
  for (const [key, value] of Object.entries(input)) {
    if (!VALID_KEYS.has(key)) {
      throw httpError(400, `Unknown rule: ${key}`)
    }
    if (typeof value !== 'boolean') {
      throw httpError(400, `Rule ${key} must be a boolean`)
    }
    result[key] = value
  }
  return result
}

export function getRulesCatalog() {
  return RULE_DEFINITIONS.map((rule) => ({ ...rule }))
}
