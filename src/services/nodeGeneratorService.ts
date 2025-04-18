/**
 * 节点生成服务
 * 提供AI生成的节点代码管理功能
 */
import { register } from '../nodes/nodeCfg'
import LiteGraph from './liteGraphCfg'
import { LGraphNode } from 'litegraph.js'

// 存储自定义节点的代码和元数据
interface NodeDefinition {
  className: string
  category: string
  code: string
  nodeType: string
  createdAt: number
}

// 存储所有已注册的自定义节点
const customNodes: Map<string, NodeDefinition> = new Map()

// 节点导出元数据的键名
const CUSTOM_NODES_METADATA_KEY = '_customNodeDefinitions'

/**
 * 构建节点路径
 * @param prefix 前缀（如import/）
 * @param fileName 文件名
 * @param nodePath 节点路径
 * @returns 处理后的完整节点路径
 */
function buildNodePath(prefix: string, fileName: string, nodePath: string): string {
  // 提取nodePath的第一段作为可能的类别
  const parts = nodePath.split('/')
  const possibleCategory = parts[0]

  // 如果文件名与类别重复，避免添加重复路径段
  if (fileName === possibleCategory) {
    return `${prefix}${nodePath}`
  } else {
    return `${prefix}${fileName}/${nodePath}`
  }
}

/**
 * 创建新的节点文件
 * @param className 节点类名
 * @param nodeType 节点类型路径
 * @param code 节点代码
 * @param isAIGenerated 是否为AI生成的代码
 * @param fileName 文件名(不含扩展名)，用于区分不同插件
 * @returns 创建是否成功
 */
export async function createNodeFile(
  className: string,
  nodeType: string,
  code: string,
  isAIGenerated: boolean = false,
  fileName: string = '',
): Promise<boolean> {
  try {
    // 清理和处理文件名
    const cleanFileName = fileName
      ? fileName.replace(/\.[^/.]+$/, '') // 移除扩展名
      : nodeType.includes('/')
        ? nodeType.split('/')[0]
        : 'plugin'

    // 在内存中评估代码
    const result = evaluateNodeCode(code)
    if (!result) return false

    // 定义通用前缀
    const prefix = 'import/'

    // 处理多个节点类
    if (typeof result === 'object' && !Array.isArray(result) && !(result instanceof Function)) {
      return registerMultipleNodes(result, nodeType, code, prefix, cleanFileName, isAIGenerated)
    }

    // 处理单个节点类
    return registerSingleNode(
      result,
      className,
      nodeType,
      code,
      prefix,
      cleanFileName,
      isAIGenerated,
    )
  } catch (error) {
    console.error('创建节点文件失败:', error)
    return false
  }
}

/**
 * 注册多个节点类
 */
function registerMultipleNodes(
  nodeClasses: Record<string, unknown>,
  nodeType: string,
  code: string,
  prefix: string,
  cleanFileName: string,
  isAIGenerated: boolean,
): boolean {
  let successCount = 0
  const classNames = Object.keys(nodeClasses)

  for (const name of classNames) {
    const NodeClass = nodeClasses[name] as typeof LGraphNode & { _originalPath?: string }
    if (!NodeClass) continue

    // 创建节点类型路径
    let classNodeType: string

    // 如果在代码中找到了registerNodeType指定的路径，优先使用它
    if (NodeClass._originalPath) {
      classNodeType = `${prefix}${NodeClass._originalPath}`
    }
    // 简单节点名，没有路径结构
    else if (!nodeType.includes('/')) {
      classNodeType = `${prefix}${cleanFileName}/${name}`
    }
    // 已有前缀的情况
    else if (nodeType.startsWith('import/')) {
      classNodeType = nodeType

      // 如果类名不同，替换最后一部分
      if (nodeType.split('/').pop() !== name) {
        const parts = nodeType.split('/')
        parts[parts.length - 1] = name
        classNodeType = parts.join('/')
      }
    }
    // 其他情况，添加前缀和文件名
    else {
      // 处理节点类型路径
      classNodeType = buildNodePath(prefix, cleanFileName, nodeType)

      // 如果nodeType包含类名，替换最后部分为正确的类名
      if (nodeType.includes('/') && nodeType.split('/').pop() !== name) {
        const parts = nodeType.split('/')
        parts[parts.length - 1] = name
        classNodeType = buildNodePath(prefix, cleanFileName, parts.join('/'))
      }
    }

    // 注册节点
    register(classNodeType, NodeClass)

    // 提取分类并保存节点定义
    const category = extractCategory(classNodeType, isAIGenerated)

    const nodeDefinition: NodeDefinition = {
      className: name,
      category,
      code,
      nodeType: classNodeType,
      createdAt: Date.now(),
    }

    customNodes.set(classNodeType, nodeDefinition)
    console.log(`节点 ${name} 已成功注册为 ${classNodeType}`)
    successCount++
  }

  return successCount > 0
}

/**
 * 注册单个节点类
 */
function registerSingleNode(
  NodeClass: typeof LGraphNode & { _originalPath?: string },
  className: string,
  nodeType: string,
  code: string,
  prefix: string,
  cleanFileName: string,
  isAIGenerated: boolean,
): boolean {
  if (!NodeClass) return false

  // 创建节点类型路径
  let finalNodeType: string

  // 如果在代码中找到了registerNodeType指定的路径，优先使用它
  if (NodeClass._originalPath) {
    finalNodeType = `${prefix}${NodeClass._originalPath}`
  }
  // 简单节点名，没有路径结构
  else if (!nodeType.includes('/')) {
    finalNodeType = `${prefix}${cleanFileName}/${className}`
  }
  // 已有前缀的情况
  else if (nodeType.startsWith('import/')) {
    finalNodeType = nodeType
  }
  // 其他情况，添加前缀和文件名
  else {
    finalNodeType = buildNodePath(prefix, cleanFileName, nodeType)
  }
  // 注册节点
  register(finalNodeType, NodeClass)

  // 提取分类并保存节点定义
  const category = extractCategory(finalNodeType, isAIGenerated)

  const nodeDefinition: NodeDefinition = {
    className,
    category,
    code,
    nodeType: finalNodeType,
    createdAt: Date.now(),
  }

  customNodes.set(finalNodeType, nodeDefinition)
  console.log(`节点 ${className} 已成功注册为 ${finalNodeType}`)
  return true
}

/**
 * 从节点路径中提取分类
 */
function extractCategory(nodePath: string, isAIGenerated: boolean): string {
  const parts = nodePath.split('/')

  // 默认分类
  let category = 'custom'

  // 尝试从路径中提取有意义的分类
  if (parts.length > 2) {
    // 跳过import/或ai/前缀和文件名
    const categoryIndex = parts[0] === 'import' || parts[0] === 'ai' ? 2 : 1

    // 如果是AI生成的，使用特殊分类
    if (isAIGenerated) {
      category = 'ai-generated'
    } else if (categoryIndex < parts.length - 1) {
      // 使用路径中的第三段作为分类
      category = parts[categoryIndex]
    }
  }

  return category
}

/**
 * 在内存中评估节点代码
 * @param code 节点代码
 * @returns 节点类
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function evaluateNodeCode(code: string): any {
  try {
    let jsCode = code

    // 处理不同的导入语句格式
    // 1 移除import语句
    jsCode = jsCode.replace(/import\s+.*?from\s+(['"]).*?\1;?/g, '// 导入已由系统处理')

    // 移除export语句，这可能导致"Unexpected token 'export'"错误
    jsCode = jsCode.replace(/export\s+(default\s+)?/g, '')
    jsCode = jsCode.replace(/export\s+\{.*?\};?/g, '// 导出已由系统处理')

    // 2 处理require语句
    jsCode = jsCode.replace(
      /const\s+\w+\s*=\s*require\s*\(\s*['"]litegraph\.js['"]\s*\)\s*;?/g,
      '// require已由系统处理',
    )

    // 3 处理TypeScript特有语法 - 适配TS代码
    // 移除类型声明（如 ": void", ": number"）
    jsCode = jsCode.replace(/:\s*([A-Za-z<>[\]]+)(\s*[,)])/g, '$2')

    // 移除方法参数的类型声明
    jsCode = jsCode.replace(/(\(|\,)\s*([a-zA-Z0-9_]+)\s*:\s*[A-Za-z<>[\]]+/g, '$1 $2')

    // 移除泛型参数（如 getInputData<number>）
    jsCode = jsCode.replace(/([a-zA-Z0-9_]+)<[^>]+>/g, '$1')

    // 将litegraph的引用统一处理
    jsCode = jsCode.replace(/litegraph\.LGraphNode/g, 'LGraphNode')
    jsCode = jsCode.replace(/litegraph\.LiteGraph/g, 'LiteGraph')

    // 收集节点注册信息同时移除registerNodeType调用
    const nodeRegistrations = []
    // 支持单引号、双引号和不同的空白格式
    const registerRegex =
      /LiteGraph\.registerNodeType\s*\(\s*(['"])(.*?)\1\s*,\s*([a-zA-Z0-9_]+)\s*\)\s*;?/g
    let registerMatch

    while ((registerMatch = registerRegex.exec(code)) !== null) {
      nodeRegistrations.push({
        type: registerMatch[2],
        className: registerMatch[3],
      })
    }

    // 移除所有注册调用
    jsCode = jsCode.replace(registerRegex, '// 节点注册已由系统处理')

    // 提取类名，用于返回类定义
    const classDefinitions = []
    const classRegex = /class\s+([a-zA-Z0-9_]+)(?:\s+extends\s+(?:[a-zA-Z0-9_\.]+))?\s*\{/g
    let classMatch

    while ((classMatch = classRegex.exec(code)) !== null) {
      classDefinitions.push(classMatch[1])
    }

    if (classDefinitions.length === 0) {
      throw new Error('无法在代码中找到任何类定义')
    }

    // 输出检测到的节点和类信息
    console.log('检测到的类:', classDefinitions)
    console.log('检测到的节点注册:', nodeRegistrations)

    // 检测是否有类没有被注册
    for (const className of classDefinitions) {
      if (!nodeRegistrations.some((reg) => reg.className === className)) {
        console.warn(`警告: 类 ${className} 在代码中定义但未被注册为节点`)
      }
    }

    // 处理从registerNodeType中获取的路径信息
    const pathMap = new Map<string, string>()
    for (const reg of nodeRegistrations) {
      pathMap.set(reg.className, reg.type)
    }

    // 创建函数体，执行代码并返回所有类的字典
    const functionBody = `
      ${jsCode}
      return { ${classDefinitions.join(', ')} };
    `

    // 打印转换后的代码（调试用）
    console.debug('转换后的代码:', jsCode)

    // 直接使用Function构造器执行代码
    const nodeClasses = Function(
      'LGraphNode',
      'LiteGraph',
      'console',
      'setTimeout',
      'clearTimeout',
      'setInterval',
      'clearInterval',
      'Math',
      functionBody,
    )(LGraphNode, LiteGraph, console, setTimeout, clearTimeout, setInterval, clearInterval, Math)

    // 验证是否成功获取所有类
    if (!nodeClasses || Object.keys(nodeClasses).length === 0) {
      throw new Error('无法从代码中获取任何节点类')
    }

    // 如果只有一个节点定义，直接返回它，并附带原始路径信息
    if (classDefinitions.length === 1) {
      const className = classDefinitions[0]
      const NodeClass = nodeClasses[className]

      // 添加原始路径信息到节点类中
      if (pathMap.has(className)) {
        NodeClass._originalPath = pathMap.get(className)
      }

      return NodeClass
    }

    // 如果有多个节点定义，为每个类添加原始路径信息
    for (const className of classDefinitions) {
      if (nodeClasses[className] && pathMap.has(className)) {
        nodeClasses[className]._originalPath = pathMap.get(className)
      }
    }

    // 返回所有节点类的映射
    return nodeClasses
  } catch (error) {
    console.error('评估节点代码失败:', error)
    return null
  }
}

/**
 * 获取可用的节点分类
 * @returns 节点分类列表
 */
export function getNodeCategories(): string[] {
  return ['math', 'logic', 'input', 'output', 'custom', 'ai-generated']
}

/**
 * 检查节点名称是否有效
 * @param name 节点名称
 * @returns 是否有效
 */
export function isValidNodeName(name: string): boolean {
  return /^[A-Z][a-zA-Z0-9]*Node$/.test(name)
}

/**
 * 获取所有自定义节点
 * @returns 自定义节点定义列表
 */
export function getAllCustomNodes(): NodeDefinition[] {
  return Array.from(customNodes.values())
}

/**
 * 将自定义节点添加到导出的图形数据中
 * @param graphData 导出的图形数据
 */
export function addCustomNodesToExport(graphData: Record<string, unknown>): void {
  if (!graphData) return

  const customNodeDefinitions = getAllCustomNodes()
  if (customNodeDefinitions.length > 0) {
    graphData[CUSTOM_NODES_METADATA_KEY] = customNodeDefinitions
  }
}

/**
 * 从导入的图形数据中恢复自定义节点
 * @param graphData 导入的图形数据
 * @returns 成功恢复的节点数量
 */
export async function restoreCustomNodesFromImport(
  graphData: Record<string, unknown>,
): Promise<number> {
  if (!graphData || !graphData[CUSTOM_NODES_METADATA_KEY]) {
    return 0
  }

  const nodeDefinitions = graphData[CUSTOM_NODES_METADATA_KEY] as NodeDefinition[]
  if (!Array.isArray(nodeDefinitions) || nodeDefinitions.length === 0) {
    return 0
  }

  let restoredCount = 0

  // 尝试注册每个节点
  for (const nodeDef of nodeDefinitions) {
    try {
      if (!nodeDef.className || !nodeDef.category || !nodeDef.code || !nodeDef.nodeType) {
        continue
      }

      // 如果节点已经注册，跳过
      if (customNodes.has(nodeDef.nodeType)) {
        continue
      }

      // 解析节点类型
      const { isAIGenerated, fileName, originalPath } = parseNodeType(nodeDef.nodeType)

      // 使用原始路径进行节点注册
      const success = await createNodeFile(
        nodeDef.className,
        originalPath,
        nodeDef.code,
        isAIGenerated,
        fileName,
      )

      if (success) {
        restoredCount++
      }
    } catch (error) {
      console.error(`恢复节点 ${nodeDef.className} 失败:`, error)
    }
  }

  return restoredCount
}

/**
 * 解析节点类型路径
 */
function parseNodeType(nodeType: string): {
  isAIGenerated: boolean
  fileName: string
  originalPath: string
} {
  let isAIGenerated = false
  let fileName = 'plugin'
  let originalPath = nodeType

  // 检查是否以import/或ai/开头
  if (nodeType.startsWith('import/') || nodeType.startsWith('ai/')) {
    isAIGenerated = nodeType.startsWith('ai/')

    // 分割路径，提取文件名
    const parts = nodeType.split('/')
    if (parts.length >= 3) {
      // 至少: import/App/className
      fileName = parts[1]
      // 重建原始路径 (不包括import/或ai/前缀和文件名)
      originalPath = parts.slice(2).join('/')

      // 检查文件名是否与路径第一段重复
      const pathFirstPart = parts[2] // 第一段路径（可能是类别）
      if (fileName === pathFirstPart) {
        // 如果重复了，直接使用原始路径，避免重复
        originalPath = parts.slice(2).join('/')
      }
    }
  }

  return { isAIGenerated, fileName, originalPath }
}

/**
 * 删除自定义节点
 * @param nodeType 节点类型路径
 * @returns 是否成功删除
 */
export function deleteCustomNode(nodeType: string): boolean {
  try {
    // 检查节点是否存在
    if (!customNodes.has(nodeType)) {
      console.warn(`节点 ${nodeType} 不存在，无法删除`)
      return false
    }

    // 获取节点定义
    const nodeDef = customNodes.get(nodeType)
    if (!nodeDef) return false

    // 从映射中移除节点
    customNodes.delete(nodeType)
    console.log(`节点 ${nodeDef.className} (${nodeType}) 已成功删除`)

    return true
  } catch (error) {
    console.error(`删除节点 ${nodeType} 失败:`, error)
    return false
  }
}
