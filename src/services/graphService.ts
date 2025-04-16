/**
 * LiteGraph图形服务
 * 提供图形初始化、画布操作和事件处理功能
 */
import { LGraph, LGraphCanvas, LGraphNode } from 'litegraph.js'
import liteGraphConfig from './liteGraphCfg'

// 本地存储键
const GRAPH_STORAGE_KEY = 'boxn_graph_data'

// 扩展LiteGraph类型以适应库的实际属性
interface LGraphExtended extends LGraph {
  execution_interval?: number
  onPlayEvent?: (status: number) => void
}

// 用于序列化/反序列化的类型
interface SerializableGraph {
  serialize: () => Record<string, unknown>
  configure: (data: Record<string, unknown>) => void
}

/**
 * 创建一个新的LiteGraph图
 * @returns 创建的图形实例
 */
export function createGraph(): LGraph {
  try {
    // 确保配置已应用
    if (liteGraphConfig) {
      console.log('LiteGraph configuration applied')
    }

    const graph = new LGraph()

    // 设置图形配置 (使用类型断言来避免类型错误)
    const config = graph.config as Record<string, unknown>
    config.live_mode = true
    config.shadows = true

    return graph
  } catch (error) {
    console.error('Failed to create graph:', error)
    throw new Error('无法创建图形实例')
  }
}

/**
 * 初始化LiteGraph画布
 * @param canvasId 画布元素选择器
 * @param graph 图形实例
 * @returns 初始化后的画布实例
 */
export function initCanvas(canvasId: string, graph: LGraph): LGraphCanvas | null {
  try {
    if (!graph) {
      throw new Error('未提供有效的图形实例')
    }

    const graphCanvas = new LGraphCanvas(canvasId, graph) as LGraphCanvas

    // 添加画布配置
    graphCanvas.allow_searchbox = true
    graphCanvas.allow_dragnodes = true
    graphCanvas.zoom_modify_alpha = true // 缩放时调整透明度

    return graphCanvas
  } catch (error) {
    console.error('Failed to initialize canvas:', error)
    return null
  }
}

/**
 * 调整画布大小
 * @param canvas HTML画布元素
 * @param container 容器元素
 * @param graphCanvas LiteGraph画布实例
 */
export function resizeCanvas(
  canvas: HTMLCanvasElement,
  container: HTMLElement,
  graphCanvas: LGraphCanvas,
): void {
  if (!canvas || !container || !graphCanvas) {
    console.error('Missing required parameters for resizeCanvas')
    return
  }

  try {
    canvas.width = container.clientWidth
    canvas.height = container.clientHeight
    graphCanvas.resize(canvas.width, canvas.height)
  } catch (error) {
    console.error('Error resizing canvas:', error)
  }
}

/**
 * 导出图形序列化数据
 * @param graph 图形实例
 * @returns 序列化的JSON字符串
 */
export function exportGraph(graph: LGraph): string {
  if (!graph) return ''

  try {
    const data = graph.serialize()
    return JSON.stringify(data, null, 2)
  } catch (error) {
    console.error('Error exporting graph:', error)
    return ''
  }
}

/**
 * 导入图形序列化数据
 * @param graph 图形实例
 * @param jsonData 序列化的JSON字符串
 * @returns 导入是否成功
 */
export function importGraph(graph: LGraph, jsonData: string): boolean {
  if (!graph) return false

  try {
    const data = JSON.parse(jsonData)
    graph.configure(data)
    return true
  } catch (error) {
    console.error('Error importing graph:', error)
    return false
  }
}

/**
 * 保存图形到本地存储
 * @param graph 图形实例
 * @returns 保存是否成功
 */
export function saveGraphToLocalStorage(graph: SerializableGraph): boolean {
  if (!graph) return false

  try {
    const graphData = graph.serialize()
    const graphJson = JSON.stringify(graphData)
    localStorage.setItem(GRAPH_STORAGE_KEY, graphJson)
    return true
  } catch (error) {
    console.error('Error saving graph to local storage:', error)
    return false
  }
}

/**
 * 从本地存储加载图形
 * @param graph 图形实例
 * @returns 加载是否成功
 */
export function loadGraphFromLocalStorage(graph: SerializableGraph): boolean {
  if (!graph) return false

  try {
    const graphJson = localStorage.getItem(GRAPH_STORAGE_KEY)
    if (!graphJson) {
      console.info('No saved graph found in local storage')
      return false
    }

    const graphData = JSON.parse(graphJson)
    graph.configure(graphData)
    return true
  } catch (error) {
    console.error('Error loading graph from local storage:', error)
    return false
  }
}

/**
 * 检查本地存储中是否有保存的图形
 * @returns 是否存在保存的图形
 */
export function hasSavedGraph(): boolean {
  return !!localStorage.getItem(GRAPH_STORAGE_KEY)
}

/**
 * 设置节点双击事件处理
 * @param graphCanvas LiteGraph画布实例
 * @param onNodeDblClick 节点双击回调函数
 */
export function setupNodeDblClickHandler(
  graphCanvas: LGraphCanvas,
  onNodeDblClick: (node: LGraphNode) => void,
): void {
  // 保存原始的双击处理函数
  const originalDblClick = graphCanvas.onNodeDblClicked

  // 覆盖双击处理函数
  graphCanvas.onNodeDblClicked = function (node: LGraphNode) {
    // 调用自定义处理函数
    onNodeDblClick(node)

    // 如果原来有处理函数，也调用它
    if (originalDblClick) {
      originalDblClick.call(this, node)
    }
  }
}

/**
 * 清空图形中的所有节点
 * @param graph 图形实例
 */
export function clearGraph(graph: LGraph): void {
  if (!graph) return

  graph.clear()
  // 触发图形重绘
  graph.setDirtyCanvas(true, true)
}

/**
 * 更改图形执行速度
 * @param graph 图形实例
 * @param fps 每秒执行帧数
 */
export function setGraphExecutionSpeed(graph: LGraph, fps: number): void {
  if (!graph) return

  // 限制FPS在合理范围内
  const safeFps = Math.max(1, Math.min(60, fps))

  // 使用类型断言访问execution_interval
  const extendedGraph = graph as LGraphExtended

  // 设置图形的执行间隔（毫秒）
  if (safeFps > 0) {
    extendedGraph.execution_interval = 1000 / safeFps
  } else {
    extendedGraph.execution_interval = 1000 // 默认为1秒
  }
}

/**
 * 检查图形是否正在运行
 * @param graph 图形实例
 * @returns 图形是否在运行中
 */
export function isGraphRunning(graph: LGraph): boolean {
  if (!graph) return false

  // LGraph.STATUS_RUNNING = 1 (运行状态)
  return graph.status === 1
}

/**
 * 添加图形执行状态变化监听
 * @param graph 图形实例
 * @param callback 状态变化回调函数
 */
export function addGraphStatusListener(graph: LGraph, callback: (status: number) => void): void {
  if (!graph) return

  // 使用类型断言访问onPlayEvent
  const extendedGraph = graph as LGraphExtended

  // 使用事件系统添加状态变化监听
  extendedGraph.onPlayEvent = function (status: number) {
    // 调用自定义回调
    callback(status)
  }
}
