/**
 * 节点配置和注册管理
 * 用于统一管理LiteGraph节点的注册过程
 */

import LiteGraph from '../services/liteGraphCfg'
import { LGraphNode } from 'litegraph.js'

/**
 * 节点注册函数，用于统一管理注册过程
 * @param type 节点类型标识
 * @param nodeClass 节点类
 */
export function register(type: string, nodeClass: typeof LGraphNode): void {
  // 确保注册前未注册
  if (!LiteGraph.registered_node_types[type]) {
    LiteGraph.registerNodeType(type, nodeClass)
    console.log(`Node registered: ${type}`)
  } else {
    console.warn(`Node type ${type} already registered, skipping.`)
  }
}

/**
 * 创建自动注册节点的装饰器
 * @param type 节点类型标识
 */
export function NodeRegister(type: string) {
  return function (target: typeof LGraphNode) {
    register(type, target)
    return target
  }
}
