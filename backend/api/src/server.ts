import { createApp } from './app.js'
import { env } from './config.js'

const app = createApp(env)

app.listen(env.PORT, () => {
  console.log(`glowlab-api escuchando en http://0.0.0.0:${env.PORT} (${env.NODE_ENV})`)
})
