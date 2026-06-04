import mongoose from 'mongoose'
import User from '../models/User.js'

export function toUserResponse(doc) {
  if (!doc) return null
  return {
    id: doc.id,
    name: doc.name,
    email: doc.email,
    password: doc.password,
    created: doc.created,
    updated: doc.updated,
    lastLogin: doc.lastLogin,
  }
}

export async function getUserById(id) {
  const user = await User.findOne({ id: id })
  return toUserResponse(user)
}

export async function createUser(data) {
  const user = await User.create({
    id: data.id,
    name: data.name,
    email: data.email,
    password: data.password,
  })
  return toUserResponse(user)
}

export async function updateUser(id, data) {
  const user = await User.findOneAndUpdate(
    id,
    {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.password !== undefined && { password: data.password }),
    },
    { new: true, userValidators: true },
  )
  return toUserResponse(user)
}

export async function deleteUser(id) {
  const user = await User.findOneAndDelete({ id: id })
  return toUserResponse(user)
}
