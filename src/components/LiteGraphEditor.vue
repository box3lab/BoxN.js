<template>
  <div id="canvas-container" class="graph-editor-container" @dragover.prevent="handleCanvasDragOver"
    @drop.prevent="handleCanvasDrop">
    <canvas id="mycanvas" class="graph-canvas"></canvas>
  </div>
  <div id="toolbar" class="editor-toolbar"></div>

  <!-- 悬浮工具箱 -->
  <FloatingToolbox :initialX="50" :initialY="50" @run="startGraph" @stop="stopGraph" @save="saveGraph"
    @export="exportToFile" @import="importFromFile" @open-manager="openNodeManager" />

  <!-- 节点详情对话框 -->
  <NodeDetailDialog :visible="showNodeDetails" :node="selectedNode || undefined" @close="closeNodeDetails"
    @update="handleNodeUpdate" />

  <!-- 节点管理器对话框 -->
  <NodeManagerDialog :visible="showNodeManager" @close="closeNodeManager" @node-imported="handleNodeImported"
    @node-deleted="handleNodeDeleted" @add-to-canvas="handleAddToCanvas" @drag-node-start="handleNodeDragStart"
    @drag-node-end="handleNodeDragEnd" />

  <!-- AI聊天助手 -->
  <AIChatDialog />

  <!-- 保存成功提示 -->
  <div v-if="showSaveNotification" class="save-notification">
    <span>图形已保存</span>
  </div>

  <!-- 通用通知组件 -->
  <div v-if="showNotificationFlag" class="notification" :class="notificationType" ref="notificationElement">
    {{ notificationMessage }}
  </div>

  <!-- 导出/导入操作的隐藏元素 -->
  <input type="file" ref="fileInput" class="hidden-file-input" accept=".json" @change="handleFileSelected" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
//
import { LGraph, LGraphCanvas, LGraphNode } from 'litegraph.js'
import '../nodes'
import LiteGraph from '../services/liteGraphCfg'

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
import AIChatDialog from './AIChatDialog.vue'
import NodeManagerDialog from './NodeManagerDialog.vue'

const graph = ref<LGraph | null>(null)
const graphCanvas = ref<LGraphCanvas | null>(null)
const showNodeDetails = ref(false)
const selectedNode = ref<LGraphNode | null>(null)
const isRunning = ref(false)
const showSaveNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref<'success' | 'error'>('success')
const showNotificationFlag = ref(false)
const notificationElement = ref<HTMLElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
let saveNotificationTimeout: number | null = null

// 节点管理器状态
const showNodeManager = ref(false)

// 添加拖拽相关状态
const isDraggingNode = ref(false)
const draggedNodeInfo = ref<{ type: string, className: string, category: string } | null>(null)

onMounted(() => {
  initLiteGraph()
  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', handleKeyDown)
  fileInput.value = document.querySelector('.hidden-file-input')
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

function exportToFile() {
  if (!graph.value) return

  try {
    const jsonData = exportGraph(graph.value as unknown as LGraph)

    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = 'graph.json'
    a.click()

    URL.revokeObjectURL(url)

    showNotification('图形导出成功')
  } catch (error) {
    console.error('导出图形失败:', error)
  }
}

function importFromFile() {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

async function handleFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files || !input.files[0] || !graph.value) return

  const file = input.files[0]
  const reader = new FileReader()

  reader.onload = async (e) => {
    try {
      const jsonData = e.target?.result as string
      if (!jsonData) throw new Error('无法读取文件')

      const success = await importGraph(graph.value as unknown as LGraph, jsonData)

      if (success) {
        showNotification('图形导入成功')
        // 重新初始化画布
        if (graphCanvas.value) {
          graphCanvas.value.draw(true, true)
        }
      } else {
        showNotification('图形导入失败', 'error')
      }
    } catch (error) {
      console.error('导入图形失败:', error)
      showNotification('图形导入失败', 'error')
    }
  }

  reader.readAsText(file)
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

// 节点管理器相关功能
function openNodeManager() {
  showNodeManager.value = true
}

function closeNodeManager() {
  showNodeManager.value = false
}

function handleNodeImported(count: number) {
  showNotification(`已成功导入 ${count} 个节点`, 'success')

  // 刷新画布
  if (graphCanvas.value) {
    graphCanvas.value.draw(true, true)
  }
}

function handleNodeDeleted(nodeType: string) {
  showNotification(`已删除节点: ${nodeType}`, 'success')

  // 刷新画布
  if (graphCanvas.value) {
    graphCanvas.value.draw(true, true)
  }
}

// 添加节点到画布
function handleAddToCanvas(nodeInfo: { type: string, className: string, category: string }) {
  if (!graph.value) return;

  try {
    // 使用LiteGraph的createNode方法创建节点
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newNode = LiteGraph.createNode(nodeInfo.type) as any;

    if (!newNode) {
      showNotification(`无法创建节点: ${nodeInfo.className}`, 'error');
      return;
    }

    // 设置节点位置在视口中心
    if (graphCanvas.value) {
      // 获取画布偏移和缩放
      const offset = graphCanvas.value.ds.offset;
      const scale = graphCanvas.value.ds.scale;

      // 计算视口中心位置
      const canvasRect = (graphCanvas.value.canvas as HTMLCanvasElement).getBoundingClientRect();
      const centerX = (canvasRect.width * 0.5 - offset[0]) / scale;
      const centerY = (canvasRect.height * 0.5 - offset[1]) / scale;

      // 随机偏移，避免重叠
      const randomOffset = 50;
      newNode.pos = [
        centerX + (Math.random() * 2 - 1) * randomOffset,
        centerY + (Math.random() * 2 - 1) * randomOffset
      ];
    }

    // 添加节点到图形
    graph.value.add(newNode);

    // 重绘画布
    if (graphCanvas.value) {
      graphCanvas.value.draw(true, true);
    }

    showNotification(`已添加节点: ${nodeInfo.className}`, 'success');
  } catch (error) {
    console.error('添加节点失败:', error);
    showNotification(`添加节点失败: ${error}`, 'error');
  }
}

// 显示通知
function showNotification(message: string, type: 'success' | 'error' = 'success') {
  notificationMessage.value = message
  notificationType.value = type
  showNotificationFlag.value = true

  // 更新通知元素的显示内容
  if (notificationElement.value) {
    notificationElement.value.textContent = message;
  }

  setTimeout(() => {
    showNotificationFlag.value = false
  }, 3000)
}

// 处理节点开始拖拽
function handleNodeDragStart(nodeInfo: { type: string, className: string, category: string }) {
  isDraggingNode.value = true
  draggedNodeInfo.value = nodeInfo

  // 添加特殊样式到画布
  const canvasContainer = document.getElementById('canvas-container')
  if (canvasContainer) {
    canvasContainer.classList.add('drag-target')
  }
}

// 处理节点结束拖拽
function handleNodeDragEnd() {
  isDraggingNode.value = false

  // 移除特殊样式
  const canvasContainer = document.getElementById('canvas-container')
  if (canvasContainer) {
    canvasContainer.classList.remove('drag-target')
  }
}

// 处理画布拖拽悬停
function handleCanvasDragOver(event: DragEvent) {
  if (!isDraggingNode.value) return

  // 修改鼠标样式，表示可以放置
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
}

// 处理画布拖拽放置
function handleCanvasDrop(event: DragEvent) {
  if (!isDraggingNode.value || !draggedNodeInfo.value || !graph.value) return

  try {
    const nodeInfo = draggedNodeInfo.value

    // 从dataTransfer尝试获取数据（以防直接拖拽）
    if (event.dataTransfer) {
      const jsonData = event.dataTransfer.getData('application/node')
      if (jsonData) {
        try {
          const parsedData = JSON.parse(jsonData)
          if (parsedData && parsedData.type) {
            nodeInfo.type = parsedData.type
            nodeInfo.className = parsedData.className
            nodeInfo.category = parsedData.category
          }
        } catch (e) {
          console.error('解析拖拽数据失败:', e)
        }
      }
    }

    // 使用LiteGraph的createNode方法创建节点
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newNode = LiteGraph.createNode(nodeInfo.type) as any

    if (!newNode) {
      showNotification(`无法创建节点: ${nodeInfo.className}`, 'error')
      return
    }

    // 设置节点位置在鼠标放置位置
    if (graphCanvas.value) {
      // 获取画布偏移和缩放
      const offset = graphCanvas.value.ds.offset
      const scale = graphCanvas.value.ds.scale

      // 获取鼠标相对于画布的位置
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
      const x = (event.clientX - rect.left)
      const y = (event.clientY - rect.top)

      // 转换为画布坐标系中的位置
      const canvasX = (x - offset[0]) / scale
      const canvasY = (y - offset[1]) / scale

      // 设置节点位置
      newNode.pos = [canvasX, canvasY]
    }

    // 添加节点到图形
    graph.value.add(newNode)

    // 重绘画布
    if (graphCanvas.value) {
      graphCanvas.value.draw(true, true)
    }

    showNotification(`已添加节点: ${nodeInfo.className}`, 'success')
  } catch (error) {
    console.error('添加节点失败:', error)
    showNotification(`添加节点失败: ${error}`, 'error')
  } finally {
    // 重置拖拽状态
    isDraggingNode.value = false
    draggedNodeInfo.value = null
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

.notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 10px 20px;
  border-radius: 4px;
  color: white;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.notification.success {
  background-color: rgba(46, 125, 50, 0.9);
}

.notification.error {
  background-color: rgba(198, 40, 40, 0.9);
}

/* 添加画布拖拽样式 */
.graph-editor-container.drag-target {
  position: relative;
}

.graph-editor-container.drag-target::after {
  content: '松开鼠标以放置节点';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(30, 30, 50, 0.85);
  color: white;
  padding: 15px 25px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
  z-index: 100;
  border: 2px solid rgba(74, 107, 175, 0.6);
  pointer-events: none;
}

.graph-editor-container.drag-target::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(74, 107, 175, 0.1);
  border: 3px dashed rgba(74, 107, 175, 0.4);
  z-index: 10;
  pointer-events: none;
}
</style>
