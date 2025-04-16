# BoxN.js 节点编辑器

基于 Vue 3 和 LiteGraph.js 构建的可视化节点编辑工具。

## 简介

BoxN.js 是一个轻量级节点编辑器，用于创建数据流和逻辑流程图。适用于算法可视化、流程设计和数据处理场景。

## 技术栈

- Vue 3 + TypeScript
- LiteGraph.js
- Vite

## 快速开始

安装依赖：

```bash
npm install
```

开发模式：

```bash
npm run dev
```

构建项目：

```bash
npm run build
```

## 项目结构

```
src/
├── assets/        # 静态资源
├── components/    # 组件
│   ├── FloatingToolbox.vue   # 工具栏
│   ├── LiteGraphEditor.vue   # 编辑器
│   └── NodeDetailDialog.vue  # 节点详情
├── nodes/         # 节点定义
├── services/      # 服务
├── libs/          # 库封装
├── App.vue        # 主组件
└── main.ts        # 入口文件
```

## 使用方法

### 基本操作

- **创建节点**：右键点击画布选择节点
- **连接节点**：拖动输出端口到另一节点的输入端口
- **移动节点**：拖拽节点
- **删除节点**：选中后按Delete键
- **导出/导入**：使用工具栏按钮

### 快捷键

| 快捷键   | 功能      |
| -------- | --------- |
| Ctrl+Z   | 撤销      |
| Ctrl+Y   | 重做      |
| Delete   | 删除节点  |
| Ctrl+C/V | 复制/粘贴 |

## 开发指南

### 代码规范

- 使用 TypeScript 和 Vue 3 Composition API
- 组件使用 PascalCase 命名
- 服务和工具函数使用 camelCase 命名

### 创建自定义节点

1. 在 `src/nodes/` 中创建节点文件：

```typescript
export class CustomNode extends LGraphNode {
  constructor() {
    super('自定义节点')
    this.addInput('输入', 'number')
    this.addOutput('输出', 'number')
    this.properties = { value: 0 }
  }

  onExecute() {
    const input = this.getInputData(0) || 0
    this.setOutputData(0, input + this.properties.value)
  }
}
```

2. 在 `index.ts` 中注册节点：

```typescript
import LiteGraph from '../services/liteGraphCfg'
import { CustomNode } from './customNode'

LiteGraph.registerNodeType('math/custom', CustomNode)
```

## 常见问题

- **连接问题**：确保节点输入/输出类型匹配
- **性能问题**：减少节点数量，使用节点分组
