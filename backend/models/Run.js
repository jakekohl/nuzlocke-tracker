import mongoose from 'mongoose'
import { defaultRunRules, RULE_KEYS } from '../lib/runRules.js'
import { gameIds as catalogGameIds } from '../lib/games.js'

const rulesShape = Object.fromEntries(
  Object.values(RULE_KEYS).map((key) => [key, { type: Boolean, required: true }]),
)

const runSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    name: { type: String, trim: true },
    startDate: { type: Number, required: true },
    endDate: { type: Number },
    status: { type: Number, required: true },
    notes: { type: String, default: '', trim: true },
    rules: {
      type: new mongoose.Schema(rulesShape, { _id: false }),
      required: true,
      default: () => defaultRunRules(),
    },
    created: { type: Number },
    updated: { type: Number },
    userId: { type: Number, required: true },
    gameId: { type: Number, required: true },
    inactive: { type: Number, required: false },
  },
  { versionKey: false },
)

runSchema.index({ userId: 1, inactive: 1 })

export const gameIds = catalogGameIds

/** Games with curated location checklists. */
export const supportedGameIds = new Set(Object.values(catalogGameIds))

export const runStatuses = {
  notStarted: 0,
  active: 1,
  completed: 2,
  abandoned: 3,
  paused: 4,
}

export default mongoose.models.Run || mongoose.model('Run', runSchema)
