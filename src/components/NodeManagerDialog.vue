<template>
  <div v-if="visible" class="node-manager-sidebar" :class="{ 'collapsed': isCollapsed }">
    <div class="sidebar-collapse-btn" @click="toggleCollapse" :title="isCollapsed ? '展开节点管理器' : '收起节点管理器'">
      <span v-if="isCollapsed">👉</span>
      <span v-else>👈</span>
    </div>

    <div class="sidebar-content" v-if="!isCollapsed">
      <div class="sidebar-header">
        <h2>节点管理器</h2>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <div class="sidebar-tabs">
        <button :class="['tab-btn', { active: activeTab === 'registered' }]" @click="activeTab = 'registered'">
          已注册节点
        </button>
        <button :class="['tab-btn', { active: activeTab === 'import' }]" @click="activeTab = 'import'">
          导入节点
        </button>
      </div>

      <div class="sidebar-body">
        <!-- 已注册节点列表 -->
        <div v-if="activeTab === 'registered'" class="tab-content">
          <div class="registered-layout">
            <!-- 左侧筛选栏 -->
            <div class="filter-sidebar">
              <div class="search-container">
                <input type="text" v-model="searchQuery" placeholder="搜索节点..." class="search-input" />
                <div class="search-icon">🔍</div>
              </div>
              <div class="filter-group">
                <div class="filter-group-title">
                  分类
                </div>
                <div class="category-filters">
                  <div v-for="category in filteredCategories" :key="category" class="category-filter"
                    :class="{ active: selectedCategories.includes(category) }" @click="toggleCategory(category)">
                    <span class="category-name">{{ category }}</span>
                    <span class="count">{{ categoryCounts[category] }}</span>
                  </div>
                </div>
              </div>

              <div class="filter-group">
                <div class="filter-group-title">
                  来源
                </div>
                <div class="category-filters">
                  <label class="category-filter source-builtin" :class="{ active: selectedSources.includes('builtin') }"
                    v-if="sourceTypeCounts.builtin > 0">
                    <input type="checkbox" value="builtin" v-model="selectedSources" />
                    <span class="category-name">内置</span>
                    <span class="count">{{ sourceTypeCounts.builtin }}</span>
                  </label>
                  <label class="category-filter source-imported"
                    :class="{ active: selectedSources.includes('imported') }" v-if="sourceTypeCounts.imported > 0">
                    <input type="checkbox" value="imported" v-model="selectedSources" />
                    <span class="category-name">导入</span>
                    <span class="count">{{ sourceTypeCounts.imported }}</span>
                  </label>
                  <label class="category-filter source-custom" :class="{ active: selectedSources.includes('custom') }"
                    v-if="sourceTypeCounts.custom > 0">
                    <input type="checkbox" value="custom" v-model="selectedSources" />
                    <span class="category-name">自定义</span>
                    <span class="count">{{ sourceTypeCounts.custom }}</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- 节点列表和详情 -->
            <div class="nodes-content">
              <div class="nodes-list-container" :class="{ 'with-details': selectedNode }">
                <div v-if="filteredNodes.length === 0" class="empty-state">
                  <p>没有找到匹配的节点</p>
                </div>
                <div v-else class="nodes-list">
                  <!-- 节点组显示 -->
                  <template v-for="(nodes, groupKey) in groupedNodes" :key="groupKey">
                    <!-- 显示节点组标题（仅为导入节点组） -->
                    <div v-if="groupKey !== 'ungrouped' && nodes.length > 0" class="node-group-header">
                      <div class="group-icon">📦</div>
                      <div class="group-title">{{ groupKey }}</div>
                      <div class="group-count">{{ nodes.length }}个节点</div>
                      <button class="group-delete-btn" @click.stop="confirmDeleteGroup(groupKey, nodes)" title="删除整组节点">
                        <span class="delete-icon">🗑️</span>
                      </button>
                    </div>

                    <!-- 显示该组中的节点 -->
                    <div v-for="node in nodes" :key="node.nodeType" class="node-card" @click="selectNode(node)"
                      :class="{ 'selected': selectedNode === node }" draggable="true"
                      @dragstart="handleDragStart($event, node)" @dragend="handleDragEnd">
                      <div class="node-card-header">
                        <div class="node-name">{{ node.className }}</div>
                        <div class="node-source-badge" :class="getNodeSourceClass(node)">
                          {{ getNodeSourceLabel(node) }}
                        </div>
                      </div>
                      <div class="node-path">{{ node.nodeType }}</div>
                      <div class="node-meta">
                        <div class="node-category">{{ node.category }}</div>

                      </div>
                    </div>
                  </template>
                </div>
              </div>

              <div v-if="selectedNode" class="node-details">
                <div class="details-header">
                  <h3>节点详情</h3>
                  <button class="close-details-btn" @click="selectedNode = null">×</button>
                </div>

                <div class="node-info-section">
                  <div class="node-info-item">
                    <span class="info-label">类名:</span>
                    <span class="info-value clickable" @click="copyToClipboard(selectedNode.className)" title="点击复制">{{
                      selectedNode.className }}</span>
                  </div>
                  <div class="node-info-item">
                    <span class="info-label">分类:</span>
                    <span class="info-value clickable" @click="copyToClipboard(selectedNode.category)" title="点击复制">{{
                      selectedNode.category }}</span>
                  </div>
                  <div class="node-info-item">
                    <span class="info-label">路径:</span>
                    <span class="info-value path-value clickable" @click="copyToClipboard(selectedNode.nodeType)"
                      title="点击复制">{{
                        selectedNode.nodeType }}</span>
                  </div>
                  <div class="node-info-item">
                    <span class="info-label">来源:</span>
                    <span class="info-value">
                      <span class="source-badge" :class="getNodeSourceClass(selectedNode)">
                        <span class="source-icon" v-if="getNodeSource(selectedNode) === 'imported'"></span>
                        <span class="source-icon" v-else-if="getNodeSource(selectedNode) === 'custom'"></span>
                        <span class="source-icon" v-else></span>
                        {{ getNodeSourceLabel(selectedNode) }}
                      </span>
                    </span>
                  </div>
                </div>

                <h4 class="code-section-title">节点代码</h4>
                <div class="node-code" :class="{ 'builtin-code': getNodeSource(selectedNode) === 'builtin' }">
                  <div v-if="getNodeSource(selectedNode) !== 'builtin'" class="code-container">
                    <pre class="code-editor"><code v-html="highlightedNodeCode"></code></pre>
                  </div>
                  <div v-else class="builtin-code-placeholder">
                    <div class="placeholder-icon">🔒</div>
                    <p>内置节点代码不可查看</p>
                    <small>内置节点是系统预设的基础功能，无法查看或修改其源代码</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 导入节点页面 -->
        <div v-if="activeTab === 'import'" class="tab-content">
          <div class="import-area">
            <div v-if="!importedCode" class="dropzone" :class="{ 'active': isDragging }"
              @dragover.prevent="isDragging = true" @dragleave.prevent="isDragging = false"
              @drop.prevent="handleFileDrop">
              <div class="dropzone-content">
                <div class="upload-icon">📤</div>
                <p>拖放节点代码文件到此处<br>或</p>
                <button class="upload-btn" @click="triggerFileUpload">选择文件</button>
                <input ref="fileInput" type="file" class="hidden-file-input" accept=".js,.ts"
                  @change="handleFileSelect" />
              </div>
            </div>

            <div v-if="importedCode" class="import-summary">
              <div class="import-header">
                <h3>
                  <span class="import-icon-container">
                    <span class="import-icon">🧩</span>
                  </span>
                  检测到以下节点类
                </h3>
                <div class="file-info">
                  <span class="file-icon">📄</span>
                  <span class="file-name">{{ uploadedFileName }}</span>

                </div>
              </div>

              <div class="import-content">
                <div class="option-group detected-classes-group">
                  <label>
                    <span class="option-icon">✨</span>
                    检测到的节点类 ({{ detectedClasses.length }}):
                  </label>
                  <div class="detected-classes-container">
                    <div class="detected-classes">
                      <div v-for="(cls, index) in detectedClasses" :key="index" class="detected-class"
                        :style="{ animationDelay: index * 0.05 + 's' }">
                        <span class="class-icon">📦</span>
                        <span class="class-name">{{ cls }}</span>
                      </div>
                    </div>
                    <div v-if="detectedClasses.length === 0" class="no-classes-detected">
                      <span class="warning-icon">⚠️</span>
                      未检测到节点类，请确保文件包含有效的类定义
                    </div>
                  </div>
                </div>

                <div class="option-group code-preview-group">
                  <label>
                    <span class="option-icon">👨‍💻</span>
                    代码预览:
                    <span class="code-badge">JavaScript</span>
                  </label>
                  <div class="code-preview-container">
                    <div class="code-header">
                      <div class="code-dots">
                        <span class="code-dot red"></span>
                        <span class="code-dot yellow"></span>
                        <span class="code-dot green"></span>
                      </div>
                      <div class="code-title">节点代码</div>
                    </div>
                    <pre class="code-preview"><code v-html="highlightedCode"></code></pre>
                  </div>
                  <div class="import-note">
                    <span class="note-icon">ℹ️</span>
                    系统将保留节点原定义的路径，仅在前面添加 custom/ 前缀
                  </div>
                </div>
              </div>

              <div class="import-actions">
                <div class="action-info" v-if="detectedClasses.length > 0">
                  <span class="info-icon">ℹ️</span>
                  将导入 {{ detectedClasses.length }} 个节点
                </div>
                <div class="action-buttons">
                  <button class="action-btn cancel-btn" @click="cancelImport">
                    <span class="btn-icon">✗</span> 取消
                  </button>
                  <button class="action-btn import-btn animated-btn" @click="importNodes"
                    :disabled="!importedCode || detectedClasses.length === 0">
                    <div class="btn-content">
                      <span class="btn-icon">✓</span>
                      <span class="btn-text">导入节点</span>
                    </div>
                    <div class="btn-gradient"></div>
                    <span class="btn-loading" v-if="isImporting"></span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 删除确认对话框 -->
  <div v-if="showDeleteConfirmation" class="confirmation-dialog-overlay" @click.self="showDeleteConfirmation = false">
    <div class="confirmation-dialog">
      <div class="confirmation-header">
        <h3>确认删除</h3>
      </div>
      <div class="confirmation-content">
        <p v-if="!isGroupDelete">确定要删除节点 "{{ selectedNode?.className }}" 吗？此操作不可撤销。</p>
        <p v-else>确定要删除组 "{{ selectedGroupName }}" 中的所有 {{ selectedGroupNodes.length }} 个节点吗？此操作不可撤销。</p>
      </div>
      <div class="confirmation-actions">
        <button class="cancel-btn" @click="showDeleteConfirmation = false">取消</button>
        <button class="confirm-btn" @click="isGroupDelete ? deleteNodeGroup() : deleteNode()">确认删除</button>
      </div>
    </div>
  </div>

  <!-- 节点预览对话框 -->
  <div v-if="showPreview" class="preview-dialog-overlay" @click.self="showPreview = false">
    <div class="preview-dialog">
      <div class="preview-content">
        <h3>
          节点预览
          <span class="node-source-badge" :class="previewNodeData ? getNodeSourceClass(previewNodeData) : ''">
            {{ previewNodeData ? getNodeSourceLabel(previewNodeData) : '' }}
          </span>
        </h3>

        <div class="node-preview-display">
          <div class="node-preview-box" :class="{
            'builtin': previewNodeSource === 'builtin',
            'custom': previewNodeSource === 'custom',
            'imported': previewNodeSource === 'imported'
          }">
            <div class="node-preview-title">
              {{ previewNodeData?.className || 'Unknown Node' }}
            </div>
            <div class="node-preview-body">
              <div class="node-preview-io">
                <div class="node-preview-inputs">
                  <div v-for="input in nodeInputs" :key="input.name" class="io-slot" :data-name="input.name"
                    :data-type="input.type" @click="handleInputClick(input)">
                  </div>
                </div>
                <div class="node-preview-content">
                  <div class="node-preview-path">{{ previewNodeData?.nodeType || 'unknown/path' }}</div>
                  <div class="node-preview-category">{{ previewNodeData?.category || 'unknown' }}</div>
                </div>
                <div class="node-preview-outputs">
                  <div v-for="output in nodeOutputs" :key="output.name" class="io-slot" :data-name="output.name"
                    :data-type="output.type" @click="handleOutputClick(output)">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="node-preview-actions">
          <button class="action-btn" @click="showPreview = false">关闭</button>
        </div>
      </div>
    </div>
  </div>

  <!-- 通知 -->
  <div v-if="notification" class="notification" :class="notification.type"
    :style="{ 'animation-name': notification ? 'fadeIn' : 'none' }">
    <div class="notification-message">{{ notification.message }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import { getAllCustomNodes, createNodeFile, getNodeCategories, deleteCustomNode } from '../services/nodeGeneratorService'
import LiteGraph from '../services/liteGraphCfg'
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';


// 注册JavaScript语言支持
hljs.registerLanguage('javascript', javascript);

// 节点定义类型
interface NodeDefinition {
  className: string
  category: string
  code: string
  nodeType: string
  createdAt: number
  sourceFile?: string // 添加源文件属性
}

// 从代码中提取类名
const extractClassNames = (code: string): string[] => {
  const classNames: string[] = []
  const classRegex = /class\s+([a-zA-Z0-9_]+)(?:\s+extends\s+(?:[a-zA-Z0-9_\.]+))?\s*\{/g
  let match

  while ((match = classRegex.exec(code)) !== null) {
    classNames.push(match[1])
  }

  return classNames
}

// 新增: 计算节点的源文件名
const getSourceFilePath = (node: NodeDefinition): string => {
  // 处理内置节点
  if (node.nodeType.startsWith('custom/')) {
    // 导入节点: 从nodeType提取文件路径部分
    const parts = node.nodeType.split('/');
    if (parts.length > 2) {
      return parts.slice(1, -1).join('/');
    }
  }

  // 内置节点或自定义节点
  return node.nodeType.split('/')[0];
}

export default defineComponent({
  name: 'NodeManagerDialog',

  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },

  emits: ['close', 'node-imported', 'node-deleted', 'preview-node', 'add-to-canvas', 'drag-node-start', 'drag-node-end'],

  setup(props, { emit }) {
    // 激活的选项卡
    const activeTab = ref('registered')

    // 节点数据
    const customNodes = ref<NodeDefinition[]>([])
    const selectedNode = ref<NodeDefinition | null>(null)

    // 侧边栏状态
    const isCollapsed = ref(false)

    // 搜索和筛选
    const searchQuery = ref('')
    const availableCategories = ref<string[]>([])
    const selectedCategories = ref<string[]>([])
    const selectedSources = ref<string[]>([])

    // 导入相关
    const importedCode = ref('')
    const importCategory = ref('custom')
    const detectedClasses = ref<string[]>([])
    const isDragging = ref(false)
    const fileInput = ref<HTMLInputElement | null>(null)

    // 代码高亮
    const highlightedCode = computed(() => {
      if (!importedCode.value) return '';
      return hljs.highlight(importedCode.value, { language: 'javascript' }).value;
    });

    // 节点详情代码高亮
    const highlightedNodeCode = computed(() => {
      if (!selectedNode.value || !selectedNode.value.code) return '';
      return hljs.highlight(selectedNode.value.code, { language: 'javascript' }).value;
    });

    // 删除确认
    const showDeleteConfirmation = ref(false)
    const isGroupDelete = ref(false)
    const selectedGroupName = ref('')
    const selectedGroupNodes = ref<NodeDefinition[]>([])

    // 通知
    const notification = ref<{ message: string, type: 'success' | 'error' } | null>(null)

    // 预览相关
    const showPreview = ref(false)
    const previewNodeData = ref<NodeDefinition | null>(null)
    const previewNodeSource = ref<'builtin' | 'custom' | 'imported'>('builtin')

    // 生成节点的输入输出插槽
    const nodeInputs = ref<{ name: string, type: string }[]>([])
    const nodeOutputs = ref<{ name: string, type: string }[]>([])

    // 切换侧边栏折叠状态
    const toggleCollapse = () => {
      isCollapsed.value = !isCollapsed.value;
    }

    // 初始化数据
    const loadCustomNodes = () => {
      // 获取自定义节点
      const userCreatedNodes = getAllCustomNodes()

      // 添加内置节点
      const builtinNodes: NodeDefinition[] = []

      // 从LiteGraph获取所有已注册节点
      const allRegisteredTypes = Object.keys(LiteGraph.registered_node_types)

      for (const nodeType of allRegisteredTypes) {
        // 排除已经在自定义节点中的节点
        if (!userCreatedNodes.some(node => node.nodeType === nodeType) &&
          !nodeType.startsWith('custom/')) {

          // Extract the class name directly from the nodeType path
          const nodeName = nodeType.split('/').pop() || ''
          // Convert to PascalCase and add Node suffix if needed
          const className = nodeName.charAt(0).toUpperCase() + nodeName.slice(1) + (nodeName.toLowerCase().endsWith('node') ? '' : 'Node')
          const parts = nodeType.split('/')
          const category = parts.length > 1 ? parts[0] : 'misc'

          builtinNodes.push({
            className,
            category,
            code: '// 内置节点 - 代码不可用',
            nodeType,
            createdAt: 0 // 内置节点没有创建时间
          })
        }
      }

      // 合并自定义和内置节点
      customNodes.value = [...userCreatedNodes, ...builtinNodes]

      // 加载可用分类
      const categories = new Set<string>()
      customNodes.value.forEach(node => {
        if (node.category) {
          categories.add(node.category)
        }
      })

      // 加载内置分类
      getNodeCategories().forEach(cat => categories.add(cat))

      availableCategories.value = Array.from(categories)
    }

    // 过滤节点列表
    const filteredNodes = computed(() => {
      let result = customNodes.value

      // 应用类别过滤
      if (selectedCategories.value.length > 0) {
        result = result.filter(node =>
          selectedCategories.value.includes(node.category)
        )
      }

      // 应用搜索查询
      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(node =>
          node.className.toLowerCase().includes(query) ||
          node.nodeType.toLowerCase().includes(query)
        )
      }

      // 应用来源过滤
      if (selectedSources.value.length > 0) {
        result = result.filter(node =>
          selectedSources.value.includes(getNodeSource(node))
        )
      }

      return result
    })

    // 当选项卡变更时，重新加载数据
    watch(activeTab, () => {
      if (activeTab.value === 'registered') {
        loadCustomNodes()
      }
    })

    // 当visible变更时，重新加载数据
    watch(() => props.visible, (newVal) => {
      if (newVal) {
        loadCustomNodes()
      }
    })

    // 选择节点
    const selectNode = (node: NodeDefinition) => {
      selectedNode.value = node
    }

    // 格式化日期
    const formatDate = (timestamp: number) => {
      return new Date(timestamp).toLocaleString()
    }

    // 复制节点代码
    const copyNodeCode = () => {
      if (!selectedNode.value) return

      navigator.clipboard.writeText(selectedNode.value.code)
        .then(() => {
          showNotification('代码已复制到剪贴板', 'success')
        })
        .catch(err => {
          console.error('复制失败:', err)
          showNotification('复制失败', 'error')
        })
    }

    // 预览节点
    const previewNode = () => {
      if (!selectedNode.value) return

      // 设置预览数据
      previewNodeData.value = selectedNode.value
      previewNodeSource.value = getNodeSource(selectedNode.value)

      // 生成输入输出插槽
      generateNodeIOs()

      // 显示预览对话框
      showPreview.value = true
    }

    // 生成节点的输入输出插槽
    const generateNodeIOs = () => {
      // 清空之前的输入输出
      nodeInputs.value = []
      nodeOutputs.value = []

      // 根据类别生成默认输入输出
      const category = previewNodeData.value?.category || 'unknown'

      if (category === 'math') {
        nodeInputs.value = [
          { name: 'A', type: 'number' },
          { name: 'B', type: 'number' }
        ]
        nodeOutputs.value = [
          { name: '结果', type: 'number' }
        ]
      } else if (category === 'image') {
        nodeInputs.value = [
          { name: '图像', type: 'image' }
        ]
        nodeOutputs.value = [
          { name: '处理后', type: 'image' }
        ]
      } else if (category === 'audio') {
        nodeInputs.value = [
          { name: '音频', type: 'audio' }
        ]
        nodeOutputs.value = [
          { name: '处理后', type: 'audio' }
        ]
      } else if (category === 'color') {
        nodeOutputs.value = [
          { name: '颜色', type: 'color' }
        ]
      } else {
        // 默认输入输出
        nodeInputs.value = [
          { name: '输入1', type: 'any' }
        ]
        nodeOutputs.value = [
          { name: '输出1', type: 'any' }
        ]
      }
    }

    // 确认删除节点
    const confirmDeleteNode = () => {
      if (!selectedNode.value) return
      isGroupDelete.value = false
      showDeleteConfirmation.value = true
    }

    // 确认删除节点组
    const confirmDeleteGroup = (groupName: string, nodes: NodeDefinition[]) => {
      isGroupDelete.value = true
      selectedGroupName.value = groupName
      selectedGroupNodes.value = nodes
      showDeleteConfirmation.value = true
    }

    // 删除节点组
    const deleteNodeGroup = async () => {
      if (selectedGroupNodes.value.length === 0) return

      let successCount = 0
      const failedNodes: string[] = []

      // 遍历删除组内所有节点
      for (const node of selectedGroupNodes.value) {
        const success = deleteCustomNode(node.nodeType)
        if (success) {
          successCount++
          emit('node-deleted', node.nodeType)
        } else {
          failedNodes.push(node.className)
        }
      }

      // 显示结果通知
      if (successCount === selectedGroupNodes.value.length) {
        showNotification(`成功删除 "${selectedGroupName.value}" 组中的所有 ${successCount} 个节点`, 'success')
      } else if (successCount > 0) {
        showNotification(`部分删除成功：已删除 ${successCount}/${selectedGroupNodes.value.length} 个节点`, 'success')
      } else {
        showNotification('删除节点组失败', 'error')
      }

      // 如果有失败的节点，显示详情
      if (failedNodes.length > 0) {
        console.error('以下节点删除失败:', failedNodes)
      }

      // 更新列表
      loadCustomNodes()
      selectedNode.value = null
      showDeleteConfirmation.value = false
    }

    // 触发文件上传
    const triggerFileUpload = () => {
      if (fileInput.value) {
        fileInput.value.click()
      }
    }

    // 处理文件选择
    const handleFileSelect = (event: Event) => {
      const input = event.target as HTMLInputElement
      if (!input.files || !input.files[0]) return

      const file = input.files[0]
      loadFile(file)
    }

    // 处理文件拖放
    const handleFileDrop = (event: DragEvent) => {
      isDragging.value = false

      if (!event.dataTransfer?.files.length) return

      const file = event.dataTransfer.files[0]
      loadFile(file)
    }

    // 加载文件内容
    const uploadedFileName = ref('');
    const loadFile = (file: File) => {
      const reader = new FileReader();
      uploadedFileName.value = file.name;

      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          importedCode.value = e.target.result;

          // 从代码中提取类名
          detectedClasses.value = extractClassNames(importedCode.value);

          // 如果没有检测到类名，显示错误
          if (detectedClasses.value.length === 0) {
            showNotification('未在文件中检测到任何节点类', 'error');
          }
        }
      };

      reader.readAsText(file);
    };

    // 删除节点
    const deleteNode = () => {
      if (!selectedNode.value) return

      const success = deleteCustomNode(selectedNode.value.nodeType)

      if (success) {
        emit('node-deleted', selectedNode.value.nodeType)
        showNotification(`节点 ${selectedNode.value.className} 已删除`, 'success')

        // 更新列表
        loadCustomNodes()
        selectedNode.value = null
      } else {
        showNotification('删除节点失败', 'error')
      }

      showDeleteConfirmation.value = false
    }

    // 导入节点
    const isImporting = ref(false);
    const importNodes = async () => {
      if (!importedCode.value || detectedClasses.value.length === 0) return;

      isImporting.value = true;
      let successCount = 0;

      // 检查代码中是否包含节点注册路径
      const registerTypeMap = new Map<string, string>();
      const registerRegex = /LiteGraph\.registerNodeType\s*\(\s*(['"])(.*?)\1\s*,\s*([a-zA-Z0-9_]+)\s*\)\s*;?/g;
      let registerMatch;

      while ((registerMatch = registerRegex.exec(importedCode.value)) !== null) {
        registerTypeMap.set(registerMatch[3], registerMatch[2]);
      }

      // 为每个检测到的类创建一个节点
      for (const className of detectedClasses.value) {
        // 使用文件名（去除扩展名）
        const fileName = uploadedFileName.value.replace(/\.[^/.]+$/, "");

        // 尝试从注册信息中获取原始路径，如果没有则使用类名
        let nodeType = className;
        if (registerTypeMap.has(className)) {
          nodeType = registerTypeMap.get(className) || className;
        }

        // 调用createNodeFile
        const success = await createNodeFile(className, nodeType, importedCode.value, fileName);

        if (success) {
          successCount++;
        }
      }

      if (successCount > 0) {
        showNotification(`成功导入 ${successCount} 个节点`, 'success');
        emit('node-imported', successCount);

        // 重置导入状态
        importedCode.value = '';
        detectedClasses.value = [];

        // 切换到已注册节点选项卡
        activeTab.value = 'registered';

        // 更新列表
        loadCustomNodes();
      } else {
        showNotification('导入节点失败', 'error');
      }

      isImporting.value = false;
    };

    // 取消导入
    const cancelImport = () => {
      importedCode.value = ''
      detectedClasses.value = []
      importCategory.value = 'custom'
    }

    // 显示通知
    const showNotification = (message: string, type: 'success' | 'error') => {
      notification.value = { message, type }

      setTimeout(() => {
        notification.value = null
      }, 3000)
    }

    // 点击遮罩层关闭
    const closeOnOverlayClick = (event: MouseEvent) => {
      if (event.target === event.currentTarget) {
        emit('close')
      }
    }

    // 获取节点来源类型
    const getNodeSource = (node: NodeDefinition): 'imported' | 'builtin' | 'custom' => {
      // 检查节点类型路径前缀来确定来源
      if (node.nodeType.startsWith('custom/')) {
        return 'imported'
      }

      // 检查是否是自定义节点（老版本兼容）
      if (node.nodeType.includes('custom')) {
        return 'custom'
      }

      // 如果没有特定前缀，认为是内置预设节点
      return 'builtin'
    }

    // 获取节点来源样式类
    const getNodeSourceClass = (node: NodeDefinition) => {
      const source = getNodeSource(node)
      if (source === 'imported') return 'imported-node'
      if (source === 'custom') return 'custom-node'
      return 'builtin-node'
    }

    // 获取节点显示的来源标签文字
    const getNodeSourceLabel = (node: NodeDefinition) => {
      const source = getNodeSource(node)
      if (source === 'imported') return '导入'
      if (source === 'custom') return '自定义'
      return '内置'
    }

    // 添加类别过滤
    const toggleCategory = (category: string) => {
      if (selectedCategories.value.includes(category)) {
        selectedCategories.value = selectedCategories.value.filter(c => c !== category)
      } else {
        selectedCategories.value.push(category)
      }
    }

    // 计算类别数量
    const categoryCounts = computed(() => {
      const counts: Record<string, number> = {}

      customNodes.value.forEach((node: NodeDefinition) => {
        if (node.category) {
          counts[node.category] = (counts[node.category] || 0) + 1
        }
      })

      return counts
    })

    // 过滤掉没有节点的分类
    const filteredCategories = computed(() => {
      return availableCategories.value.filter(category =>
        customNodes.value.some((node: NodeDefinition) =>
          node.category === category
        )
      )
    })

    // 计算来源类型数量
    const sourceTypeCounts = computed(() => {
      const counts = {
        builtin: 0,
        imported: 0,
        custom: 0
      }

      customNodes.value.forEach((node: NodeDefinition) => {
        const source = getNodeSource(node)
        if (source && counts.hasOwnProperty(source)) {
          counts[source]++
        }
      })

      return counts
    })

    // 处理输入插槽点击
    const handleInputClick = (input: { name: string, type: string }) => {
      showNotification(`点击了输入: ${input.name} (${input.type})`, 'success')
    }

    // 处理输出插槽点击
    const handleOutputClick = (output: { name: string, type: string }) => {
      showNotification(`点击了输出: ${output.name} (${output.type})`, 'success')
    }

    // 复制文本到剪贴板
    const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text)
        .then(() => {
          showNotification(`已复制: ${text}`, 'success')
        })
        .catch(err => {
          console.error('复制失败:', err)
          showNotification('复制失败', 'error')
        })
    }

    onMounted(() => {
      loadCustomNodes()
    })

    // 新增: 节点分组功能
    const groupedNodes = computed(() => {
      // 首先应用过滤
      const filtered = filteredNodes.value;

      // 仅对导入的节点进行分组
      if (!filtered.some(node => getNodeSource(node) === 'imported')) {
        return { ungrouped: filtered };
      }

      const groups: Record<string, NodeDefinition[]> = {
        ungrouped: []
      };

      // 对过滤后的节点按源文件分组
      for (const node of filtered) {
        const source = getNodeSource(node);

        if (source === 'imported') {
          // 导入节点按源文件分组
          // 保留原始路径结构，包括子目录
          const parts = node.nodeType.split('/');

          // 移除"custom/"前缀
          parts.shift();

          // 获取文件路径(排除最后的节点名称)
          if (parts.length > 1) {
            // 将除最后一部分外的所有部分作为源文件路径
            const sourcePath = parts.slice(0, -1).join('/');
            if (!groups[sourcePath]) {
              groups[sourcePath] = [];
            }
            groups[sourcePath].push(node);
          } else {
            // 如果没有子路径部分，放入未分组
            groups.ungrouped.push(node);
          }
        } else {
          // 其他节点放入未分组列表
          groups.ungrouped.push(node);
        }
      }

      return groups;
    });

    // 添加"添加到画布"按钮到节点详情部分
    const addToCanvas = (node: NodeDefinition) => {
      if (!node) return;

      // 触发一个事件，通知父组件将节点添加到画布
      emit('add-to-canvas', {
        type: node.nodeType,
        className: node.className,
        category: node.category
      });

      // 显示一个通知，表明节点已添加到画布
      showNotification(`已添加 "${node.className}" 到画布`, 'success');

      // 可选：关闭节点管理器
      // emit('close');
    };

    // 拖拽相关状态
    const isDraggingNode = ref(false)
    const draggedNode = ref<NodeDefinition | null>(null)

    // 处理拖拽开始
    const handleDragStart = (event: DragEvent, node: NodeDefinition) => {
      if (!event.dataTransfer) return

      // 设置拖拽数据
      event.dataTransfer.setData('application/node', JSON.stringify({
        type: node.nodeType,
        className: node.className,
        category: node.category
      }))

      // 为了更好的视觉效果，可以设置自定义拖拽图像
      const dragImage = document.createElement('div')
      dragImage.className = 'drag-preview'
      dragImage.innerHTML = `<div class="drag-node-name">${node.className}</div>`
      dragImage.style.cssText = `
        position: absolute;
        left: -9999px;
        background: rgba(30, 30, 50, 0.9);
        padding: 8px 12px;
        border-radius: 6px;
        color: white;
        font-weight: bold;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        z-index: 9999;
        pointer-events: none;
      `
      document.body.appendChild(dragImage)
      event.dataTransfer.setDragImage(dragImage, 20, 20)

      // 设置拖拽状态
      isDraggingNode.value = true
      draggedNode.value = node

      // 设置拖拽效果
      event.dataTransfer.effectAllowed = 'copy'

      // 发出拖拽开始事件，通知父组件
      emit('drag-node-start', {
        type: node.nodeType,
        className: node.className,
        category: node.category
      })

      // 稍后移除临时创建的拖拽图像元素
      setTimeout(() => {
        if (dragImage.parentNode) {
          document.body.removeChild(dragImage)
        }
      }, 0)
    }

    // 处理拖拽结束
    const handleDragEnd = () => {
      isDraggingNode.value = false
      draggedNode.value = null

      // 发出拖拽结束事件，通知父组件
      emit('drag-node-end')
    }

    return {
      activeTab,
      customNodes,
      selectedNode,
      searchQuery,
      availableCategories,
      selectedCategories,
      selectedSources,
      filteredNodes,
      groupedNodes,
      filteredCategories,
      importedCode,
      detectedClasses,
      isDragging,
      fileInput,
      highlightedCode,
      highlightedNodeCode,
      showDeleteConfirmation,
      isGroupDelete,
      selectedGroupName,
      selectedGroupNodes,
      notification,
      showPreview,
      previewNodeData,
      previewNodeSource,
      nodeInputs,
      nodeOutputs,
      isCollapsed,
      toggleCollapse,
      loadCustomNodes,
      selectNode,
      formatDate,
      copyNodeCode,
      previewNode,
      confirmDeleteNode,
      deleteNode,
      confirmDeleteGroup,
      deleteNodeGroup,
      triggerFileUpload,
      handleFileSelect,
      handleFileDrop,
      importNodes,
      cancelImport,
      closeOnOverlayClick,
      getNodeSource,
      getNodeSourceClass,
      getNodeSourceLabel,
      getSourceFilePath,
      toggleCategory,
      categoryCounts,
      sourceTypeCounts,
      handleInputClick,
      handleOutputClick,
      copyToClipboard,
      uploadedFileName,
      isImporting,
      addToCanvas,
      isDraggingNode,
      draggedNode,
      handleDragStart,
      handleDragEnd
    }
  }
})
</script>

<style scoped>
/* 整体样式重写为侧边栏 */
.node-manager-sidebar {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  z-index: 900;
  transition: all 0.3s ease;
  max-width: 90vw;
}

.sidebar-collapse-btn {
  position: absolute;
  left: -30px;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 60px;
  background: rgba(30, 30, 45, 0.85);
  border-radius: 6px 0 0 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: -3px 0 10px rgba(0, 0, 0, 0.2);
  z-index: 5;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-right: none;
  transition: all 0.2s ease;
}

.sidebar-collapse-btn:hover {
  background: rgba(40, 40, 60, 0.95);
  width: 36px;
  left: -36px;
}

.sidebar-content {
  background-color: #1e1e2d;
  width: 380px;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: -5px 0 20px rgba(0, 0, 0, 0.4);
  border-left: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
}

.node-manager-sidebar.collapsed {
  transform: translateX(0);
}

.node-manager-sidebar.collapsed .sidebar-content {
  display: none;
}

.sidebar-header {
  background: linear-gradient(90deg, #2d2d44 0%, #252536 100%);
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #3a3a58;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  position: relative;
  z-index: 2;
}

.sidebar-header h2 {
  color: #ffffff;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.sidebar-header h2::before {
  content: "📊";
  margin-right: 10px;
  font-size: 20px;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.3));
}

.close-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #ffffff;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

.sidebar-tabs {
  display: flex;
  background: linear-gradient(90deg, #252536 0%, #1e1e2d 100%);
  border-bottom: 1px solid #3a3a58;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  position: relative;
  z-index: 1;
}

.tab-btn {
  padding: 12px 15px;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  color: #aaaacc;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
  flex: 1;
  letter-spacing: 0.3px;
}

.tab-btn.active {
  color: #ffffff;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.sidebar-body {
  flex: 1;
  overflow: hidden;
  display: flex;
}

.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 调整筛选栏样式以适应侧边栏 */
.registered-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.filter-sidebar {
  background: linear-gradient(180deg, rgba(25, 26, 40, 0.9) 0%, rgba(22, 23, 35, 0.95) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 15px;
  max-height: 30%;
  overflow-y: auto;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
  position: relative;
  z-index: 1;
}

.nodes-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.nodes-list-container {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  transition: height 0.3s ease;
}

.nodes-list-container.with-details {
  height: 40%;
}

.nodes-list {
  display: flex;
  flex-direction: column;
  padding: 10px;
  gap: 10px;
}

.node-card {
  border-radius: 8px;
  background: linear-gradient(145deg, #1c1c30, #1a1a28);
  padding: 12px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.215, 0.61, 0.355, 1);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  animation: none;
  /* 确保没有动画效果 */
}

.node-card:hover {
  background: linear-gradient(145deg, #222236, #202030);
  transform: translateY(-3px) scale(1.01);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
  border-color: rgba(74, 107, 175, 0.3);
}

.node-card.selected {
  background: linear-gradient(145deg, #252540, #222236);
  border-color: rgba(74, 107, 175, 0.7);
  box-shadow: 0 0 0 2px rgba(74, 107, 175, 0.2), 0 5px 15px rgba(0, 0, 0, 0.3);
}

.node-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.node-name {
  font-weight: 600;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-source-badge {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  color: white;
}

.node-path {
  display: flex;
  align-items: center;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 11px;
  color: #8888aa;
  margin-bottom: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-path::before {
  content: '📁';
  margin-right: 5px;
  font-size: 12px;
  opacity: 0.7;
}

.node-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.node-category {
  background: linear-gradient(90deg, rgba(74, 107, 175, 0.3) 0%, rgba(74, 107, 175, 0.15) 100%);
  color: #99aadd;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  border: 1px solid rgba(74, 107, 175, 0.2);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.quick-add-btn {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(74, 107, 175, 0.2);
  border: 1px solid rgba(74, 107, 175, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  opacity: 0.8;
  transition: all 0.25s;
}

.quick-add-btn:hover {
  background: rgba(74, 107, 175, 0.4);
  transform: scale(1.1);
  opacity: 1;
  box-shadow: 0 0 8px rgba(74, 107, 175, 0.5);
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(74, 107, 175, 0.4);
  }

  70% {
    box-shadow: 0 0 0 6px rgba(74, 107, 175, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(74, 107, 175, 0);
  }
}

/* 节点组标题增强 */
.node-group-header {
  background: linear-gradient(135deg, rgba(40, 40, 65, 0.9) 0%, rgba(30, 30, 50, 0.9) 100%);
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  transition: all 0.3s cubic-bezier(0.215, 0.61, 0.355, 1);
  position: relative;
  overflow: hidden;
}

.node-group-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.05) 50%,
      rgba(255, 255, 255, 0) 100%);
  transform: translateX(-100%);
  transition: transform 1.5s;
  pointer-events: none;
}

.node-group-header:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  background: linear-gradient(135deg, rgba(45, 45, 70, 0.95) 0%, rgba(35, 35, 55, 0.95) 100%);
}

.node-group-header:hover::before {
  transform: translateX(100%);
}

.group-icon {
  background: linear-gradient(135deg, rgba(74, 107, 175, 0.3), rgba(60, 90, 150, 0.3));
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  margin-right: 12px;
  font-size: 18px;
  border: 1px solid rgba(74, 107, 175, 0.3);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  position: relative;
  transition: all 0.3s;
}

.node-group-header:hover .group-icon {
  transform: scale(1.05) rotate(5deg);
  background: linear-gradient(135deg, rgba(74, 107, 175, 0.4), rgba(60, 90, 150, 0.4));
  box-shadow: 0 3px 8px rgba(74, 107, 175, 0.3);
}

.group-title {
  flex: 1;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #e0e0ee;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: all 0.3s;
}

.node-group-header:hover .group-title {
  color: #ffffff;
}

.group-count {
  background: linear-gradient(135deg, rgba(20, 20, 30, 0.6), rgba(15, 15, 25, 0.6));
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 11px;
  margin-right: 12px;
  color: #99aacc;
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  transition: all 0.3s;
  display: flex;
  align-items: center;
}

.group-count::before {
  content: '#';
  margin-right: 3px;
  opacity: 0.7;
}

.node-group-header:hover .group-count {
  background: linear-gradient(135deg, rgba(74, 107, 175, 0.2), rgba(60, 90, 150, 0.2));
  color: #aabbdd;
  transform: scale(1.05);
}

.group-delete-btn {
  background: rgba(220, 53, 69, 0.15);
  border: 1px solid rgba(220, 53, 69, 0.2);
  padding: 6px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  transition: all 0.3s;
  width: 32px;
  height: 32px;
}

.group-delete-btn:hover {
  background: rgba(220, 53, 69, 0.3);
  opacity: 1;
  transform: rotate(5deg);
  box-shadow: 0 0 10px rgba(220, 53, 69, 0.3);
}

.delete-icon {
  font-size: 16px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
  transition: all 0.2s;
}

.group-delete-btn:hover .delete-icon {
  transform: scale(1.1);
}

/* 节点详情样式 */
.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(90deg, #242438 0%, #1e1e2d 100%);
}

.details-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
}

.close-details-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #888;
  cursor: pointer;
  padding: 0 5px;
}

.close-details-btn:hover {
  color: #fff;
}

.node-info-section {
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.node-info-item {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.info-label {
  width: 60px;
  color: #8888aa;
  font-size: 12px;
}

.info-value {
  flex: 1;
  color: #ddddff;
  font-size: 13px;
  word-break: break-all;
}

.path-value {
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 12px;
}

.clickable {
  cursor: pointer;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.2);
  padding: 0 2px;
  transition: all 0.2s;
}

.clickable:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-bottom-color: rgba(255, 255, 255, 0.4);
}

.source-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.source-icon {
  margin-right: 4px;
  font-size: 14px;
}

.code-section-title {
  margin: 18px 18px 10px;
  font-size: 14px;
  color: #aaaacc;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.code-section-title::before {
  content: "📄";
  margin-right: 8px;
  font-size: 15px;
}

.node-code {
  margin: 0 16px 16px;
  background: linear-gradient(160deg, #151520, #12121a);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
}

.code-container {
  max-height: 400px;
  overflow-y: auto;
  padding: 5px;
}

pre.code-editor {
  margin: 0;
  padding: 15px;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
  tab-size: 4;
  counter-reset: line;
}

pre.code-editor code {
  display: block;
  position: relative;
  padding-left: 4px;
  border-left: 1px solid rgba(74, 107, 175, 0.2);
}

.builtin-code-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #666677;
  text-align: center;
  background-color: rgba(0, 0, 0, 0.15);
  border-radius: 6px;
  margin: 10px;
}

.placeholder-icon {
  font-size: 36px;
  margin-bottom: 20px;
  opacity: 0.5;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-10px);
  }
}

/* 分类筛选器样式 */
.search-container {
  position: relative;
  margin-bottom: 12px;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.search-input {
  width: 100%;
  padding: 10px 10px 10px 36px;
  background-color: rgba(30, 30, 45, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  color: #fff;
  font-size: 13px;
  transition: all 0.3s;
}

.search-input:focus {
  background-color: rgba(35, 35, 50, 0.9);
  border-color: rgba(74, 107, 175, 0.6);
  box-shadow: 0 0 0 3px rgba(74, 107, 175, 0.2);
  outline: none;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #666677;
  font-size: 14px;
  transition: all 0.3s;
}

.filter-group {
  margin-bottom: 15px;
  animation: fadeIn 0.5s ease-out;
}

.filter-group-title {
  font-weight: 600;
  color: #aabbcc;
  font-size: 12px;
  margin-bottom: 10px;
  padding-left: 4px;
  display: flex;
  align-items: center;
  letter-spacing: 0.5px;
}

.filter-group-title::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 14px;
  background: linear-gradient(to bottom, #4a6baf, #7892d9);
  margin-right: 8px;
  border-radius: 2px;
}

.category-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-filter {
  padding: 7px 10px;
  background: linear-gradient(145deg, #1e1e30, #1a1a28);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 6px;
  transition: all 0.2s;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.category-filter:hover {
  background: linear-gradient(145deg, #222236, #1e1e30);
  border-color: rgba(255, 255, 255, 0.12);
  transform: translateY(-1px);
  box-shadow: 0 3px 7px rgba(0, 0, 0, 0.15);
}

.category-filter.active {
  background: linear-gradient(145deg, rgba(74, 107, 175, 0.25), rgba(74, 107, 175, 0.15));
  border-color: rgba(74, 107, 175, 0.4);
  box-shadow: 0 0 0 1px rgba(74, 107, 175, 0.2), 0 3px 7px rgba(0, 0, 0, 0.15);
}

.category-name {
  color: #ccccdd;
  font-weight: 500;
}

.count {
  margin-left: 8px;
  background-color: rgba(0, 0, 0, 0.3);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  color: #99aacc;
  font-weight: 500;
}

/* 来源类型样式 */
.source-builtin {
  color: #89cff0;
}

.source-imported {
  color: #98fb98;
}

.source-custom {
  color: #ffa07a;
}

.builtin-node {
  background-color: rgba(74, 107, 175, 0.2);
  color: #89cff0;
}

.imported-node {
  background-color: rgba(114, 196, 114, 0.2);
  color: #98fb98;
}

.custom-node {
  background-color: rgba(255, 160, 122, 0.2);
  color: #ffa07a;
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666677;
  padding: 40px;
  text-align: center;
}

/* 确认对话框样式 */
.confirmation-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.confirmation-dialog {
  background: linear-gradient(160deg, #1e1e2d 0%, #1a1a25 100%);
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
  width: 400px;
  max-width: 90%;
  overflow: hidden;
  animation: fadeInScale 0.3s cubic-bezier(0.215, 0.61, 0.355, 1);
}

.confirmation-header {
  background: linear-gradient(90deg, #303048 0%, #252538 100%);
  padding: 15px 20px;
  border-bottom: 1px solid #3a3a58;
}

.confirmation-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  display: flex;
  align-items: center;
}

.confirmation-header h3::before {
  content: "⚠️";
  margin-right: 10px;
  font-size: 16px;
}

.confirmation-content {
  padding: 20px;
  color: #bbbbcc;
  line-height: 1.5;
}

.confirmation-actions {
  display: flex;
  justify-content: flex-end;
  padding: 15px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  gap: 10px;
  background: rgba(0, 0, 0, 0.15);
}

.cancel-btn {
  padding: 8px 16px;
  background: linear-gradient(145deg, #333344, #2a2a38);
  color: #bbbbcc;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.cancel-btn:hover {
  background: linear-gradient(145deg, #3f3f55, #373749);
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
}

.confirm-btn {
  padding: 8px 16px;
  background: linear-gradient(145deg, #d9534f, #c43c38);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.confirm-btn:hover {
  background: linear-gradient(145deg, #e05c58, #d24842);
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 80, 80, 0.2);
}

/* 导入部分的样式 */
.import-area {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.dropzone {
  flex: 1;
  border: 2px dashed rgba(74, 107, 175, 0.4);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.215, 0.61, 0.355, 1);
  background: linear-gradient(145deg, rgba(30, 30, 50, 0.3), rgba(25, 25, 40, 0.3));
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.2);
}

.dropzone.active {
  border-color: rgba(74, 107, 175, 0.8);
  background: linear-gradient(145deg, rgba(74, 107, 175, 0.15), rgba(60, 90, 150, 0.15));
  transform: scale(0.98);
}

.dropzone-content {
  text-align: center;
  color: #888899;
  padding: 40px;
}

.upload-icon {
  font-size: 54px;
  margin-bottom: 20px;
  opacity: 0.7;
  filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.3));
  transition: all 0.3s;
}

.dropzone:hover .upload-icon {
  transform: translateY(-5px);
  opacity: 0.9;
}

.upload-btn {
  margin-top: 20px;
  padding: 10px 24px;
  background: linear-gradient(145deg, #4a6baf, #3a5b9f);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.25s;
  font-weight: 500;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
}

.upload-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(255, 255, 255, 0) 100%);
  transform: translateX(-100%);
  transition: transform 1s;
}

.upload-btn:hover {
  background: linear-gradient(145deg, #5a7bc0, #4a6baf);
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
}

.upload-btn:hover::after {
  transform: translateX(100%);
}

/* 节点源标识增强 */
.node-source-badge {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
  color: white;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.node-source-badge::before {
  margin-right: 4px;
  font-size: 10px;
}

.builtin-node {
  background: linear-gradient(145deg, rgba(74, 107, 175, 0.9), rgba(60, 90, 150, 0.9));
}

.builtin-node::before {
  content: "🔧";
}

.imported-node {
  background: linear-gradient(145deg, rgba(114, 196, 114, 0.9), rgba(90, 170, 90, 0.9));
}

.imported-node::before {
  content: "📦";
}

.custom-node {
  background: linear-gradient(145deg, rgba(255, 160, 122, 0.9), rgba(230, 140, 100, 0.9));
}

.custom-node::before {
  content: "⚙️";
}

/* 通知样式增强 */
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05);
  z-index: 1100;
  animation: fadeIn 0.3s ease, slideInRight 0.4s cubic-bezier(0.215, 0.61, 0.355, 1);
  max-width: 400px;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  font-weight: 500;
  display: flex;
  align-items: center;
}

.notification.success {
  background: linear-gradient(145deg, rgba(25, 135, 84, 0.85), rgba(20, 110, 70, 0.85));
  color: white;
  border: 1px solid rgba(25, 135, 84, 0.2);
}

.notification.success::before {
  content: "✅";
  margin-right: 10px;
  font-size: 16px;
}

.notification.error {
  background: linear-gradient(145deg, rgba(220, 53, 69, 0.85), rgba(190, 40, 50, 0.85));
  color: white;
  border: 1px solid rgba(220, 53, 69, 0.2);
}

.notification.error::before {
  content: "❌";
  margin-right: 10px;
  font-size: 16px;
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes slideInRight {
  from {
    transform: translateX(100px);
  }

  to {
    transform: translateX(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.9);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 导入代码摘要样式 */
.import-summary {
  background-color: #1a1a28;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  animation: fadeIn 0.3s;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.import-header {
  background: linear-gradient(90deg, #2d2d44 0%, #252536 100%);
  padding: 15px 20px;
  border-bottom: 1px solid #3a3a58;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.import-header h3 {
  margin: 0;
  font-size: 16px;
  color: #fff;
  display: flex;
  align-items: center;
}

.import-icon-container {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(74, 107, 175, 0.2);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  margin-right: 10px;
}

.import-icon {
  font-size: 16px;
}

.file-info {
  display: flex;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.2);
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  color: #bbbbcc;
}

.file-icon {
  margin-right: 6px;
}

.file-name {
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
}

.import-content {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.option-group {
  margin-bottom: 20px;
}

.option-group label {
  display: flex;
  align-items: center;
  color: #bbbbcc;
  font-weight: 600;
  margin-bottom: 10px;
  font-size: 14px;
}

.option-icon {
  margin-right: 8px;
  font-size: 16px;
}

.detected-classes-container {
  background-color: rgba(30, 30, 45, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  padding: 12px;
  max-height: 120px;
  overflow-y: auto;
}

.detected-classes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detected-class {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  background-color: rgba(74, 107, 175, 0.2);
  border-radius: 4px;
  animation: fadeIn 0.5s ease backwards;
}

.class-icon {
  margin-right: 6px;
  font-size: 14px;
}

.class-name {
  font-weight: 500;
  color: #ddddff;
}

.no-classes-detected {
  color: #ffa07a;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 15px;
}

.warning-icon {
  margin-right: 8px;
  font-size: 16px;
}

.code-preview-group {
  margin-bottom: 15px;
}

.code-badge {
  margin-left: 8px;
  background-color: rgba(74, 107, 175, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: normal;
  color: #99aadd;
}

.code-preview-container {
  background-color: #151520;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 10px;
}

.code-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: #1a1a28;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.code-dots {
  display: flex;
  gap: 6px;
  margin-right: 12px;
}

.code-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.code-dot.red {
  background-color: #ff6057;
}

.code-dot.yellow {
  background-color: #febc2e;
}

.code-dot.green {
  background-color: #28c840;
}

.code-title {
  color: #8888aa;
  font-size: 12px;
}

.code-preview {
  max-height: 300px;
  overflow-y: auto;
  margin: 0;
  padding: 12px;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  tab-size: 4;
}

.import-note {
  font-size: 12px;
  color: #8888aa;
  padding: 8px 12px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.note-icon {
  margin-right: 8px;
  font-size: 14px;
}

.import-actions {
  padding: 15px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.1);
}

.action-info {
  display: flex;
  align-items: center;
  color: #bbbbcc;
  font-size: 13px;
}

.info-icon {
  margin-right: 8px;
  font-size: 16px;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.animated-btn {
  position: relative;
  overflow: hidden;
  background: linear-gradient(45deg, #4a6baf 0%, #6c8cd5 100%);
}

.animated-btn:hover {
  background: linear-gradient(45deg, #5c7dc1 0%, #7e9ee7 100%);
}

.animated-btn .btn-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(255, 255, 255, 0) 100%);
  transform: translateX(-100%);
  transition: transform 1s;
}

.animated-btn:hover .btn-gradient {
  transform: translateX(100%);
}

.btn-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
}

.btn-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  margin-top: -10px;
  margin-left: -10px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: block;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 响应式调整 */
@media (max-width: 600px) {
  .sidebar-content {
    width: 100%;
  }
}

/* 滚动条美化 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgba(74, 107, 175, 0.5);
  border-radius: 4px;
  transition: all 0.3s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(74, 107, 175, 0.8);
}

/* 针对特定容器的滚动条样式 */
.filter-sidebar::-webkit-scrollbar,
.nodes-list-container::-webkit-scrollbar,
.code-container::-webkit-scrollbar,
.detected-classes-container::-webkit-scrollbar,
.code-preview::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.filter-sidebar::-webkit-scrollbar-track,
.nodes-list-container::-webkit-scrollbar-track,
.code-container::-webkit-scrollbar-track,
.detected-classes-container::-webkit-scrollbar-track,
.code-preview::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.filter-sidebar::-webkit-scrollbar-thumb,
.nodes-list-container::-webkit-scrollbar-thumb,
.code-container::-webkit-scrollbar-thumb,
.detected-classes-container::-webkit-scrollbar-thumb,
.code-preview::-webkit-scrollbar-thumb {
  background: rgba(74, 107, 175, 0.4);
  border-radius: 3px;
}

.filter-sidebar::-webkit-scrollbar-thumb:hover,
.nodes-list-container::-webkit-scrollbar-thumb:hover,
.code-container::-webkit-scrollbar-thumb:hover,
.detected-classes-container::-webkit-scrollbar-thumb:hover,
.code-preview::-webkit-scrollbar-thumb:hover {
  background: rgba(74, 107, 175, 0.7);
}

/* 动态下拉动画 */
.node-group-header,
.detected-class {
  animation: fadeInDown 0.3s ease-out;
  animation-fill-mode: both;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-15px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 节点卡片动态排列效果 - 移除这些延迟 */
/* 交互反馈增强 */
.tab-btn::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, #4a6baf, #6c8cd5);
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 0.3s ease;
}

.tab-btn.active::after {
  transform: scaleX(1);
  transform-origin: left;
}

.tab-btn:hover::after {
  transform: scaleX(0.3);
}

/* 节点详情滑入动画 */
.node-details {
  animation: slideInRight 0.3s cubic-bezier(0.215, 0.61, 0.355, 1);
  background: linear-gradient(160deg, #1c1c2c 0%, #181824 100%);
  box-shadow: 0 -5px 15px rgba(0, 0, 0, 0.2);
}

/* 改进搜索框 */
.search-input {
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-input:focus {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transform: translateY(-1px);
}

.hidden-file-input {
  display: none;
}

/* 预览对话框样式 */
.preview-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.preview-dialog {
  background: linear-gradient(160deg, #1e1e2d 0%, #1a1a25 100%);
  border-radius: 10px;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);
  width: 500px;
  max-width: 90%;
  max-height: 90vh;
  overflow: hidden;
  animation: fadeInScale 0.3s cubic-bezier(0.215, 0.61, 0.355, 1);
}

.preview-content {
  display: flex;
  flex-direction: column;
  padding: 25px;
}

.preview-content h3 {
  display: flex;
  align-items: center;
  margin-top: 0;
  margin-bottom: 20px;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.node-preview-display {
  margin: 20px 0;
  display: flex;
  justify-content: center;
}

.node-preview-box {
  width: 240px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
  transform: perspective(800px) rotateX(5deg);
  transition: all 0.3s;
}

.node-preview-box:hover {
  transform: perspective(800px) rotateX(0deg) translateY(-5px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.5);
}

.node-preview-title {
  padding: 12px;
  font-weight: 600;
  color: white;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
  letter-spacing: 0.5px;
}

.node-preview-box.builtin .node-preview-title {
  background: linear-gradient(145deg, rgba(74, 107, 175, 0.9), rgba(60, 90, 150, 0.9));
}

.node-preview-box.imported .node-preview-title {
  background: linear-gradient(145deg, rgba(114, 196, 114, 0.9), rgba(90, 170, 90, 0.9));
}

.node-preview-box.custom .node-preview-title {
  background: linear-gradient(145deg, rgba(255, 160, 122, 0.9), rgba(230, 140, 100, 0.9));
}

.node-preview-body {
  padding: 20px 15px;
  background: linear-gradient(160deg, #252536, #202030);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.node-preview-io {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.node-preview-inputs,
.node-preview-outputs {
  display: flex;
  justify-content: space-around;
}

.node-preview-content {
  background-color: rgba(20, 20, 30, 0.6);
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
}

.node-preview-path {
  font-size: 11px;
  color: #8888aa;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.8;
}

.node-preview-category {
  display: inline-block;
  background: linear-gradient(90deg, rgba(74, 107, 175, 0.3) 0%, rgba(74, 107, 175, 0.15) 100%);
  color: #99aadd;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid rgba(74, 107, 175, 0.2);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.io-slot {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: linear-gradient(145deg, #444455, #333344);
  cursor: pointer;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: all 0.2s;
}

.io-slot:hover {
  transform: scale(1.2);
  box-shadow: 0 0 0 3px rgba(74, 107, 175, 0.2), 0 2px 5px rgba(0, 0, 0, 0.3);
}

.io-slot:hover::after {
  content: attr(data-name) " (" attr(data-type) ")";
  position: absolute;
  bottom: 25px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(20, 20, 30, 0.9);
  color: white;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 11px;
  white-space: nowrap;
  z-index: 1;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

.node-preview-actions {
  display: flex;
  justify-content: center;
  margin-top: 25px;
}

/* 全局样式增强 */
.sidebar-content {
  background: linear-gradient(160deg, #1e1e2d 0%, #1a1a25 100%);
  box-shadow: -5px 0 20px rgba(0, 0, 0, 0.5);
}

/* 全局动画效果 */
@keyframes shimmer {
  0% {
    background-position: -100% 0;
  }

  100% {
    background-position: 100% 0;
  }
}

.node-manager-sidebar {
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

span {
  color: #fff;
}

code {
  color: #fff;
}

/* 添加拖拽样式 */
.node-card {
  /* 保持现有样式不变，添加以下样式 */
  cursor: grab;
  user-select: none;
}

.node-card:active {
  cursor: grabbing;
}

/* 添加拖拽时的视觉效果 */
@keyframes pulse-border {
  0% {
    box-shadow: 0 0 0 0 rgba(74, 107, 175, 0.7);
  }

  70% {
    box-shadow: 0 0 0 10px rgba(74, 107, 175, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(74, 107, 175, 0);
  }
}

.node-card:hover {
  /* 保持现有样式不变，添加以下样式 */
  animation: none;
}

.node-card[draggable=true]:hover::before {

  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(20, 20, 30, 0.9);
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
  z-index: 10;
}

.node-card[draggable=true]:hover:hover::before {
  opacity: 1;
}
</style>
