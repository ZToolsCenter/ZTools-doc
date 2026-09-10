<script setup lang="ts">
import { computed, ref } from 'vue'
import { useData } from 'vitepress'

const { frontmatter, page } = useData()
const downloading = ref(false)

const markdownFiles = import.meta.glob('../../../*.md', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>

const sourceLoader = computed(() => markdownFiles[`../../../${page.value.filePath}`])
const visible = computed(
  () => Boolean(frontmatter.value.downloadMarkdown && sourceLoader.value),
)

async function downloadMarkdown() {
  const loader = sourceLoader.value
  if (!loader || downloading.value) return

  downloading.value = true
  try {
    const source = await loader()
    const blobUrl = URL.createObjectURL(
      new Blob([source], { type: 'text/markdown;charset=utf-8' }),
    )
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = page.value.filePath.split('/').pop() || 'document.md'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
  } finally {
    downloading.value = false
  }
}
</script>

<template>
  <div v-if="visible" class="markdown-download">
    <button
      class="markdown-download__button"
      type="button"
      :disabled="downloading"
      @click="downloadMarkdown"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3v12m0 0 5-5m-5 5-5-5M5 20h14" />
      </svg>
      {{ downloading ? '正在下载…' : '下载 Markdown' }}
    </button>
  </div>
</template>
