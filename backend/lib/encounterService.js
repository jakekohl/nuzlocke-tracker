import Encounter, { encounterStatuses } from '../models/Encounter.js'
import Pokemon from '../models/Pokemon.js'
import Route from '../models/Route.js'
import { getRunById } from './runService.js'
import { getNextId } from './apiHandler.js'
import { toUnixTimestamp, unixNow } from './timestamps.js'

const VALID_STATUSES = new Set(Object.values(encounterStatuses))

function httpError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
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
    level: doc.level ?? null,
    notes: doc.notes ?? '',
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
    const isFailed = status === encounterStatuses.failed
    if (!isFailed && (data.pokemonId == null || data.pokemonId === '')) {
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

  if (data.level !== undefined && data.level !== null && data.level !== '') {
    const level = Number(data.level)
    if (!Number.isFinite(level) || level < 1 || level > 100) {
      throw httpError(400, 'level must be between 1 and 100')
    }
  }

  if (runRules?.nicknameRequired) {
    const effectiveStatus = status ?? encounterStatuses.alive
    if (effectiveStatus !== encounterStatuses.failed) {
      if (!partial || data.nickname !== undefined) {
        if (typeof data.nickname !== 'string' || !data.nickname.trim()) {
          throw httpError(400, 'nickname is required by this run’s rules')
        }
      }
    }
  }
}

async function assertRouteForGame(routeId, gameId) {
  const route = await Route.findOne({ id: Number(routeId) }).lean()
  if (!route) throw httpError(400, 'Route not found')
  if (!route.gameIds?.includes(Number(gameId))) {
    throw httpError(400, 'Route is not valid for this run’s game')
  }
  return route
}

async function assertPokemonExists(pokemonId) {
  if (pokemonId == null) return null
  const pokemon = await Pokemon.findOne({ id: Number(pokemonId) }).lean()
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

export async function createEncounter(runId, userId, data) {
  const run = await assertRunOwned(runId, userId)
  validateEncounterInput(data, { runRules: run.rules })

  const status = data.status != null ? Number(data.status) : encounterStatuses.alive
  const pokemonId =
    status === encounterStatuses.failed && (data.pokemonId == null || data.pokemonId === '')
      ? null
      : Number(data.pokemonId)

  await assertRouteForGame(data.routeId, run.gameId)
  if (pokemonId != null) await assertPokemonExists(pokemonId)

  if (run.rules?.firstEncounterOnly) {
    const existing = await Encounter.findOne({
      runId: Number(runId),
      routeId: Number(data.routeId),
      inactive: null,
    }).lean()
    if (existing) {
      throw httpError(409, 'This run already has an encounter for that route')
    }
  }

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
    level: data.level != null && data.level !== '' ? Number(data.level) : undefined,
    notes: data.notes ?? '',
    caughtAt,
    created: now,
    updated: now,
    inactive: undefined,
  })

  return toEncounterResponse(doc)
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

  validateEncounterInput(
    {
      routeId: data.routeId ?? existing.routeId,
      status: mergedStatus,
      nickname: mergedNickname,
      pokemonId: mergedPokemonId,
      isShiny: data.isShiny,
      level: data.level,
      caughtAt: data.caughtAt,
    },
    { runRules: run.rules },
  )

  if (data.routeId !== undefined) {
    await assertRouteForGame(data.routeId, run.gameId)
    if (run.rules?.firstEncounterOnly && Number(data.routeId) !== existing.routeId) {
      const conflict = await Encounter.findOne({
        runId: Number(runId),
        routeId: Number(data.routeId),
        inactive: null,
        id: { $ne: existing.id },
      }).lean()
      if (conflict) {
        throw httpError(409, 'This run already has an encounter for that route')
      }
    }
  }

  if (data.pokemonId != null && data.pokemonId !== '') {
    await assertPokemonExists(data.pokemonId)
  }

  const updates = buildEncounterUpdates(data, { runRules: run.rules })
  const doc = await Encounter.findOneAndUpdate(
    { id: Number(encounterId), runId: Number(runId), inactive: null },
    updates,
    { new: true, runValidators: true },
  )
  return toEncounterResponse(doc)
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

export { encounterStatuses }
