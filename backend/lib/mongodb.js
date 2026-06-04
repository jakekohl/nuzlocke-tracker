import mongoose from 'mongoose'

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

function buildMongoUri() {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI
  }

  const username = process.env.MONGODB_USERNAME
  const password = process.env.MONGODB_PASSWORD
  const host = process.env.MONGODB_HOST
  const dbName = process.env.MONGODB_DBNAME
  const authSource = process.env.MONGODB_AUTH_SOURCE ?? 'admin'
  const authMechanism = process.env.MONGODB_AUTH_MECHANISM

  if (!username || !password || !host) {
    throw new Error(
      'Set MONGODB_URI or MONGODB_USERNAME, MONGODB_PASSWORD, and MONGODB_HOST',
    )
  }

  const credentials = `${encodeURIComponent(username)}:${encodeURIComponent(password)}`
  const params = new URLSearchParams({ authSource })
  if (authMechanism) params.set('authMechanism', authMechanism)

  return `mongodb+srv://${credentials}@${host}${dbName ? `/${dbName}` : ''}?${params}`
}

export default async function connectToDatabase() {
  const uri = buildMongoUri()

  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false,
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (error) {
    cached.promise = null
    throw error
  }

  return cached.conn
}
