import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    name: { type: String, trim: true },
    email: { type: String, required: true, trim: true, unique: true, lowercase: true },
    apiKeyHash: { type: String, required: true },
    apiKeyPrefix: { type: String, required: true },
    created: { type: Number, required: true },
    updated: { type: Number, required: true },
    lastLogin: { type: Number, required: true },
    inactive: { type: Boolean, required: true, default: false },
  },
  { versionKey: false },
)

userSchema.index({ apiKeyHash: 1 }, { unique: true })

export default mongoose.models.User || mongoose.model('User', userSchema)
