<template>
  <div id="canvas-container" class="graph-editor-container" @dragover.prevent="handleDragOver"
    @drop.prevent="handleCanvasDrop" @dragleave="handleDragLeave" @click="closeContextMenu">
    <canvas id="mycanvas" class="graph-canvas"></canvas>
  </div>
  <div id="toolbar" class="editor-toolbar"></div>

  <!-- 固定顶部工具栏 (原悬浮工具箱) -->
  <FloatingToolbox ref="toolbox" @run="startGraph" @stop="stopGraph" @save="saveCurrentGraph" @export="exportToFile"
    @import="importFromFile" @open-manager="openNodeManager" @switchFile="handleFileSwitch" />

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
  clearGraph,
} from '../services/graphService'
import NodeDetailDialog from './NodeDetailDialog.vue'
import FloatingToolbox from './FloatingToolbox.vue'
import AIChatDialog from './AIChatDialog.vue'
import NodeManagerDialog from './NodeManagerDialog.vue'

// 定义文件接口
interface GraphFile {
  id: string;
  name: string;
  content: string;
  lastModified: number;
}

// 图形和画布引用
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
const toolbox = ref<InstanceType<typeof FloatingToolbox> | null>(null)

// 当前文件ID
const currentFileId = ref<string>('')

// 存储文件内容的Map (fileId -> Graph JSON)
const graphsData = ref<Map<string, string>>(new Map())

let saveNotificationTimeout: number | null = null

// 节点管理器状态
const showNodeManager = ref(false)

// 添加拖拽相关状态
const isDraggingNode = ref(false)
const draggedNodeInfo = ref<{ type: string, className: string, category: string } | null>(null)

// 初始化组件
onMounted(() => {
  initLiteGraph()
  window.addEventListener('resize', handleResize)
  window.addEventListener('orientationchange', handleResize)
  window.addEventListener('keydown', handleKeyDown)
  fileInput.value = document.querySelector('.hidden-file-input')

  // 从本地存储加载文件内容到内存中
  loadSavedGraphsData()

  setTimeout(handleResize, 100)
})

// 清理事件监听器
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('orientationchange', handleResize)
  window.removeEventListener('keydown', handleKeyDown)
  stopGraph()

  if (saveNotificationTimeout) {
    clearTimeout(saveNotificationTimeout)
  }
})

// 初始化图形库
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

        // 等待工具栏组件初始化完成后再加载默认图形
        setTimeout(() => {
          // 获取当前选中的文件ID
          if (toolbox.value && toolbox.value.currentFileId) {
            const fileId = toolbox.value.currentFileId as string;
            console.log(`初始化时加载文件: ${fileId}`);

            // 设置当前文件ID
            currentFileId.value = fileId;

            // 尝试从缓存或本地存储加载图形
            loadDefaultGraph();
          } else {
            console.warn('初始化时未找到有效的文件ID');
          }
        }, 100);
      }
    }
  } catch (error) {
    console.error('Error initializing LiteGraph:', error)
  }
}

// 处理文件切换事件
function handleFileSwitch(file: GraphFile) {
  if (!graph.value || !graphCanvas.value) return;

  try {
    // 先保存当前画布状态到当前文件
    if (currentFileId.value) {
      saveGraphToFile(currentFileId.value);
    }

    // 更新当前文件ID
    currentFileId.value = file.id;

    // 加载目标文件的画布内容
    loadGraphFromFile(file.id, file.content);

    // 记录切换日志
    console.log(`已切换到文件: ${file.id}`);
  } catch (error) {
    console.error('切换文件失败:', error);
    showNotification('切换文件失败，请重试', 'error');
  }
}

// 保存当前画布状态到文件
function saveGraphToFile(fileId: string) {
  if (!graph.value || !fileId) return false;

  try {
    // 序列化当前图形
    const jsonData = exportGraph(graph.value as unknown as LGraph);

    // 存储到文件Map中
    graphsData.value.set(fileId, jsonData);

    // 更新工具栏组件中的文件内容
    if (toolbox.value) {
      toolbox.value.updateFileContent(fileId, jsonData);
    }

    console.log(`文件已保存: ${fileId}`);
    return true;
  } catch (error) {
    console.error('保存图形到文件失败:', error);
    return false;
  }
}

// 从文件加载画布状态
function loadGraphFromFile(fileId: string, defaultContent: string = '') {
  if (!graph.value || !graphCanvas.value) return false;

  try {
    // 清空当前画布
    clearGraph(graph.value as unknown as LGraph);

    // 从内存中获取文件内容，如果没有则使用传入的默认内容
    const fileContent = graphsData.value.get(fileId) || defaultContent;

    // 如果文件内容不为空，导入到画布
    if (fileContent && fileContent.trim() !== '') {
      // 导入文件内容，确保处理异步导入结果
      importGraph(graph.value as unknown as LGraph, fileContent)
        .then((success) => {
          if (success) {
            if (graphCanvas.value) {
              graphCanvas.value.draw(true, true);
            }
            console.log(`已加载文件内容: ${fileId}`);
          } else {
            console.warn(`导入文件内容失败: ${fileId}`);
            showNotification('导入文件内容失败，可能是文件格式错误', 'error');
          }
        })
        .catch((error) => {
          console.error('导入文件内容时出错:', error);
          showNotification('导入文件内容时出错', 'error');
        });

      return true;
    } else {
      console.log(`文件内容为空，创建新画布: ${fileId}`);
      // 文件内容为空，直接绘制空画布
      graphCanvas.value.draw(true, true);
      return true;
    }
  } catch (error) {
    console.error('从文件加载图形失败:', error);
    showNotification('加载失败，无法解析文件内容', 'error');
    return false;
  }
}

// 加载默认图形（兼容旧版本）
function loadDefaultGraph() {
  if (!graph.value || !graphCanvas.value) return

  // 检查该文件是否已有内容
  const existingContent = graphsData.value.get(currentFileId.value)
  if (existingContent) {
    // 如果有，直接加载
    importGraph(graph.value as unknown as LGraph, existingContent)
    graphCanvas.value.draw(true, true)
    return
  }

  // 如果没有现有内容，且本地存储有保存的图形，则加载它
  if (hasSavedGraph()) {
    try {
      // 检查是否是首次加载（刷新页面后的第一次加载）
      const isFirstLoad = graphsData.value.size === 0 ||
        (graphsData.value.size === 1 && !graphsData.value.get(currentFileId.value));

      const success = loadGraphFromLocalStorage(graph.value as unknown as LGraph)
      if (success && graphCanvas.value) {
        graphCanvas.value.draw(true, true)

        // 只有在首次加载时，才保存到当前文件
        // 这样可以避免首次加载时覆盖已有的文件
        if (isFirstLoad) {
          saveGraphToFile(currentFileId.value)
        }
      }
    } catch (error) {
      console.error('加载本地存储的图形失败:', error)
    }
  }
}

// 处理键盘快捷键
function handleKeyDown(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault()
    saveCurrentGraph()
  }
}

// 保存当前图形
function saveCurrentGraph() {
  if (!graph.value || !currentFileId.value) return

  // 保存当前图形到对应文件
  const success = saveGraphToFile(currentFileId.value)

  // 同时保存到本地存储（兼容旧版）
  saveGraphToLocalStorage(graph.value as unknown as LGraph)

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

// 导出当前文件
function exportToFile(filename: string) {
  if (!graph.value) return

  try {
    const jsonData = exportGraph(graph.value as unknown as LGraph)

    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `${filename || 'graph'}.json`
    a.click()

    URL.revokeObjectURL(url)

    showNotification('图形导出成功')
  } catch (error) {
    console.error('导出图形失败:', error)
    showNotification('导出失败', 'error')
  }
}

// 导入文件
function importFromFile() {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

// 处理文件选择
async function handleFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files || !input.files[0] || !graph.value) return

  const file = input.files[0]
  const reader = new FileReader()

  reader.onload = async (e) => {
    try {
      const jsonData = e.target?.result as string
      if (!jsonData) throw new Error('无法读取文件')

      // 导入到当前图形
      const success = await importGraph(graph.value as unknown as LGraph, jsonData)

      if (success) {
        // 保存到当前文件
        saveGraphToFile(currentFileId.value)

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
      showNotification('导入失败，文件格式错误', 'error')
    }
  }

  reader.readAsText(file)
}

// 处理窗口大小改变
function handleResize() {
  if (!graphCanvas.value) return

  const canvas = document.getElementById('mycanvas') as HTMLCanvasElement
  const container = document.getElementById('canvas-container')

  if (canvas && container && graphCanvas.value) {
    canvas.width = container.clientWidth
    canvas.height = container.clientHeight

    resizeCanvas(canvas, container, graphCanvas.value as unknown as LGraphCanvas)

    if (graph.value) {
      graphCanvas.value.draw(true, true)
    }
  }
}

// 启动图形执行
function startGraph() {
  if (!graph.value || isRunning.value) return

  graph.value.start()
  isRunning.value = true
}

// 停止图形执行
function stopGraph() {
  if (!graph.value || !isRunning.value) return

  graph.value.stop()
  isRunning.value = false
}

// 处理节点双击
function handleNodeDblClick(node: LGraphNode) {
  selectedNode.value = node
  showNodeDetails.value = true
}

// 关闭节点详情
function closeNodeDetails() {
  showNodeDetails.value = false
  selectedNode.value = null
}

// 更新节点属性
function handleNodeUpdate(node: LGraphNode, properties: Record<string, unknown>) {
  if (!node) return

  Object.assign(node.properties, properties)

  if (graphCanvas.value) {
    graphCanvas.value.draw(true, true)
  }
}

// 打开节点管理器
function openNodeManager() {
  showNodeManager.value = true
}

// 关闭节点管理器
function closeNodeManager() {
  showNodeManager.value = false
}

// 处理节点导入
function handleNodeImported(count: number) {
  showNotification(`已成功导入 ${count} 个节点`, 'success')

  // 刷新画布
  if (graphCanvas.value) {
    graphCanvas.value.draw(true, true)
  }
}

// 处理节点删除
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
    const newNode = LiteGraph.createNode(nodeInfo.type) as LGraphNode;

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
  isDraggingNode.value = true;
  draggedNodeInfo.value = nodeInfo;

  // 添加特殊样式到画布
  const canvasContainer = document.getElementById('canvas-container');
  if (canvasContainer) {
    canvasContainer.classList.add('drag-target');

    // 设置节点名称CSS变量
    const nodeName = nodeInfo.className || '节点';
    canvasContainer.style.setProperty('--drag-node-name', `"放置${nodeName}到此处"`);
  }
}

// 处理节点结束拖拽
function handleNodeDragEnd() {
  isDraggingNode.value = false;
  draggedNodeInfo.value = null;

  // 移除特殊样式
  const canvasContainer = document.getElementById('canvas-container');
  if (canvasContainer) {
    canvasContainer.classList.remove('drag-target');
  }
}

// 处理画布拖拽悬停
function handleDragOver(event: DragEvent) {
  event.preventDefault();

  // 只在拖拽节点时显示指示器
  if (!isDraggingNode.value && (!event.dataTransfer || !event.dataTransfer.types.includes('application/node'))) {
    return;
  }

  // 获取容器元素
  const container = document.getElementById('canvas-container');
  if (!container) return;

  // 添加拖拽目标类
  if (!container.classList.contains('drag-target')) {
    container.classList.add('drag-target');
  }

  // 计算拖拽指示器位置
  const rect = container.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // 更新CSS变量以设置指示器位置
  container.style.setProperty('--drag-indicator-x', `${x}px`);
  container.style.setProperty('--drag-indicator-y', `${y}px`);

  // 更新拖拽指示器文本
  const nodeName = draggedNodeInfo.value ? draggedNodeInfo.value.className : '节点';
  container.style.setProperty('--drag-node-name', `"放置${nodeName}到此处"`);
}

// 处理画布拖拽离开
function handleDragLeave(event: DragEvent) {
  // 只有当离开事件是容器本身，而不是子元素时，才移除类
  if (event.currentTarget === event.target) {
    const container = document.getElementById('canvas-container');
    if (container) {
      container.classList.remove('drag-target');
    }
  }
}

// 处理画布拖拽放置
function handleCanvasDrop(event: DragEvent) {
  // 确保有节点被拖拽且图形实例存在
  if (!isDraggingNode.value || !draggedNodeInfo.value || !graph.value) return;

  try {
    const nodeInfo = draggedNodeInfo.value;

    // 从dataTransfer尝试获取数据（以防直接拖拽）
    if (event.dataTransfer) {
      const jsonData = event.dataTransfer.getData('application/node');
      if (jsonData) {
        try {
          const parsedData = JSON.parse(jsonData);
          if (parsedData && parsedData.type) {
            nodeInfo.type = parsedData.type;
            nodeInfo.className = parsedData.className;
            nodeInfo.category = parsedData.category;
          }
        } catch (e) {
          console.error('解析拖拽数据失败:', e);
        }
      }
    }

    // 使用LiteGraph的createNode方法创建节点
    const newNode = LiteGraph.createNode(nodeInfo.type) as LGraphNode;

    if (!newNode) {
      showNotification(`无法创建节点: ${nodeInfo.className}`, 'error');
      return;
    }

    // 设置节点位置在鼠标放置位置
    if (graphCanvas.value) {
      // 获取画布偏移和缩放
      const offset = graphCanvas.value.ds.offset;
      const scale = graphCanvas.value.ds.scale;

      // 获取鼠标相对于画布的位置
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // 转换为画布坐标系中的位置
      const canvasX = (x - offset[0]) / scale;
      const canvasY = (y - offset[1]) / scale;

      // 设置节点位置
      newNode.pos = [canvasX, canvasY];
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
  } finally {
    // 重置拖拽状态
    isDraggingNode.value = false;
    draggedNodeInfo.value = null;

    // 移除拖拽目标类
    const container = document.getElementById('canvas-container');
    if (container) {
      container.classList.remove('drag-target');
    }
  }
}

// 关闭右键菜单
function closeContextMenu() {
  // Context menu closing logic (if any)
}

// 从本地存储加载所有文件的图形数据
function loadSavedGraphsData() {
  try {
    const boxnFiles = localStorage.getItem('boxn_files')
    if (boxnFiles) {
      const filesData = JSON.parse(boxnFiles)

      // 遍历所有文件并加载它们的内容到内存中
      for (const file of filesData) {
        if (file.id && file.content) {
          graphsData.value.set(file.id, file.content)
        }
      }

      console.log(`已从本地存储加载 ${graphsData.value.size} 个文件内容`)
    }
  } catch (error) {
    console.error('加载文件内容失败:', error)
  }
}
</script>

<style scoped>
#canvas-container {
  position: absolute;
  top: 50px;
  /* 给顶部工具栏预留空间 */
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

@media (max-width: 640px) {
  #canvas-container {
    top: 110px;
    /* 在移动设备上为更高的工具栏预留更多空间 */
  }
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
  z-index: 10000;
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
  z-index: 30000;
  animation: fadeIn 0.3s ease;
}

.notification.success {
  background-color: rgba(46, 125, 50, 0.9);
}

.notification.error {
  background-color: rgba(198, 40, 40, 0.9);
}

/* 添加画布拖拽样式 */
#canvas-container.drag-target {
  position: relative;
}

#canvas-container.drag-target::after {
  content: var(--drag-node-name, '放置节点到此处');
  position: absolute;
  top: var(--drag-indicator-y, 50%);
  left: var(--drag-indicator-x, 50%);
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

#canvas-container.drag-target::before {
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
