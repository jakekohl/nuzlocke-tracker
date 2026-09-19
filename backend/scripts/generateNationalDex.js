/**
 * One-off generator: reads PokeAPI CSVs and writes data/nationalDex.js
 * Usage: node scripts/generateNationalDex.js [csvDir]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const csvDir = process.argv[2] || '/tmp'
const outFile = path.join(__dirname, '../data/nationalDex.js')

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/)
  const headers = lines[0].split(',')
  return lines.slice(1).map((line) => {
    const cols = []
    let cur = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i]
      if (ch === '"') {
        inQuotes = !inQuotes
        continue
      }
      if (ch === ',' && !inQuotes) {
        cols.push(cur)
        cur = ''
        continue
      }
      cur += ch
    }
    cols.push(cur)
    const row = {}
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? ''
    })
    return row
  })
}

const species = parseCsv(fs.readFileSync(path.join(csvDir, 'pokemon_species.csv'), 'utf8'))
const names = parseCsv(fs.readFileSync(path.join(csvDir, 'pokemon_species_names.csv'), 'utf8'))
const pokemon = parseCsv(fs.readFileSync(path.join(csvDir, 'pokemon.csv'), 'utf8'))
const pokemonTypes = parseCsv(fs.readFileSync(path.join(csvDir, 'pokemon_types.csv'), 'utf8'))
const types = parseCsv(fs.readFileSync(path.join(csvDir, 'types.csv'), 'utf8'))

const typeById = new Map(types.map((t) => [t.id, t.identifier]))
const nameBySpecies = new Map(
  names.filter((n) => n.local_language_id === '9').map((n) => [n.pokemon_species_id, n.name]),
)

const defaultPokemonBySpecies = new Map()
for (const row of pokemon) {
  if (row.is_default === '1') {
    defaultPokemonBySpecies.set(row.species_id, row.id)
  }
}

const typesByPokemon = new Map()
for (const row of pokemonTypes) {
  const list = typesByPokemon.get(row.pokemon_id) ?? []
  list.push({ slot: Number(row.slot), name: typeById.get(row.type_id) })
  typesByPokemon.set(row.pokemon_id, list)
}

const chainMinId = new Map()
for (const row of species) {
  const chain = row.evolution_chain_id
  const id = Number(row.id)
  const prev = chainMinId.get(chain)
  if (prev == null || id < prev) chainMinId.set(chain, id)
}

const MAX_DEX = 1025
const rows = species
  .map((row) => ({ ...row, nid: Number(row.id) }))
  .filter((row) => row.nid >= 1 && row.nid <= MAX_DEX)
  .sort((a, b) => a.nid - b.nid)

if (rows.length !== MAX_DEX) {
  throw new Error(`Expected ${MAX_DEX} species, got ${rows.length}`)
}

function jsString(value) {
  return JSON.stringify(value)
}

const lines = [
  '/** National Dex 1–1025. Types are modern (post-Fairy). Generated from PokeAPI CSVs. */',
  'export const nationalDex = [',
]

for (const row of rows) {
  const pokeId = defaultPokemonBySpecies.get(row.id)
  if (!pokeId) throw new Error(`No default pokemon for species ${row.id}`)
  const typeList = (typesByPokemon.get(pokeId) ?? [])
    .sort((a, b) => a.slot - b.slot)
    .map((t) => t.name)
  if (!typeList.length) throw new Error(`No types for species ${row.id}`)
  const name = nameBySpecies.get(row.id)
  if (!name) throw new Error(`No English name for species ${row.id}`)
  const family = chainMinId.get(row.evolution_chain_id)
  const typesLit = typeList.map((t) => jsString(t)).join(', ')
  lines.push(
    `  { id: ${row.nid}, name: ${jsString(name)}, generation: ${row.generation_id}, types: [${typesLit}], evolutionFamilyId: ${family} },`,
  )
}

lines.push(']')
lines.push('')

fs.writeFileSync(outFile, lines.join('\n'))
console.log(`Wrote ${rows.length} Pokémon to ${outFile}`)
