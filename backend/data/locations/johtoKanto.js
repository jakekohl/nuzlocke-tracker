import { buildLocations } from './build.js'
import { gameIds } from '../../lib/games.js'

const GSC_HGSS = [gameIds.gold, gameIds.silver, gameIds.crystal, gameIds.heartgold, gameIds.soulsilver]
const HGSS = [gameIds.heartgold, gameIds.soulsilver]

export const kantoPostgameLocations = buildLocations({
  idStart: 400,
  region: 'kanto',
  gameIds: GSC_HGSS,
  entries: [
    ['jp-route-22', 'Route 22 (Kanto)', 900],
    ['jp-route-28', 'Route 28', 910],
    ['jp-mt-silver', 'Mt. Silver', 920],
    ['jp-route-1', 'Route 1 (Kanto)', 930],
    ['jp-viridian-forest', 'Viridian Forest (Kanto)', 940],
    ['jp-route-2', 'Route 2 (Kanto)', 950],
    ['jp-route-3', 'Route 3 (Kanto)', 960],
    ['jp-mt-moon', 'Mt. Moon (Kanto)', 970],
    ['jp-route-4', 'Route 4 (Kanto)', 980],
    ['jp-route-24', 'Route 24 (Kanto)', 990],
    ['jp-route-25', 'Route 25 (Kanto)', 1000],
    ['jp-route-5', 'Route 5 (Kanto)', 1010],
    ['jp-route-6', 'Route 6 (Kanto)', 1020],
    ['jp-route-11', 'Route 11 (Kanto)', 1030],
    ['jp-digletts-cave', "Diglett's Cave (Kanto)", 1040],
    ['jp-route-9', 'Route 9 (Kanto)', 1050],
    ['jp-route-10', 'Route 10 (Kanto)', 1060],
    ['jp-rock-tunnel', 'Rock Tunnel (Kanto)', 1070],
    ['jp-power-plant', 'Power Plant (Kanto)', 1080],
    ['jp-route-8', 'Route 8 (Kanto)', 1090],
    ['jp-route-7', 'Route 7 (Kanto)', 1100],
    ['jp-route-16', 'Route 16 (Kanto)', 1110],
    ['jp-route-17', 'Route 17 (Kanto)', 1120],
    ['jp-route-18', 'Route 18 (Kanto)', 1130],
    ['jp-route-12', 'Route 12 (Kanto)', 1140],
    ['jp-route-13', 'Route 13 (Kanto)', 1150],
    ['jp-route-14', 'Route 14 (Kanto)', 1160],
    ['jp-route-15', 'Route 15 (Kanto)', 1170],
    ['jp-route-19', 'Route 19 (Kanto)', 1180],
    ['jp-route-20', 'Route 20 (Kanto)', 1190],
    ['jp-seafoam', 'Seafoam Islands (Kanto)', 1200],
    ['jp-cinnabar', 'Cinnabar / Sea (Kanto)', 1210],
    ['jp-route-21', 'Route 21 (Kanto)', 1220],
    ['jp-cerulean-cave', 'Cerulean Cave (Kanto)', 1230],
  ],
})

export const hgssExtraLocations = buildLocations({
  idStart: 450,
  region: 'johto',
  gameIds: HGSS,
  entries: [
    ['hgss-safari-zone', 'Johto Safari Zone', 335],
    ['hgss-safari-peak', 'Safari Zone (Peak)', 336, 'wild', 'hgss-safari-zone'],
    ['hgss-safari-desert', 'Safari Zone (Desert)', 337, 'wild', 'hgss-safari-zone'],
    ['hgss-safari-marsh', 'Safari Zone (Marshland)', 338, 'wild', 'hgss-safari-zone'],
    ['hgss-safari-forest', 'Safari Zone (Forest)', 339, 'wild', 'hgss-safari-zone'],
    ['hgss-pokeathlon', 'Pokéathlon Dome gift', 155, 'gift'],
    ['hgss-embedded-tower', 'Embedded Tower', 440, 'static'],
  ],
})
