/**
 * 数学节点注册
 */

import LiteGraph from '../../services/liteGraphCfg'
import { AddNode } from './AddNode'

// 注册加法节点
LiteGraph.registerNodeType('math/add', AddNode)
