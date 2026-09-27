import Encounter, { encounterStatuses } from '../models/Encounter.js'
import { getRunById, incrementRevivesUsed } from './runService.js'
import { getPokemonById } from './pokemonService.js'
import { getRouteById } from './routeService.js'
import { getNextId } from './apiHandler.js'
import { toUnixTimestamp, unixNow } from './timestamps.js'
import { canEvolveTo } from './evolution.js'
import { generationForGame } from './games.js'
import {
  collectSpeciesWarnings,
  collectStatusWarnings,
  encounterOccupiesRoute,
  evaluateRouteOccupancy,
  isReviveTransition,
  shouldWarnDupesClause,
  teamTypesFromEncounters,
} from './ruleWarnings.js'

const VALID_STATUSES = new Set(Object.values(encounterStatuses))

function httpError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function isSpeciesOptional(status) {
  return status === encounterStatuses.failed || status === encounterStatuses.skipped
}

export { shouldWarnDupesClause }

function toEvolutionHistory(doc) {
  const raw = doc?.evolutionHistory
  if (!Array.isArray(raw)) return []
  return raw.map((entry) => ({
    fromPokemonId: entry.fromPokemonId,
    toPokemonId: entry.toPokemonId,
    evolvedAt: entry.evolvedAt,
    level: entry.level ?? null,
  }))
}

export function toEncounterResponse(doc) {
  if (!doc) return null
  return {
    id: doc.id,
    runId: doc.runId,
    routeId: doc.routeId,
    pokemonId: doc.pokemonId ?? null,
    nickname: doc.nickname ?? '',
    status: doc.status,
    isShiny: Boolean(doc.isShiny),
    isHmHelper: Boolean(doc.isHmHelper),
    level: doc.level ?? null,
    notes: doc.notes ?? '',
    evolutionHistory: toEvolutionHistory(doc),
    caughtAt: doc.caughtAt,
    created: doc.created,
    updated: doc.updated,
    inactive: doc.inactive ?? null,
  }
}

export function validateEncounterInput(data, { partial = false, runRules } = {}) {
  if (!partial || data.routeId !== undefined) {
    if (data.routeId == null || data.routeId === '' || !Number.isFinite(Number(data.routeId))) {
      throw httpError(400, 'routeId is required')
    }
  }

  if (data.status !== undefined && data.status !== null && data.status !== '') {
    if (!VALID_STATUSES.has(Number(data.status))) {
      throw httpError(400, 'Invalid encounter status')
    }
  }

  const status =
    data.status !== undefined && data.status !== null && data.status !== ''
      ? Number(data.status)
      : null

  if (!partial || data.pokemonId !== undefined) {
    const isOptionalSpecies = isSpeciesOptional(status)
    if (!isOptionalSpecies && (data.pokemonId == null || data.pokemonId === '')) {
      if (!partial) throw httpError(400, 'pokemonId is required')
    }
    if (data.pokemonId != null && data.pokemonId !== '') {
      if (!Number.isFinite(Number(data.pokemonId))) {
        throw httpError(400, 'Invalid pokemonId')
      }
    }
  }

  if (data.caughtAt !== undefined && data.caughtAt !== null && data.caughtAt !== '') {
    try {
      toUnixTimestamp(data.caughtAt)
    } catch {
      throw httpError(400, 'Invalid caughtAt')
    }
  }

  if (data.isShiny !== undefined && typeof data.isShiny !== 'boolean') {
    throw httpError(400, 'isShiny must be a boolean')
  }

  if (data.isHmHelper !== undefined && typeof data.isHmHelper !== 'boolean') {
    throw httpError(400, 'isHmHelper must be a boolean')
  }

  if (data.level !== undefined && data.level !== null && data.level !== '') {
    const level = Number(data.level)
    if (!Number.isFinite(level) || level < 1 || level > 100) {
      throw httpError(400, 'level must be between 1 and 100')
    }
  }

  if (runRules?.nicknameRequired) {
    const effectiveStatus = status ?? encounterStatuses.alive
    if (effectiveStatus !== encounterStatuses.failed && effectiveStatus !== encounterStatuses.skipped) {
      if (!partial || data.nickname !== undefined) {
        if (typeof data.nickname !== 'string' || !data.nickname.trim()) {
          throw httpError(400, 'nickname is required by this run’s rules')
        }
      }
    }
  }
}

function assertRouteForGame(routeId, gameId) {
  const route = getRouteById(routeId)
  if (!route) throw httpError(400, 'Route not found')
  if (!route.gameIds?.includes(Number(gameId))) {
    throw httpError(400, 'Route is not valid for this run’s game')
  }
  return route
}

function assertPokemonExists(pokemonId) {
  if (pokemonId == null) return null
  const pokemon = getPokemonById(pokemonId)
  if (!pokemon) throw httpError(400, 'Pokémon not found')
  return pokemon
}

async function assertRunOwned(runId, userId) {
  const run = await getRunById(runId)
  if (!run || run.userId !== userId) {
    throw httpError(404, 'Run not found')
  }
  return run
}

export async function listEncountersForRun(runId, { includeInactive = false } = {}) {
  const query = { runId: Number(runId) }
  if (!includeInactive) query.inactive = null
  const rows = await Encounter.find(query).sort({ caughtAt: 1, id: 1 }).lean()
  return rows.map(toEncounterResponse)
}

export async function getEncounterById(id, { includeInactive = false } = {}) {
  const query = { id: Number(id) }
  if (!includeInactive) query.inactive = null
  const doc = await Encounter.findOne(query)
  return toEncounterResponse(doc)
}

function assertHmHelperAllowed(isHmHelper, runRules) {
  if (isHmHelper && !runRules?.hmHelper) {
    throw httpError(400, 'HM helper is not enabled for this run')
  }
}

async function listActiveEncounters(runId) {
  return Encounter.find({ runId: Number(runId), inactive: null }).lean()
}

function speciesMapFor(encounters) {
  const map = new Map()
  for (const row of encounters) {
    if (row.pokemonId == null) continue
    const species = getPokemonById(row.pokemonId)
    if (species) map.set(species.id, species)
  }
  return map
}

export async function createEncounter(runId, userId, data) {
  const run = await assertRunOwned(runId, userId)
  validateEncounterInput(data, { runRules: run.rules })

  const status = data.status != null ? Number(data.status) : encounterStatuses.alive
  const pokemonId =
    isSpeciesOptional(status) && (data.pokemonId == null || data.pokemonId === '')
      ? null
      : Number(data.pokemonId)
  const isHmHelper = Boolean(data.isHmHelper)
  assertHmHelperAllowed(isHmHelper, run.rules)

  await assertRouteForGame(data.routeId, run.gameId)
  const pokemon = pokemonId != null ? await assertPokemonExists(pokemonId) : null

  const active = await listActiveEncounters(runId)
  const othersOnRoute = active.filter((row) => Number(row.routeId) === Number(data.routeId))
  const otherHelperCount = active.filter((row) => row.isHmHelper).length
  const occupancy = evaluateRouteOccupancy({
    rules: run.rules,
    incoming: { status, isShiny: Boolean(data.isShiny), isHmHelper },
    othersOnRoute,
    otherHelperCount,
  })
  if (occupancy.blocked) {
    throw httpError(409, 'This run already has an encounter for that route')
  }

  const ownedFamilyIds = await collectOwnedFamilyIds(runId)
  const teamTypes = teamTypesFromEncounters(active, speciesMapFor(active))
  const warnings = [
    ...occupancy.warnings,
    ...collectSpeciesWarnings({
      rules: run.rules,
      pokemon,
      isShiny: Boolean(data.isShiny),
      ownedFamilyIds,
      teamTypes,
      gameGeneration: generationForGame(run.gameId),
    }),
  ]

  const now = unixNow()
  const caughtAt = data.caughtAt != null ? toUnixTimestamp(data.caughtAt) : now
  const id = await getNextId(Encounter)

  const doc = await Encounter.create({
    id,
    runId: Number(runId),
    routeId: Number(data.routeId),
    pokemonId,
    nickname: data.nickname?.trim?.() ?? '',
    status,
    isShiny: Boolean(data.isShiny),
    isHmHelper,
    level: data.level != null && data.level !== '' ? Number(data.level) : undefined,
    notes: data.notes ?? '',
    evolutionHistory: [],
    caughtAt,
    created: now,
    updated: now,
    inactive: undefined,
  })

  return { ...toEncounterResponse(doc), warnings: [...new Set(warnings)] }
}

export async function collectOwnedFamilyIds(runId, { excludeEncounterId } = {}) {
  const query = {
    runId: Number(runId),
    inactive: null,
    pokemonId: { $ne: null },
    status: { $in: [encounterStatuses.alive, encounterStatuses.boxed] },
  }
  if (excludeEncounterId != null) query.id = { $ne: Number(excludeEncounterId) }
  const rows = await Encounter.find(query).lean()
  const pokemonIds = [...new Set(rows.map((row) => row.pokemonId).filter(Boolean))]
  if (!pokemonIds.length) return new Set()
  const species = pokemonIds.map((id) => getPokemonById(id)).filter(Boolean)
  return new Set(species.map((row) => row.evolutionFamilyId))
}

export function buildEncounterUpdates(data, { runRules } = {}, now = unixNow()) {
  validateEncounterInput(data, { partial: true, runRules })
  const updates = { updated: now }

  if (data.routeId !== undefined) updates.routeId = Number(data.routeId)
  if (data.pokemonId !== undefined) {
    updates.pokemonId =
      data.pokemonId === null || data.pokemonId === '' ? null : Number(data.pokemonId)
  }
  if (data.nickname !== undefined) updates.nickname = String(data.nickname).trim()
  if (data.status !== undefined) updates.status = Number(data.status)
  if (data.isShiny !== undefined) updates.isShiny = Boolean(data.isShiny)
  if (data.isHmHelper !== undefined) updates.isHmHelper = Boolean(data.isHmHelper)
  if (data.level !== undefined) {
    updates.level = data.level === null || data.level === '' ? null : Number(data.level)
  }
  if (data.notes !== undefined) updates.notes = data.notes
  if (data.caughtAt !== undefined) updates.caughtAt = toUnixTimestamp(data.caughtAt)

  return updates
}

export async function updateEncounter(runId, encounterId, userId, data) {
  const run = await assertRunOwned(runId, userId)
  const existing = await Encounter.findOne({
    id: Number(encounterId),
    runId: Number(runId),
    inactive: null,
  })
  if (!existing) throw httpError(404, 'Encounter not found')

  const mergedStatus = data.status !== undefined ? Number(data.status) : existing.status
  const mergedNickname = data.nickname !== undefined ? data.nickname : existing.nickname
  const mergedPokemonId =
    data.pokemonId !== undefined ? data.pokemonId : existing.pokemonId
  const mergedShiny = data.isShiny !== undefined ? Boolean(data.isShiny) : Boolean(existing.isShiny)
  const mergedHelper =
    data.isHmHelper !== undefined ? Boolean(data.isHmHelper) : Boolean(existing.isHmHelper)
  if (data.isHmHelper !== undefined) assertHmHelperAllowed(mergedHelper, run.rules)

  validateEncounterInput(
    {
      routeId: data.routeId ?? existing.routeId,
      status: mergedStatus,
      nickname: mergedNickname,
      pokemonId: mergedPokemonId,
      isShiny: data.isShiny,
      isHmHelper: data.isHmHelper,
      level: data.level,
      caughtAt: data.caughtAt,
    },
    { runRules: run.rules },
  )

  const active = await listActiveEncounters(runId)
  const routeId = Number(data.routeId ?? existing.routeId)
  if (data.routeId !== undefined) {
    await assertRouteForGame(data.routeId, run.gameId)
  }
  const othersOnRoute = active.filter(
    (row) => row.id !== existing.id && Number(row.routeId) === routeId,
  )
  const otherHelperCount = active.filter((row) => row.id !== existing.id && row.isHmHelper).length
  const occupancy = evaluateRouteOccupancy({
    rules: run.rules,
    incoming: { status: mergedStatus, isShiny: mergedShiny, isHmHelper: mergedHelper },
    othersOnRoute,
    otherHelperCount,
    alreadyOccupies:
      Number(existing.routeId) === routeId && encounterOccupiesRoute(existing, run.rules),
  })
  if (occupancy.blocked) {
    throw httpError(409, 'This run already has an encounter for that route')
  }

  const pokemon =
    mergedPokemonId != null && mergedPokemonId !== '' ? await assertPokemonExists(mergedPokemonId) : null
  const warnings = []
  const occupancyChanged =
    data.routeId !== undefined ||
    data.isShiny !== undefined ||
    data.isHmHelper !== undefined ||
    (data.status !== undefined &&
      encounterOccupiesRoute(
        { status: mergedStatus, isHmHelper: mergedHelper },
        run.rules,
      ) !== encounterOccupiesRoute(existing, run.rules))
  if (occupancyChanged) warnings.push(...occupancy.warnings)

  if (data.pokemonId !== undefined && pokemon && !isSpeciesOptional(mergedStatus)) {
    const teamTypes = teamTypesFromEncounters(active, speciesMapFor(active), {
      ignoreEncounterId: existing.id,
    })
    warnings.push(
      ...collectSpeciesWarnings({
        rules: run.rules,
        pokemon,
        isShiny: mergedShiny,
        ownedFamilyIds: await collectOwnedFamilyIds(runId, { excludeEncounterId: existing.id }),
        teamTypes,
        gameGeneration: generationForGame(run.gameId),
      }),
    )
  }
  if (data.status !== undefined) {
    warnings.push(
      ...collectStatusWarnings({
        rules: run.rules,
        encounter: existing,
        nextStatus: mergedStatus,
        encounters: active,
        revivesUsed: run.revivesUsed ?? 0,
      }),
    )
  }

  let revivesUsed = null
  if (run.rules?.oneRevive && isReviveTransition(existing.status, mergedStatus)) {
    revivesUsed = await incrementRevivesUsed(run.id)
  }

  const updates = buildEncounterUpdates(data, { runRules: run.rules })
  const doc = await Encounter.findOneAndUpdate(
    { id: Number(encounterId), runId: Number(runId), inactive: null },
    updates,
    { new: true, runValidators: true },
  )
  return {
    ...toEncounterResponse(doc),
    warnings: [...new Set(warnings)],
    ...(revivesUsed != null ? { revivesUsed } : {}),
  }
}

export async function inactiveEncounter(runId, encounterId, userId) {
  await assertRunOwned(runId, userId)
  const doc = await Encounter.findOneAndUpdate(
    { id: Number(encounterId), runId: Number(runId), inactive: null },
    { inactive: unixNow(), updated: unixNow() },
    { new: true, runValidators: true },
  )
  if (!doc) throw httpError(404, 'Encounter not found')
  return toEncounterResponse(doc)
}

const EVOLVABLE_STATUSES = new Set([encounterStatuses.alive, encounterStatuses.boxed])

/**
 * Log an evolution for an encounter: append history and update current pokemonId.
 */
export async function evolveEncounter(runId, encounterId, userId, data = {}) {
  const run = await assertRunOwned(runId, userId)
  const existing = await Encounter.findOne({
    id: Number(encounterId),
    runId: Number(runId),
    inactive: null,
  })
  if (!existing) throw httpError(404, 'Encounter not found')

  if (!EVOLVABLE_STATUSES.has(Number(existing.status))) {
    throw httpError(400, 'Only alive or boxed Pokémon can evolve')
  }
  if (existing.pokemonId == null) {
    throw httpError(400, 'Encounter has no Pokémon to evolve')
  }

  const toPokemonId = data.pokemonId
  if (toPokemonId == null || toPokemonId === '' || !Number.isFinite(Number(toPokemonId))) {
    throw httpError(400, 'pokemonId is required')
  }

  let level = null
  if (data.level !== undefined && data.level !== null && data.level !== '') {
    level = Number(data.level)
    if (!Number.isFinite(level) || level < 1 || level > 100) {
      throw httpError(400, 'level must be between 1 and 100')
    }
  }

  const fromPokemonId = Number(existing.pokemonId)
  const targetId = Number(toPokemonId)
  assertPokemonExists(targetId)

  const maxGeneration = generationForGame(run.gameId)
  if (
    !canEvolveTo(fromPokemonId, targetId, {
      randomEvolutions: Boolean(run.rules?.randomEvolutions),
      maxGeneration,
    })
  ) {
    throw httpError(
      400,
      run.rules?.randomEvolutions
        ? 'Invalid evolution target'
        : 'That species is not a valid next evolution for this Pokémon',
    )
  }

  const now = unixNow()
  const entry = {
    fromPokemonId,
    toPokemonId: targetId,
    evolvedAt: now,
    level,
  }

  const setFields = {
    pokemonId: targetId,
    updated: now,
  }
  if (level != null) setFields.level = level

  const doc = await Encounter.findOneAndUpdate(
    { id: Number(encounterId), runId: Number(runId), inactive: null },
    { $set: setFields, $push: { evolutionHistory: entry } },
    { new: true, runValidators: true },
  )
  return toEncounterResponse(doc)
}

/**
 * Undo the most recent evolution: pop history and restore previous pokemonId.
 */
export async function undoEvolveEncounter(runId, encounterId, userId) {
  const run = await assertRunOwned(runId, userId)
  void run
  const existing = await Encounter.findOne({
    id: Number(encounterId),
    runId: Number(runId),
    inactive: null,
  })
  if (!existing) throw httpError(404, 'Encounter not found')

  if (!EVOLVABLE_STATUSES.has(Number(existing.status))) {
    throw httpError(400, 'Only alive or boxed Pokémon can undo an evolution')
  }

  const history = Array.isArray(existing.evolutionHistory) ? existing.evolutionHistory : []
  if (!history.length) {
    throw httpError(400, 'No evolution to undo')
  }

  const last = history[history.length - 1]
  const now = unixNow()
  const doc = await Encounter.findOneAndUpdate(
    { id: Number(encounterId), runId: Number(runId), inactive: null },
    {
      $set: { pokemonId: last.fromPokemonId, updated: now },
      $pop: { evolutionHistory: 1 },
    },
    { new: true, runValidators: true },
  )
  return toEncounterResponse(doc)
}

export { encounterStatuses }
