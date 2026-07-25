import mongoose from 'mongoose'

/**
 * In-game area that can grant a Nuzlocke encounter (wild, gift, static, etc.).
 * Shared across compatible games via gameIds (e.g. Red + Blue).
 */
const routeSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    region: { type: String, required: true, trim: true, lowercase: true },
    /** gameIds from models/Run.js — Red=1, Blue=2, … */
    gameIds: {
      type: [{ type: Number, required: true }],
      required: true,
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length > 0
        },
        message: 'gameIds must be a non-empty array',
      },
    },
    /** Display / story order within a region for a given game set. */
    sortOrder: { type: Number, required: true },
    /**
     * wild — grass/surf/cave encounter
     * gift — NPC gift (starter, Lapras, …)
     * static — overworld legendaries / Snorlax
     * purchase — e.g. Magikarp salesman
     * choice — mutually exclusive picks (Dojo, fossils)
     */
    encounterType: {
      type: String,
      required: true,
      enum: ['wild', 'gift', 'static', 'purchase', 'choice'],
    },
    /** Parent slug for Safari sections, multi-floor caves, etc. */
    parentSlug: { type: String, default: null, trim: true, lowercase: true },
    notes: { type: String, default: '', trim: true },
  },
  { versionKey: false },
)

routeSchema.index({ gameIds: 1, sortOrder: 1 })
routeSchema.index({ region: 1 })

export default mongoose.models.Route || mongoose.model('Route', routeSchema)
