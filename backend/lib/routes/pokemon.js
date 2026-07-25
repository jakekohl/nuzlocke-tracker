import { requireUser } from '../auth.js'
import { getRouteParam } from '../requestParams.js'
import { getPokemonById, listPokemon } from '../pokemonService.js'

export async function handlePokemon(req, res, segments) {
  // GET /api/pokemon?generation=1
  if (segments.length === 1 && req.method === 'GET') {
    const user = await requireUser(req, res)
    if (!user) return

    const generation = req.query?.generation
    const pokemon = await listPokemon({ generation })
    return res.status(200).json(pokemon)
  }

  // GET /api/pokemon/:id
  if (segments.length === 2 && req.method === 'GET') {
    const user = await requireUser(req, res)
    if (!user) return

    const id = getRouteParam(req, 'id') ?? segments[1]
    const pokemon = await getPokemonById(id)
    if (!pokemon) {
      return res.status(404).json({ message: 'Pokémon not found' })
    }
    return res.status(200).json(pokemon)
  }

  if (segments.length === 1) {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  return res.status(404).json({ message: 'Not found' })
}
