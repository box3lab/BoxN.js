# BoxN.js 节点编辑器

基于 Vue 3 和 LiteGraph.js 构建的可视化节点编辑工具。

## 简介

BoxN.js 是一个强大的轻量级节点编辑器，用于创建数据流和逻辑流程图。适用于算法可视化、流程设计、数据处理以及自动化工作流场景。通过直观的可视化界面，用户可以轻松地构建复杂的数据处理流程，无需深入编写代码。

## 技术栈

- Vue 3 + TypeScript
- LiteGraph.js
- Vite
- Highlight.js (代码高亮)

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
│   └── css/       # 样式文件，包含增强的UI
├── components/    # 组件
│   ├── FloatingToolbox.vue   # 工具栏
│   ├── LiteGraphEditor.vue   # 编辑器
│   ├── NodeDetailDialog.vue  # 节点详情
│   ├── NodeManagerDialog.vue # 节点管理器
│   └── AIChatDialog.vue      # AI节点生成
├── nodes/         # 节点定义
├── services/      # 服务
│   ├── nodeGeneratorService.ts # 节点生成器服务
│   └── liteGraphCfg.ts       # LiteGraph配置
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
- **缩放画布**：鼠标滚轮或使用工具栏按钮
- **选择多个节点**：按住Shift键点选或拖拽选框

### 节点管理器

节点管理器是一个强大的工具，可以帮助您管理、导入和查看所有节点。

- **查看节点**：浏览所有已注册的节点，包括内置、自定义和导入的节点
- **筛选节点**：按类别、名称或来源筛选节点
- **查看节点代码**：检查自定义或导入节点的源代码
- **导入节点**：上传JavaScript文件导入新节点
- **预览节点**：直观地预览节点的外观和接口
- **删除节点**：删除不需要的自定义或导入节点
- **复制节点代码**：快速复制节点代码以便修改或分享

#### 节点导入功能

1. 点击导入节点标签页
2. 拖放JavaScript文件或点击选择文件按钮
3. 查看自动检测到的节点类和代码预览（支持语法高亮）
4. 点击导入按钮完成导入过程

- **自定义节点**：注册为 `custom/[nodename]` 格式

系统会保留原有路径结构，同时自动处理类型转换和依赖关系。

### AI辅助生成节点

通过自然语言描述生成节点：

1. 打开AI对话框
2. 描述您需要的节点功能
3. AI会生成适当的节点代码
4. 使用代码预览查看代码
5. 点击"应用节点"按钮直接注册到编辑器中

AI助手可以理解您的需求，生成符合项目规范的节点代码，大大提高开发效率。

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
- 遵循ESLint和Prettier配置的代码格式化规则

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

或者使用节点管理器直接导入节点文件，系统会自动处理代码评估和注册。

## 节点分类

节点按功能分为以下几类：

- **math**: 数学运算节点
- **basic**: 基础功能节点
- **logic**: 逻辑运算节点
- **color**: 颜色处理节点
- **audio**: 音频处理节点
- **image**: 图像处理节点
- **custom**: 自定义节点
- **import**: 导入的节点

## 高级功能

### 节点导出与共享

系统支持将创建的节点导出为独立文件，方便与团队成员共享或在其他项目中使用。导出的文件包含所有必要的代码和依赖声明。

### 图形导出与导入

创建的流程图可以导出为JSON格式，稍后再导入继续编辑。导出文件中会自动包含所有自定义节点定义，确保在任何环境中都能正确加载。

### TypeScript支持

系统可以处理TypeScript格式的节点定义，自动转换为JavaScript并保留功能，让开发者能够使用类型系统的优势。

## 常见问题

- **连接问题**：确保节点输入/输出类型匹配
- **性能问题**：减少节点数量，使用节点分组
- **导入问题**：确保导入的JavaScript文件包含有效的节点类定义
- **节点不显示**：检查节点注册路径是否正确，可以在节点管理器中查看
- **类型错误**：检查类型转换是否正确，或尝试使用更通用的数据类型
