/** @deprecated Prefer nationalDex; kept for older imports. */
import { nationalDex } from './nationalDex.js'

export const gen1Pokemon = nationalDex.filter((pokemon) => pokemon.generation === 1)
