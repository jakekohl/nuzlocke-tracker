import mongoose from 'mongoose'

const runSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    name: { type: String, trim: true },
    startDate: { type: Number, required: true },
    endDate: { type: Number },
    status: { type: Number, required: true },
    notes: { type: String, default: '', trim: true },
    created: { type: Number },
    updated: { type: Number },
    userId: { type: Number, required: true },
    gameId: { type: Number, required: true },
    inactive: { type: Number, required: false },
  },
  { versionKey: false },
)

export const gameIds = {
  red: 1,
  blue: 2,
  yellow: 3,
  gold: 4,
  silver: 5,
  crystal: 6,
  ruby: 7,
  sapphire: 8,
  emerald: 9,
  firered: 10,
  leafgreen: 11,
  diamond: 12,
  pearl: 13,
  platinum: 14,
  heartgold: 15,
  soulsilver: 16,
  black: 17,
  white: 18,
  black2: 19,
  white2: 20,
  x: 21,
  y: 22,
  alphasapphire: 23,
  omegaruby: 24,
  sun: 25,
  moon: 26,
  ultrasun: 27,
  ultramoon: 28,
  letsgo: 29,
  sword: 30,
  shield: 31,
  scarlet: 32,
  violet: 33,
  legendsarceus: 34,
  legendsza: 35,
}

export const runStatuses = {
  notStarted: 0,
  active: 1,
  completed: 2,
  abandoned: 3,
  paused: 4,
}

export default mongoose.models.Run || mongoose.model('Run', runSchema)
