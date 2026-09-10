import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import DownloadMarkdown from './components/DownloadMarkdown.vue'
import './styles.css'

export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'doc-before': () => h(DownloadMarkdown),
    }),
}
