import User from '../models/User.js'
import { getNextId } from './apiHandler.js'
import { apiKeyPrefix, generateApiKey, hashApiKey } from './apiKeyCrypto.js'
import { unixNow } from './timestamps.js'

export function toUserResponse(doc) {
  if (!doc) return null
  return {
    id: doc.id,
    name: doc.name ?? '',
    email: doc.email,
    apiKeyPrefix: doc.apiKeyPrefix,
    created: doc.created,
    updated: doc.updated,
    lastLogin: doc.lastLogin,
    inactive: doc.inactive ?? false,
  }
}

export async function getUserById(id) {
  const user = await User.findOne({ id: Number(id) })
  return toUserResponse(user)
}

export async function getUserByEmail(email) {
  const user = await User.findOne({ email: String(email).trim().toLowerCase() })
  return toUserResponse(user)
}

export async function findUserByApiKey(rawKey) {
  if (!rawKey) return null
  const user = await User.findOne({ apiKeyHash: hashApiKey(rawKey), inactive: false })
  return toUserResponse(user)
}

export async function touchLastLogin(id) {
  const now = unixNow()
  await User.updateOne({ id: Number(id) }, { lastLogin: now, updated: now })
}

export async function createUser({ name, email }) {
  const normalizedEmail = String(email).trim().toLowerCase()
  if (!normalizedEmail) {
    throw new Error('Email is required')
  }

  const existing = await User.findOne({ email: normalizedEmail })
  if (existing) {
    const error = new Error('Email already registered')
    error.statusCode = 409
    throw error
  }

  const now = unixNow()
  const apiKey = generateApiKey()
  const id = await getNextId(User)

  const user = await User.create({
    id,
    name: name?.trim() || undefined,
    email: normalizedEmail,
    apiKeyHash: hashApiKey(apiKey),
    apiKeyPrefix: apiKeyPrefix(apiKey),
    created: now,
    updated: now,
    lastLogin: now,
    inactive: false,
  })

  return { user: toUserResponse(user), apiKey }
}

export async function rotateApiKey(userId) {
  const apiKey = generateApiKey()
  const now = unixNow()

  const user = await User.findOneAndUpdate(
    { id: Number(userId), inactive: false },
    {
      apiKeyHash: hashApiKey(apiKey),
      apiKeyPrefix: apiKeyPrefix(apiKey),
      updated: now,
    },
    { new: true, runValidators: true },
  )

  if (!user) return null
  return { user: toUserResponse(user), apiKey }
}

/** Admin recovery: issue a new key by email without the old key. */
export async function rotateApiKeyByEmail(email) {
  const normalizedEmail = String(email).trim().toLowerCase()
  if (!normalizedEmail) return null

  const existing = await User.findOne({ email: normalizedEmail, inactive: false })
  if (!existing) return null

  return rotateApiKey(existing.id)
}

export async function updateUser(id, data) {
  const updates = { updated: unixNow() }

  if (data.name !== undefined) updates.name = data.name
  if (data.email !== undefined) updates.email = String(data.email).trim().toLowerCase()
  if (data.inactive !== undefined) updates.inactive = data.inactive

  const user = await User.findOneAndUpdate({ id: Number(id) }, updates, {
    new: true,
    runValidators: true,
  })
  return toUserResponse(user)
}

export async function deleteUser(id) {
  const user = await User.findOneAndDelete({ id: Number(id) })
  return toUserResponse(user)
}
