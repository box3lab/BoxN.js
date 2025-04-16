/**
 * 数学节点注册
 */

import LiteGraph from '../../services/liteGraphCfg'
import { AddNode } from './addNode'

// 注册加法节点
LiteGraph.registerNodeType('math/add', AddNode)
