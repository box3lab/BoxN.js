<template>
  <div id="canvas-container" class="graph-editor-container">
    <canvas id="mycanvas" class="graph-canvas"></canvas>
  </div>
  <div id="toolbar" class="editor-toolbar"></div>

  <!-- 悬浮工具箱 -->
  <FloatingToolbox
    :initialX="50"
    :initialY="50"
    @run="startGraph"
    @stop="stopGraph"
    @save="saveGraph"
    @export="exportToFile"
    @import="importFromFile"
  />

  <!-- 节点详情对话框 -->
  <NodeDetailDialog
    :visible="showNodeDetails"
    :node="selectedNode || undefined"
    @close="closeNodeDetails"
    @update="handleNodeUpdate"
  />

  <!-- 保存成功提示 -->
  <div v-if="showSaveNotification" class="save-notification">
    <span>图形已保存</span>
  </div>

  <!-- 导出/导入操作的隐藏元素 -->
  <input
    type="file"
    ref="fileInput"
    class="hidden-file-input"
    accept=".json"
    @change="handleFileSelected"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { LGraph, LGraphCanvas, LGraphNode } from 'litegraph.js'
import '../nodes'
import 'litegraph.js/css/litegraph.css'
import {
  createGraph,
  importGraph,
  exportGraph,
  saveGraphToLocalStorage,
  loadGraphFromLocalStorage,
  hasSavedGraph,
  setupNodeDblClickHandler,
  resizeCanvas,
  initCanvas,
} from '../services/graphService'
import NodeDetailDialog from './NodeDetailDialog.vue'
import FloatingToolbox from './FloatingToolbox.vue'

const graph = ref<LGraph | null>(null)
const graphCanvas = ref<LGraphCanvas | null>(null)
const showNodeDetails = ref(false)
const selectedNode = ref<LGraphNode | null>(null)
const isRunning = ref(false)
const showSaveNotification = ref(false)
let saveNotificationTimeout: number | null = null
let fileInput: HTMLInputElement | null = null

onMounted(() => {
  initLiteGraph()
  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', handleKeyDown)
  fileInput = document.querySelector('.hidden-file-input')
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleKeyDown)
  stopGraph()

  if (saveNotificationTimeout) {
    clearTimeout(saveNotificationTimeout)
  }
})

function initLiteGraph() {
  try {
    const newGraph = createGraph()
    const canvas = document.getElementById('mycanvas') as HTMLCanvasElement
    const container = document.getElementById('canvas-container')

    if (container && canvas) {
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight

      const newGraphCanvas = initCanvas('#mycanvas', newGraph)

      if (newGraphCanvas) {
        graph.value = newGraph
        graphCanvas.value = newGraphCanvas

        setupNodeDblClickHandler(newGraphCanvas, handleNodeDblClick)
        loadGraph()
      }
    }
  } catch (error) {
    console.error('Error initializing LiteGraph:', error)
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault()
    saveGraph()
  }
}

function saveGraph() {
  if (!graph.value) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const success = saveGraphToLocalStorage(graph.value as unknown as any)
  if (success) {
    showSaveNotification.value = true

    if (saveNotificationTimeout) {
      clearTimeout(saveNotificationTimeout)
    }

    saveNotificationTimeout = window.setTimeout(() => {
      showSaveNotification.value = false
    }, 3000)
  }
}

function loadGraph() {
  if (!graph.value) return

  if (hasSavedGraph()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const success = loadGraphFromLocalStorage(graph.value as unknown as any)
    if (success && graphCanvas.value) {
      graphCanvas.value.draw(true, true)
    }
  }
}

function exportToFile(customFilename?: string) {
  if (!graph.value) return

  try {
    const jsonData = exportGraph(graph.value as unknown as LGraph)
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = customFilename ? `${customFilename}.json` : 'graph.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('Error exporting graph:', error)
  }
}

function importFromFile() {
  if (fileInput) {
    fileInput.click()
  }
}

function handleFileSelected(event: Event) {
  if (!graph.value) return

  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  const file = input.files[0]
  const reader = new FileReader()

  reader.onload = (e) => {
    try {
      if (e.target?.result && typeof e.target.result === 'string') {
        importGraph(graph.value as unknown as LGraph, e.target.result)
        if (graphCanvas.value) {
          graphCanvas.value.draw(true, true)
        }
      }
    } catch (error) {
      console.error('Error importing graph:', error)
    }
  }

  reader.readAsText(file)
  input.value = '' // 清除文件选择，允许再次选择相同文件
}

function handleResize() {
  if (!graphCanvas.value) return

  const canvas = document.getElementById('mycanvas') as HTMLCanvasElement
  const container = document.getElementById('canvas-container')

  if (canvas && container && graphCanvas.value) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resizeCanvas(canvas, container, graphCanvas.value as unknown as any)
  }
}

function startGraph() {
  if (!graph.value || isRunning.value) return

  graph.value.start()
  isRunning.value = true
}

function stopGraph() {
  if (!graph.value || !isRunning.value) return

  graph.value.stop()
  isRunning.value = false
}

function handleNodeDblClick(node: LGraphNode) {
  selectedNode.value = node
  showNodeDetails.value = true
}

function closeNodeDetails() {
  showNodeDetails.value = false
  selectedNode.value = null
}

function handleNodeUpdate(node: LGraphNode, properties: Record<string, unknown>) {
  if (!node) return

  Object.assign(node.properties, properties)

  if (graphCanvas.value) {
    graphCanvas.value.draw(true, true)
  }
}
</script>

<style scoped>
#canvas-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

#mycanvas {
  width: 100%;
  height: 100%;
  display: block;
  background-color: #2a2a2a;
}

.save-notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: rgba(50, 50, 50, 0.8);
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.hidden-file-input {
  display: none;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  #mycanvas {
    touch-action: none;
  }
}
</style>
