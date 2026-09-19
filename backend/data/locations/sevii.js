import { buildLocations } from './build.js'
import { gameIds } from '../../lib/games.js'

const FRLG = [gameIds.firered, gameIds.leafgreen]

export const seviiLocations = buildLocations({
  idStart: 100,
  region: 'sevii',
  gameIds: FRLG,
  entries: [
    ['kindle-road', 'Kindle Road', 500],
    ['mt-ember', 'Mt. Ember', 510],
    ['mt-ember-moltres', 'Mt. Ember (Moltres)', 515, 'static', 'mt-ember'],
    ['treasure-beach', 'Treasure Beach', 520],
    ['cape-brink', 'Cape Brink', 530],
    ['bond-bridge', 'Bond Bridge', 540],
    ['berry-forest', 'Berry Forest', 550],
    ['three-isle-port', 'Three Isle Port', 560],
    ['bond-bridge-lost-cave', 'Lost Cave', 570],
    ['resort-gorgeous', 'Resort Gorgeous', 580],
    ['water-labyrinth', 'Water Labyrinth', 590],
    ['five-isle-meadow', 'Five Isle Meadow', 600],
    ['memorial-pillar', 'Memorial Pillar', 610],
    ['water-path', 'Water Path', 620],
    ['ruin-valley', 'Ruin Valley', 630],
    ['pattern-bush', 'Pattern Bush', 640],
    ['green-path', 'Green Path', 650],
    ['outcast-island', 'Outcast Island', 660],
    ['tanoby-ruins', 'Tanoby Ruins', 670],
    ['canyon-entrance', 'Canyon Entrance', 680],
    ['sevault-canyon', 'Sevault Canyon', 690],
    ['seven-island-trainer-tower', 'Trainer Tower', 700],
    ['navel-rock', 'Navel Rock', 710, 'static'],
    ['birth-island', 'Birth Island', 720, 'static'],
  ],
})
