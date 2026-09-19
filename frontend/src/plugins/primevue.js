import PrimeVue from 'primevue/config'
import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'

const AppPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{emerald.50}',
      100: '{emerald.100}',
      200: '{emerald.200}',
      300: '{emerald.300}',
      400: '{emerald.400}',
      500: '{emerald.500}',
      600: '{emerald.600}',
      700: '{emerald.700}',
      800: '{emerald.800}',
      900: '{emerald.900}',
      950: '{emerald.950}',
    },
  },
})

const components = {
  Button,
  Dialog,
  InputText,
  Message,
  Select,
  SelectButton,
  Tag,
  Textarea,
}

export function installPrimeVue(app) {
  app.use(PrimeVue, {
    theme: {
      preset: AppPreset,
      options: {
        darkModeSelector: 'none',
      },
    },
  })

  for (const [name, component] of Object.entries(components)) {
    app.component(name, component)
  }
}
