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
    // 如果没有提供文件名，尝试从nodeType中提取或使用默认名称
    const cleanFileName = fileName
      ? fileName.replace(/\.[^/.]+$/, '') // 移除扩展名
      : nodeType.includes('/')
        ? nodeType.split('/')[0]
        : 'plugin'

    // 在内存中评估代码
    const result = evaluateNodeCode(code)

    // 检查是否返回了多个节点类
    if (
      result &&
      typeof result === 'object' &&
      !Array.isArray(result) &&
      !(result instanceof Function)
    ) {
      // 处理多个节点类的情况
      const nodeClasses = result as Record<string, unknown>
      let successCount = 0
      const classNames = Object.keys(nodeClasses)

      for (const name of classNames) {
        const NodeClass = nodeClasses[name] as typeof LGraphNode & { _originalPath?: string }
        if (NodeClass) {
          // 创建适当的节点类型路径 (如果没有提供完整路径)
          let classNodeType = nodeType

          // 如果在代码中找到了registerNodeType指定的路径，优先使用它
          const originalPath = NodeClass._originalPath
          if (originalPath) {
            // 根据是否是AI生成决定前缀，使用cleanFileName作为文件名
            const prefix = isAIGenerated ? 'ai/' : 'import/'
            // 不在原始路径前加文件名，因为原始路径已经包含完整路径结构
            classNodeType = `${prefix}${cleanFileName}/${originalPath}`
          } else if (!nodeType.includes('/')) {
            // 简单节点名，没有路径结构
            const prefix = isAIGenerated ? 'ai/' : 'import/'
            classNodeType = `${prefix}${cleanFileName}/${name}`
          } else if (nodeType.startsWith('import/') || nodeType.startsWith('ai/')) {
            // 已经有前缀的情况，不再添加
            classNodeType = nodeType
            // 如果是类名不同的情况，替换最后一部分
            if (nodeType.split('/').pop() !== name) {
              const parts = nodeType.split('/')
              parts[parts.length - 1] = name
              classNodeType = parts.join('/')
            }
          } else {
            // 其他情况，添加前缀和文件名
            const prefix = isAIGenerated ? 'ai/' : 'import/'
            classNodeType = `${prefix}${cleanFileName}/${nodeType}`

            // 如果nodeType包含类名，替换最后部分为正确的类名
            if (nodeType.includes('/') && nodeType.split('/').pop() !== name) {
              const parts = nodeType.split('/')
              parts[parts.length - 1] = name
              classNodeType = `${prefix}${cleanFileName}/${parts.join('/')}`
            }
          }

          register(classNodeType, NodeClass)

          // 提取分类信息
          let category = 'custom'
          const parts = classNodeType.split('/')

          // 尝试从路径中提取有意义的分类
          if (parts.length > 2) {
            // 至少需要有prefix/filename/category/nodename
            // 跳过import/或ai/前缀和文件名
            const categoryIndex = parts[0] === 'import' || parts[0] === 'ai' ? 2 : 1

            // 如果是AI生成的，使用特殊分类
            if (isAIGenerated) {
              category = 'ai-generated'
            } else if (categoryIndex < parts.length - 1) {
              // 使用路径中的第三段作为分类（跳过前缀和文件名后）
              category = parts[categoryIndex]
            }
          }

          // 保存节点定义
          const nodeDefinition: NodeDefinition = {
            className: name,
            category,
            code, // 注意：所有类共享相同的代码块
            nodeType: classNodeType,
            createdAt: Date.now(),
          }
          customNodes.set(classNodeType, nodeDefinition)
          console.log(`节点 ${name} 已成功注册为 ${classNodeType}`)
          successCount++
        }
      }

      return successCount > 0
    }

    // 处理单个节点类的情况
    const NodeClass = result as (typeof LGraphNode & { _originalPath?: string }) | null

    // 注册节点
    if (NodeClass) {
      // 使用提供的节点类型或使用默认格式
      let finalNodeType = nodeType

      // 如果在代码中找到了registerNodeType指定的路径，优先使用它
      const originalPath = NodeClass._originalPath
      if (originalPath) {
        // 根据是否是AI生成决定前缀，使用cleanFileName作为文件名
        const prefix = isAIGenerated ? 'ai/' : 'import/'
        finalNodeType = `${prefix}${cleanFileName}/${originalPath}`
      } else if (!nodeType.includes('/')) {
        // 简单节点名，没有路径结构
        const prefix = isAIGenerated ? 'ai/' : 'import/'
        finalNodeType = `${prefix}${cleanFileName}/${className}`
      } else if (nodeType.startsWith('import/') || nodeType.startsWith('ai/')) {
        // 已经有前缀的情况，不再添加
        finalNodeType = nodeType
      } else {
        // 其他情况，添加前缀和文件名
        const prefix = isAIGenerated ? 'ai/' : 'import/'
        finalNodeType = `${prefix}${cleanFileName}/${nodeType}`
      }

      register(finalNodeType, NodeClass)

      // 提取分类信息
      let category = 'custom'
      const parts = finalNodeType.split('/')

      // 尝试从路径中提取有意义的分类
      if (parts.length > 2) {
        // 至少需要有prefix/filename/category/nodename
        // 跳过import/或ai/前缀和文件名
        const categoryIndex = parts[0] === 'import' || parts[0] === 'ai' ? 2 : 1

        // 如果是AI生成的，使用特殊分类
        if (isAIGenerated) {
          category = 'ai-generated'
        } else if (categoryIndex < parts.length - 1) {
          // 使用路径中的第三段作为分类（跳过前缀和文件名后）
          category = parts[categoryIndex]
        }
      }

      // 保存节点定义，以便后续导出和重新注册
      const nodeDefinition: NodeDefinition = {
        className,
        category,
        code,
        nodeType: finalNodeType,
        createdAt: Date.now(),
      }
      customNodes.set(finalNodeType, nodeDefinition)

      // 实际产品中，这里可以将代码保存到文件系统
      console.log(`节点 ${className} 已成功注册为 ${finalNodeType}`)
      return true
    }

    return false
  } catch (error) {
    console.error('创建节点文件失败:', error)
    return false
  }
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
    // 使用更强大的正则表达式匹配不同格式的registerNodeType调用
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

    // 处理从registerNodeType中获取的路径信息，用于后续的节点注册
    // 这样可以保持与原始注册路径的一致性
    const pathMap = new Map<string, string>()
    for (const reg of nodeRegistrations) {
      pathMap.set(reg.className, reg.type)
    }

    // 为执行准备环境变量
    // 使用已导入的LiteGraph和LGraphNode

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

    // 输出类定义以确认
    console.debug(`成功评估 ${Object.keys(nodeClasses).length} 个节点类:`, Object.keys(nodeClasses))

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
  if (!graphData) {
    return
  }

  // 将当前自定义节点添加到元数据
  const customNodeDefinitions = getAllCustomNodes()
  if (customNodeDefinitions.length > 0) {
    // 确保完整路径信息被保存
    graphData[CUSTOM_NODES_METADATA_KEY] = customNodeDefinitions.map((def) => ({
      ...def,
      // 确保使用保存的完整路径
      nodeType: def.nodeType,
    }))
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
      if (nodeDef.className && nodeDef.category && nodeDef.code && nodeDef.nodeType) {
        // 如果节点已经注册，跳过
        if (customNodes.has(nodeDef.nodeType)) {
          continue
        }

        // 解析节点类型，提取文件名和可能的原始路径
        let isAIGenerated = false
        let fileName = 'plugin' // 默认文件名
        let originalPath = nodeDef.nodeType

        // 检查是否以import/或ai/开头
        if (nodeDef.nodeType.startsWith('import/') || nodeDef.nodeType.startsWith('ai/')) {
          isAIGenerated = nodeDef.nodeType.startsWith('ai/')

          // 分割路径，提取文件名
          const parts = nodeDef.nodeType.split('/')
          if (parts.length >= 3) {
            // 至少: import/App/className
            fileName = parts[1]
            // 重建原始路径 (不包括import/或ai/前缀和文件名)
            originalPath = parts.slice(2).join('/')
          }
        }

        // 使用原始路径，并重新添加适当的前缀和文件名
        // 保存节点时使用原始nodeType确保路径一致性
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
      }
    } catch (error) {
      console.error(`恢复节点 ${nodeDef.className} 失败:`, error)
    }
  }

  return restoredCount
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

    // 注：在实际产品中，可能还需要从文件系统中删除对应的文件
    // 并且需要考虑如何处理已在图中使用的节点实例
    console.log(`节点 ${nodeDef.className} (${nodeType}) 已成功删除`)

    return true
  } catch (error) {
    console.error(`删除节点 ${nodeType} 失败:`, error)
    return false
  }
}
