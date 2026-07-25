import Run, { gameIds, runStatuses } from '../models/Run.js'
import { getNextId } from './apiHandler.js'
import { toUnixTimestamp, unixNow } from './timestamps.js'

const VALID_STATUSES = new Set(Object.values(runStatuses))
const VALID_GAME_IDS = new Set(Object.values(gameIds))

function httpError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

export function toRunResponse(doc) {
  if (!doc) return null
  return {
    id: doc.id,
    name: doc.name,
    startDate: doc.startDate,
    endDate: doc.endDate ?? null,
    status: doc.status,
    notes: doc.notes ?? '',
    created: doc.created,
    updated: doc.updated,
    userId: doc.userId,
    gameId: doc.gameId,
    inactive: doc.inactive ?? null,
  }
}

export function validateRunInput(data, { partial = false } = {}) {
  if (!partial || data.name !== undefined) {
    if (typeof data.name !== 'string' || !data.name.trim()) {
      throw httpError(400, 'Name is required')
    }
  }

  if (!partial || data.startDate !== undefined) {
    if (data.startDate == null || data.startDate === '') {
      throw httpError(400, 'startDate is required')
    }
    try {
      toUnixTimestamp(data.startDate)
    } catch {
      throw httpError(400, 'Invalid startDate')
    }
  }

  if (data.endDate !== undefined && data.endDate !== null) {
    try {
      toUnixTimestamp(data.endDate)
    } catch {
      throw httpError(400, 'Invalid endDate')
    }
  }

  if (!partial || data.gameId !== undefined) {
    if (!VALID_GAME_IDS.has(Number(data.gameId))) {
      throw httpError(400, 'Invalid gameId')
    }
  }

  if (data.status !== undefined && data.status !== null && data.status !== '') {
    if (!VALID_STATUSES.has(Number(data.status))) {
      throw httpError(400, 'Invalid status')
    }
  }

  if (!partial && data.userId == null) {
    throw httpError(400, 'userId is required')
  }
}

export async function getRunById(id, { includeInactive = false } = {}) {
  const query = { id: Number(id) }
  if (!includeInactive) {
    query.inactive = null
  }
  const run = await Run.findOne(query)
  return toRunResponse(run)
}

export async function createRun(data) {
  validateRunInput(data)

  const now = unixNow()
  const startDate = toUnixTimestamp(data.startDate)
  const endDate = data.endDate != null ? toUnixTimestamp(data.endDate) : undefined
  const id = await getNextId(Run)
  const run = await Run.create({
    id: id,
    name: data.name.trim(),
    startDate: startDate,
    endDate: endDate,
    status: data.status ?? runStatuses.notStarted,
    notes: data.notes ?? '',
    created: now,
    updated: now,
    userId: data.userId,
    gameId: Number(data.gameId),
    inactive: undefined
  })
  return toRunResponse(run)
}

/** Build Mongo updates for a run. Never accepts userId (ownership is immutable). */
export function buildRunUpdates(data, now = unixNow()) {
  validateRunInput(data, { partial: true })

  const updates = { updated: now }

  if (data.name !== undefined) updates.name = data.name.trim()
  if (data.startDate !== undefined) updates.startDate = toUnixTimestamp(data.startDate)
  if (data.endDate !== undefined) updates.endDate = toUnixTimestamp(data.endDate)
  if (data.status !== undefined) updates.status = Number(data.status)
  if (data.notes !== undefined) updates.notes = data.notes
  if (data.gameId !== undefined) updates.gameId = Number(data.gameId)

  return updates
}

export async function updateRun(id, data) {
  const updates = buildRunUpdates(data)

  const run = await Run.findOneAndUpdate({ id: Number(id), inactive: null }, updates, {
    new: true,
    runValidators: true,
  })
  return toRunResponse(run)
}

export async function inactiveRun(id) {
  const run = await Run.findOneAndUpdate(
    { id: Number(id), inactive: null },
    { inactive: unixNow(), updated: unixNow() },
    {
      new: true,
      runValidators: true,
    },
  )
  return toRunResponse(run)
}
