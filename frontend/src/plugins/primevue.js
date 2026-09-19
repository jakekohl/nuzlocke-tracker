import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'

const components = {
  Button,
  Dialog,
  InputText,
  Select,
  SelectButton,
  Tag,
  Textarea,
}

export function installPrimeVue(app) {
  app.use(PrimeVue, {
    theme: {
      preset: Aura,
      options: {
        darkModeSelector: 'none',
      },
    },
  })

  for (const [name, component] of Object.entries(components)) {
    app.component(name, component)
  }
}
