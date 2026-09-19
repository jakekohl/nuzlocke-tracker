import { kantoLocations } from './kanto.js'
import { seviiLocations } from './sevii.js'
import { johtoLocations } from './johto.js'
import { kantoPostgameLocations, hgssExtraLocations } from './johtoKanto.js'
import { hoennLocations, emeraldExtraLocations, orasExtraLocations } from './hoenn.js'
import { sinnohLocations, platinumExtraLocations } from './sinnoh.js'
import { unovaBwLocations, unovaB2w2Locations } from './unova.js'
import { kalosLocations } from './kalos.js'
import { alolaLocations, usumExtraLocations } from './alola.js'
import { letsGoLocations } from './letsgo.js'
import { galarLocations } from './galar.js'
import { hisuiLocations, paldeaLocations, zaLocations } from './modern.js'

export const allLocations = [
  ...kantoLocations,
  ...seviiLocations,
  ...johtoLocations,
  ...kantoPostgameLocations,
  ...hgssExtraLocations,
  ...hoennLocations,
  ...emeraldExtraLocations,
  ...orasExtraLocations,
  ...sinnohLocations,
  ...platinumExtraLocations,
  ...unovaBwLocations,
  ...unovaB2w2Locations,
  ...kalosLocations,
  ...alolaLocations,
  ...usumExtraLocations,
  ...letsGoLocations,
  ...galarLocations,
  ...hisuiLocations,
  ...paldeaLocations,
  ...zaLocations,
]
