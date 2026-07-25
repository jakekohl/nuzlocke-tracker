import Run from '../models/Run.js'
import { getNextId } from './apiHandler.js'
import { toUnixTimestamp, unixNow } from './timestamps.js'
import { runStatuses } from '../models/Run.js'

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

export async function getRunById(id) {
  const run = await Run.findOne({ id: Number(id) })
  return toRunResponse(run)
}

export async function createRun(data) {
  const now = unixNow()
  const startDate = toUnixTimestamp(data.startDate)
  const endDate = data.endDate != null ? toUnixTimestamp(data.endDate) : undefined
  const id = await getNextId(Run)
  const run = await Run.create({
    id: id,
    name: data.name,
    startDate: startDate,
    endDate: endDate,
    status: data.status ?? runStatuses.notStarted,
    notes: data.notes ?? '',
    created: now,
    updated: now,
    userId: data.userId,
    gameId: data.gameId,
    inactive: undefined
  })
  return toRunResponse(run)
}

/** Build Mongo updates for a run. Never accepts userId (ownership is immutable). */
export function buildRunUpdates(data, now = unixNow()) {
  const updates = { updated: now }

  if (data.name !== undefined) updates.name = data.name
  if (data.startDate !== undefined) updates.startDate = toUnixTimestamp(data.startDate)
  if (data.endDate !== undefined) updates.endDate = toUnixTimestamp(data.endDate)
  if (data.status !== undefined) updates.status = data.status
  if (data.notes !== undefined) updates.notes = data.notes
  if (data.gameId !== undefined) updates.gameId = data.gameId

  return updates
}

export async function updateRun(id, data) {
  const updates = buildRunUpdates(data)

  const run = await Run.findOneAndUpdate({ id: Number(id) }, updates, {
    new: true,
    runValidators: true,
  })
  return toRunResponse(run)
}

export async function inactiveRun(id) {
  const run = await Run.findOneAndUpdate({ id: Number(id) }, { inactive: unixNow(), updated: unixNow() }, {
    new: true,
      runValidators: true,
    },
  )
  return toRunResponse(run)
}
