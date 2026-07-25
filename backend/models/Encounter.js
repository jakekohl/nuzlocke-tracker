import mongoose from 'mongoose'

export const encounterStatuses = {
  alive: 0,
  dead: 1,
  boxed: 2,
  /** First encounter fled / fainted / failed catch — area used up */
  failed: 3,
}

const encounterSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    runId: { type: Number, required: true },
    routeId: { type: Number, required: true },
    /** National dex id; null when status is failed and species unknown */
    pokemonId: { type: Number, required: false, default: null },
    nickname: { type: String, default: '', trim: true },
    status: { type: Number, required: true },
    isShiny: { type: Boolean, required: true, default: false },
    level: { type: Number, required: false },
    notes: { type: String, default: '', trim: true },
    caughtAt: { type: Number, required: true },
    created: { type: Number, required: true },
    updated: { type: Number, required: true },
    inactive: { type: Number, required: false },
  },
  { versionKey: false },
)

encounterSchema.index({ runId: 1, inactive: 1 })
encounterSchema.index({ runId: 1, routeId: 1, inactive: 1 })

export default mongoose.models.Encounter || mongoose.model('Encounter', encounterSchema)
