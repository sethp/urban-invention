import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solid({
    include: './example/solidjs/**',
    // see: https://github.com/solidjs/solid-refresh/issues/14
    // hot refresh is bugged for the js template (which this is),
    // let's just do some full page reloads ¯\_(ツ)_/¯
    hot: false
  })],
})
