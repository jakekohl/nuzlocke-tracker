import mongoose from 'mongoose'

/**
 * Species reference data (not a caught specimen).
 * `id` = National Dex number. `evolutionFamilyId` = lowest dex # in the line (dupes clause).
 */
const pokemonSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    generation: { type: Number, required: true, min: 1 },
    types: {
      type: [{ type: String, required: true, lowercase: true, trim: true }],
      required: true,
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length >= 1 && value.length <= 2
        },
        message: 'types must contain 1 or 2 type names',
      },
    },
    evolutionFamilyId: { type: Number, required: true },
  },
  { versionKey: false },
)

pokemonSchema.index({ generation: 1, id: 1 })
pokemonSchema.index({ evolutionFamilyId: 1 })

export default mongoose.models.Pokemon || mongoose.model('Pokemon', pokemonSchema)
