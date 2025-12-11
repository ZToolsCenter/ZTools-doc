import { defineConfig } from 'vitepress';

// refer https://vitepress.dev/reference/site-config for details
export default defineConfig({
  base: '/ZTools-doc/', // GitHub Pages 部署路径，需要与仓库名匹配
  lang: 'zh-CN',
  title: 'ZTools 开发者文档',
  description: 'ZTools 开发者文档',

  themeConfig: {
    nav: [
      { text: 'Example', link: '/example' },

      // {
      //   text: 'Dropdown Menu',
      //   items: [
      //     { text: 'Item A', link: '/item-1' },
      //     { text: 'Item B', link: '/item-2' },
      //     { text: 'Item C', link: '/item-3' },
      //   ],
      // },

      // ...
    ],

    sidebar: [
      {
        text: '开始',
        items: [
          { text: '快速上手', link: '/file-structure' },
        ],
      },
      {
        text: '详细',
        items: [
          { text: '插件应用目录结构', link: '/file-structure' },
          { text: 'plugin.json 配置', link: '/plugin-json' },
          { text: 'preload.js 配置', link: '/preload-js' },
          { text: 'Node.js 能力', link: '/node-js' },
          { text: '插件 API', link: '/plugin-api' },
        ]
      }
    ],

    outline: {
      level: [2, 3],
      label: '页面导航',
    },

    search: {
      provider: 'local',
    },
  },
});
