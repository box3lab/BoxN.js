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


            </div>

            <!-- 节点列表和详情 -->
            <div class="nodes-content">
              <div class="nodes-list-container">
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
                      @dragstart="handleDragStart($event, node)" @dragend="handleDragEnd"
                      :data-source="getNodeSource(node)">
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

  <!-- 节点详情对话框 -->
  <div v-if="selectedNode" class="node-details-overlay" @click.self="selectedNode = null">
    <div class="node-details-dialog">
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
          <span class="info-value path-value clickable" @click="copyToClipboard(selectedNode.nodeType)" title="点击复制">{{
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
  <div v-if="showNotificationFlag" class="notification" :class="notificationType" ref="notificationElement">
    {{ notificationMessage }}
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
    const notificationMessage = ref('')
    const notificationType = ref<'success' | 'error'>('success')
    const showNotificationFlag = ref(false)
    const notificationElement = ref<HTMLDivElement | null>(null)

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
    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
      notificationMessage.value = message
      notificationType.value = type
      showNotificationFlag.value = true

      // 更新通知元素的显示内容
      if (notificationElement.value) {
        notificationElement.value.textContent = message
      }

      setTimeout(() => {
        showNotificationFlag.value = false
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
      notificationMessage,
      notificationType,
      showNotificationFlag,
      notificationElement,
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
  right: 0;
  top: 50px;
  bottom: 0;
  width: 800px;
  background: rgba(15, 15, 25, 0.95);
  border-left: 1px solid rgba(156, 70, 255, 0.15);
  box-shadow: -5px 0 20px rgba(0, 0, 0, 0.4);
  z-index: 10001;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
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
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: rgba(10, 10, 18, 0.95);
  border-bottom: 1px solid rgba(156, 70, 255, 0.15);
  position: relative;
}

.sidebar-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg,
      rgba(156, 70, 255, 0) 0%,
      rgba(156, 70, 255, 0.6) 50%,
      rgba(156, 70, 255, 0) 100%);
  opacity: 0.8;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: white;
  display: flex;
  align-items: center;
}

.sidebar-header h2::before {
  content: '🧩';
  margin-right: 10px;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  color: #fff;
  background: rgba(156, 70, 255, 0.2);
  transform: scale(1.1);
}

.sidebar-tabs {
  display: flex;
  background: rgba(15, 15, 25, 0.95);
  border-bottom: 1px solid rgba(156, 70, 255, 0.1);
}

.tab-btn {
  padding: 10px 16px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  flex: 1;
  font-size: 14px;
  transition: all 0.2s ease;
  position: relative;
  font-weight: 500;
}

.tab-btn:hover {
  color: white;
  background: rgba(156, 70, 255, 0.1);
}

.tab-btn.active {
  color: white;
  background: rgba(156, 70, 255, 0.15);
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 10%;
  height: 2px;
  background: rgba(156, 70, 255, 0.8);
  border-radius: 1px;
  box-shadow: 0 0 6px rgba(156, 70, 255, 0.6);
}

.sidebar-body {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.tab-content {
  height: 100%;
  overflow: hidden;
}

/* 调整筛选栏样式以适应侧边栏 */
.registered-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  height: 100%;
  background: rgba(12, 12, 20, 0.5);
}

/* 左侧过滤栏 */
.filter-sidebar {
  padding: 15px;
  border-right: 1px solid rgba(156, 70, 255, 0.1);
  background: rgba(20, 20, 30, 0.3);
  overflow-y: auto;
}

/* 节点列表和详情 */
.nodes-content {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.nodes-list-container {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  transition: width 0.3s ease;
}

.nodes-list-container.with-details {
  width: 50%;
}

.nodes-list {
  display: flex;
  flex-direction: column;
}

.node-card {
  border: 1px solid rgba(156, 70, 255, 0.15);
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 8px;
  background: rgba(25, 25, 40, 0.4);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.node-card::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 3px;
  height: 100%;
  transition: all 0.2s ease;
  opacity: 0.5;
}

.node-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg,
      rgba(207, 175, 243, 0) 0%,
      rgba(156, 70, 255, 0.03) 50%,
      rgba(156, 70, 255, 0) 100%);
  transform: translateX(-100%);
  transition: transform 0.8s ease;
  pointer-events: none;
}

.node-card:hover {
  background: rgba(35, 35, 55, 0.5);
  border-color: rgba(156, 70, 255, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.node-card:hover::after {
  opacity: 0.8;
}

.node-card:hover::before {
  transform: translateX(100%);
}

.node-card.selected {
  background: rgba(156, 70, 255, 0.15);
  border-color: rgba(156, 70, 255, 0.4);
  box-shadow: 0 0 0 1px rgba(156, 70, 255, 0.2), 0 4px 12px rgba(0, 0, 0, 0.25);
}

/* 不同类型节点的边框颜色 */
.node-card[data-source="builtin"]::after {
  background: rgba(76, 175, 80, 0.8);
}

.node-card[data-source="imported"]::after {
  background: rgba(255, 152, 0, 0.8);
}

.node-card[data-source="custom"]::after {
  background: rgba(156, 70, 255, 0.8);
}

.node-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.node-name {
  font-weight: 600;
  font-size: 14px;
  color: white;
}

.node-path {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.node-category {
  font-size: 11px;
  background: rgba(156, 70, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
  padding: 2px 8px;
  border-radius: 30px;
  display: inline-block;
}

.node-source-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.node-source-badge.source-builtin {
  background: rgba(76, 175, 80, 0.15);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.node-source-badge.source-imported {
  background: rgba(255, 152, 0, 0.15);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 152, 0, 0.3);
}

.node-source-badge.source-custom {
  background: rgba(156, 70, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(156, 70, 255, 0.3);
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
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 10px;
  background: rgba(156, 70, 255, 0.1);
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(156, 70, 255, 0.15);
}

.group-icon {
  margin-right: 8px;
  font-size: 14px;
}

.group-title {
  flex: 1;
  font-weight: 500;
  font-size: 13px;
  color: white;
}

.group-count {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  margin-right: 10px;
}

.group-delete-btn {
  background: rgba(211, 47, 47, 0.1);
  border: 1px solid rgba(211, 47, 47, 0.2);
  border-radius: 4px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.group-delete-btn:hover {
  background: rgba(211, 47, 47, 0.2);
  transform: scale(1.1);
}

/* 节点详情样式 */
.node-details {
  width: 50%;
  border-left: 1px solid rgba(156, 70, 255, 0.1);
  background: rgba(20, 20, 30, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: rgba(20, 20, 30, 0.5);
  border-bottom: 1px solid rgba(156, 70, 255, 0.1);
}

.details-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: white;
}

.close-details-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-details-btn:hover {
  color: white;
  background: rgba(156, 70, 255, 0.2);
  transform: scale(1.1);
}

/* 节点信息项样式 */
.node-info-section {
  padding: 15px;
  border-bottom: 1px solid rgba(156, 70, 255, 0.1);
}

.node-info-item {
  display: flex;
  margin-bottom: 8px;
}

.info-label {
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  width: 60px;
  flex-shrink: 0;
}

.info-value {
  flex: 1;
  color: white;
  word-break: break-all;
}

.info-value.clickable {
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0 4px;
  border-radius: 3px;
}

.info-value.clickable:hover {
  background: rgba(156, 70, 255, 0.1);
}

/* 源类型徽章 */
.source-builtin {
  background: rgba(76, 175, 80, 0.15);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.source-imported {
  background: rgba(255, 152, 0, 0.15);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 152, 0, 0.3);
}

.source-custom {
  background: rgba(156, 70, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(156, 70, 255, 0.3);
}

/* 导入区域样式 */
.import-area {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.dropzone {
  flex: 1;
  border: 2px dashed rgba(156, 70, 255, 0.3);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  background: rgba(156, 70, 255, 0.05);
}

.dropzone.active {
  border-color: rgba(156, 70, 255, 0.7);
  background: rgba(156, 70, 255, 0.1);
  transform: scale(0.99);
}

.upload-btn {
  margin-top: 15px;
  padding: 8px 16px;
  background: linear-gradient(to bottom, rgba(156, 70, 255, 0.3), rgba(156, 70, 255, 0.2));
  color: white;
  border: 1px solid rgba(156, 70, 255, 0.4);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  position: relative;
  overflow: hidden;
}

.upload-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.upload-btn:hover {
  background: linear-gradient(to bottom, rgba(156, 70, 255, 0.4), rgba(156, 70, 255, 0.3));
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(156, 70, 255, 0.3);
}

.upload-btn:hover::before {
  opacity: 1;
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  background: rgba(20, 20, 35, 0.3);
  border-radius: 8px;
  border: 1px dashed rgba(156, 70, 255, 0.2);
  margin: 20px;
  color: rgba(255, 255, 255, 0.6);
}

.empty-state::before {
  content: '🔍';
  font-size: 36px;
  margin-bottom: 16px;
  opacity: 0.7;
  animation: float 3s ease-in-out infinite;
}

.empty-state p {
  font-size: 14px;
  margin: 0 0 10px 0;
}

/* 确认对话框样式 */
.confirmation-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 40000;
}

.confirmation-dialog {
  background: rgb(16, 16, 26);
  border-radius: 8px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(156, 70, 255, 0.2);
  width: 380px;
  max-width: 90%;
  overflow: hidden;
  animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.confirmation-header {
  background: rgba(30, 30, 45, 0.7);
  padding: 12px 16px;
  border-bottom: 1px solid rgba(156, 70, 255, 0.2);
  position: relative;
}

.confirmation-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
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
  padding: 16px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
  font-size: 13px;
}

.confirmation-actions {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px;
  border-top: 1px solid rgba(156, 70, 255, 0.1);
  gap: 8px;
  background: rgba(12, 12, 22, 1);
}

.confirmation-actions .cancel-btn {
  padding: 6px 14px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 12px;
  min-width: 70px;
  background: rgba(35, 35, 50, 0.5);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(156, 70, 255, 0.25);
}

.confirmation-actions .cancel-btn:hover {
  background: rgba(35, 35, 50, 0.7);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.confirmation-actions .confirm-btn {
  padding: 6px 14px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 12px;
  min-width: 70px;
  background: rgba(211, 47, 47, 0.15);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(211, 47, 47, 0.3);
  position: relative;
}

.confirmation-actions .confirm-btn::after {
  content: '';
  position: absolute;
  top: -1px;
  left: 10px;
  right: 10px;
  height: 2px;
  background: rgba(211, 47, 47, 0.6);
  border-radius: 1px;
}

.confirmation-actions .confirm-btn:hover {
  background: rgba(211, 47, 47, 0.25);
  color: white;
  border-color: rgba(211, 47, 47, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
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
  border-radius: 10px;
  padding: 5px;
}

.builtin-node::before {
  content: "🔧";
}

.imported-node {
  background: linear-gradient(145deg, rgba(114, 196, 114, 0.9), rgba(90, 170, 90, 0.9));
  border-radius: 10px;
  padding: 5px;
}

.imported-node::before {
  content: "📦";
}

.custom-node {
  background: linear-gradient(145deg, rgba(255, 160, 122, 0.9), rgba(230, 140, 100, 0.9));
  border-radius: 10px;
  padding: 5px;
}

.custom-node::before {
  content: "⚙️";
}

/* 通知样式增强 */
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

/* 代码预览和高亮 */
.code-section-title {
  margin: 18px 18px 10px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
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
  background: rgba(15, 15, 25, 0.7);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(156, 70, 255, 0.1);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
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
  border-left: 1px solid rgba(156, 70, 255, 0.2);
}

.builtin-code-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.5);
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

/* 导入节点样式 */
.import-summary {
  background: rgba(20, 20, 35, 0.7);
  border-radius: 8px;
  border: 1px solid rgba(156, 70, 255, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  height: 100%;
}

.import-header {
  padding: 15px;
  background: rgba(25, 25, 40, 0.8);
  border-bottom: 1px solid rgba(156, 70, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.import-header h3 {
  margin: 0;
  font-size: 16px;
  color: white;
  display: flex;
  align-items: center;
  font-weight: 500;
}

.import-icon-container {
  width: 30px;
  height: 30px;
  background: rgba(156, 70, 255, 0.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
}

.import-icon {
  font-size: 16px;
}

.file-info {
  display: flex;
  align-items: center;
  background: rgba(156, 70, 255, 0.1);
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.file-icon {
  margin-right: 5px;
}

.import-content {
  padding: 15px;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.option-group {
  background: rgba(25, 25, 40, 0.5);
  border-radius: 8px;
  border: 1px solid rgba(156, 70, 255, 0.1);
  padding: 15px;
}

.option-group label {
  display: flex;
  align-items: center;
  font-weight: 500;
  color: white;
  margin-bottom: 10px;
  font-size: 14px;
}

.option-icon {
  margin-right: 8px;
}

.detected-classes-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.detected-class {
  display: flex;
  align-items: center;
  background: rgba(156, 70, 255, 0.1);
  border: 1px solid rgba(156, 70, 255, 0.2);
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 12px;
  color: white;
  animation: fadeIn 0.5s ease both;
}

.class-icon {
  margin-right: 6px;
}

.no-classes-detected {
  padding: 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(211, 47, 47, 0.05);
  border: 1px solid rgba(211, 47, 47, 0.2);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.warning-icon {
  font-size: 24px;
}

.code-preview-container {
  background: rgba(15, 15, 25, 0.9);
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid rgba(156, 70, 255, 0.15);
}

.code-header {
  background: rgba(10, 10, 20, 0.8);
  padding: 8px 12px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid rgba(156, 70, 255, 0.1);
}

.code-dots {
  display: flex;
  gap: 6px;
  margin-right: 10px;
}

.code-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.code-dot.red {
  background: #ff5f56;
}

.code-dot.yellow {
  background: #ffbd2e;
}

.code-dot.green {
  background: #27c93f;
}

.code-title {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}

.code-preview {
  padding: 15px;
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  max-height: 300px;
  overflow-y: auto;
  color: rgba(255, 255, 255, 0.9);
}

.import-note {
  margin-top: 10px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: rgba(156, 70, 255, 0.05);
  border-radius: 4px;
  border-left: 3px solid rgba(156, 70, 255, 0.3);
}

.note-icon {
  margin-right: 6px;
}

.import-actions {
  padding: 15px;
  background: rgba(15, 15, 25, 0.8);
  border-top: 1px solid rgba(156, 70, 255, 0.1);
}

.action-info {
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 12px;
  font-size: 13px;
}

.info-icon {
  margin-right: 8px;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.action-btn {
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.cancel-btn {
  background: rgba(35, 35, 50, 0.5);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(156, 70, 255, 0.25);
}

.cancel-btn:hover {
  background: rgba(35, 35, 50, 0.7);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.import-btn {
  background: linear-gradient(to bottom, rgba(156, 70, 255, 0.4), rgba(156, 70, 255, 0.3));
  color: white;
  border: 1px solid rgba(156, 70, 255, 0.5);
  position: relative;
  overflow: hidden;
}

.import-btn:hover {
  background: linear-gradient(to bottom, rgba(156, 70, 255, 0.5), rgba(156, 70, 255, 0.4));
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(156, 70, 255, 0.3);
}

.animated-btn .btn-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 6px;
}

.animated-btn .btn-gradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 200%;
  height: 100%;
  background: linear-gradient(90deg,
      rgba(156, 70, 255, 0) 0%,
      rgba(156, 70, 255, 0.2) 25%,
      rgba(156, 70, 255, 0.3) 50%,
      rgba(156, 70, 255, 0.2) 75%,
      rgba(156, 70, 255, 0) 100%);
  transform: translateX(-100%);
  transition: transform 0.5s ease;
}

.animated-btn:hover .btn-gradient {
  transform: translateX(0);
}

/* 通知样式 */
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

.notification-message {
  color: white;
  font-size: 14px;
}

.notification.success {
  border-left-color: rgba(76, 175, 80, 0.7);
  background: rgba(76, 175, 80, 0.15);
}

.notification.error {
  border-left-color: rgba(211, 47, 47, 0.7);
  background: rgba(211, 47, 47, 0.15);
}

.notification.warning {
  border-left-color: rgba(255, 152, 0, 0.7);
  background: rgba(255, 152, 0, 0.15);
}

/* 节点预览对话框 */
.preview-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(5px);
  animation: fadeIn 0.3s ease;
}

.preview-dialog {
  background: rgba(15, 15, 25, 0.95);
  border-radius: 10px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(156, 70, 255, 0.2);
  width: 550px;
  max-width: 90vw;
  overflow: hidden;
  animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.preview-content {
  padding: 20px;
}

.preview-content h3 {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 500;
  color: white;
  display: flex;
  align-items: center;
  gap: 10px;
}

.node-preview-display {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.node-preview-box {
  width: 300px;
  border-radius: 8px;
  background: rgba(25, 25, 40, 0.7);
  border: 1px solid rgba(156, 70, 255, 0.2);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.node-preview-box.builtin {
  border-color: rgba(76, 175, 80, 0.3);
}

.node-preview-box.imported {
  border-color: rgba(255, 152, 0, 0.3);
}

.node-preview-box.custom {
  border-color: rgba(156, 70, 255, 0.3);
}

.node-preview-title {
  padding: 10px 15px;
  background: rgba(30, 30, 45, 0.8);
  color: white;
  font-weight: 500;
  font-size: 14px;
  border-bottom: 1px solid rgba(156, 70, 255, 0.1);
}

.node-preview-body {
  padding: 15px;
}

.node-preview-io {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.node-preview-inputs,
.node-preview-outputs {
  display: flex;
  gap: 8px;
}

.node-preview-content {
  padding: 10px;
  background: rgba(20, 20, 35, 0.6);
  border-radius: 4px;
  font-size: 12px;
}

.node-preview-path {
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 5px;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 11px;
}

.node-preview-category {
  display: inline-block;
  padding: 2px 8px;
  background: rgba(156, 70, 255, 0.15);
  color: white;
  border-radius: 12px;
  font-size: 11px;
}

.io-slot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid rgba(156, 70, 255, 0.6);
  background: rgba(156, 70, 255, 0.2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.io-slot:hover {
  transform: scale(1.2);
  background: rgba(156, 70, 255, 0.4);
}

.node-preview-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.node-preview-actions .action-btn {
  background: linear-gradient(to bottom, rgba(156, 70, 255, 0.3), rgba(156, 70, 255, 0.2));
  color: white;
  border: 1px solid rgba(156, 70, 255, 0.4);
  padding: 8px 20px;
  font-size: 13px;
}

.node-preview-actions .action-btn:hover {
  background: linear-gradient(to bottom, rgba(156, 70, 255, 0.4), rgba(156, 70, 255, 0.3));
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(156, 70, 255, 0.3);
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0.95);
    opacity: 0;
  }

  to {
    transform: scale(1);
    opacity: 1;
  }
}

.sidebar-collapse-btn {
  position: absolute;
  left: -30px;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 60px;
  background: rgba(15, 15, 25, 0.95);
  border: 1px solid rgba(156, 70, 255, 0.15);
  border-right: none;
  border-radius: 8px 0 0 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: -3px 0 10px rgba(0, 0, 0, 0.2);
}

.sidebar-collapse-btn:hover {
  background: rgba(156, 70, 255, 0.2);
}

.filter-group {
  margin-bottom: 20px;
  animation: fadeIn 0.5s ease-out;
}

.filter-group-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  color: rgba(255, 255, 255, 0.85);
  display: flex;
  align-items: center;
  padding-left: 5px;
  position: relative;
}

.filter-group-title::before {
  content: '';
  display: inline-block;
  width: 3px;
  height: 14px;
  background: rgba(156, 70, 255, 0.8);
  margin-right: 8px;
  border-radius: 2px;
  box-shadow: 0 0 5px rgba(156, 70, 255, 0.4);
}

.category-filters {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.category-filter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 10px;
  background: rgba(30, 30, 45, 0.3);
  border: 1px solid rgba(156, 70, 255, 0.1);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: rgba(255, 255, 255, 0.8);
  position: relative;
  overflow: hidden;
}

.category-filter::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg,
      rgba(156, 70, 255, 0) 0%,
      rgba(156, 70, 255, 0.05) 50%,
      rgba(156, 70, 255, 0) 100%);
  transform: translateX(-100%);
  transition: transform 0.8s ease;
}

.category-filter:hover {
  background: rgba(40, 40, 60, 0.4);
  border-color: rgba(156, 70, 255, 0.2);
  transform: translateX(2px);
}

.category-filter:hover::before {
  transform: translateX(100%);
}

.category-filter.active {
  background: rgba(156, 70, 255, 0.15);
  border-color: rgba(156, 70, 255, 0.3);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.category-filter.active::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  background: rgba(156, 70, 255, 0.8);
  border-radius: 0 2px 2px 0;
}

.category-name {
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  position: relative;
  padding-left: 2px;
}

.category-filter:hover .category-name,
.category-filter.active .category-name {
  transform: translateX(2px);
}

.count {
  background: rgba(156, 70, 255, 0.2);
  color: rgba(255, 255, 255, 0.9);
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 11px;
  min-width: 24px;
  text-align: center;
  transition: all 0.2s ease;
  font-weight: 500;
}

.category-filter:hover .count {
  background: rgba(156, 70, 255, 0.3);
}

.category-filter.active .count {
  background: rgba(156, 70, 255, 0.4);
  color: white;
  box-shadow: 0 0 5px rgba(156, 70, 255, 0.3);
}

/* 来源过滤器样式 */
.source-builtin {
  border-left: 3px solid rgba(76, 175, 80, 0.5);
  background: rgba(76, 175, 80, 0.07);
}

.source-builtin.active,
.source-builtin:hover {
  background: rgba(76, 175, 80, 0.12);
  border-color: rgba(76, 175, 80, 0.7);
}

.source-imported {
  border-left: 3px solid rgba(255, 152, 0, 0.5);
  background: rgba(255, 152, 0, 0.07);
}

.source-imported.active,
.source-imported:hover {
  background: rgba(255, 152, 0, 0.12);
  border-color: rgba(255, 152, 0, 0.7);
}

.source-custom {
  border-left: 3px solid rgba(156, 70, 255, 0.5);
  background: rgba(156, 70, 255, 0.07);
}

.source-custom.active,
.source-custom:hover {
  background: rgba(156, 70, 255, 0.12);
  border-color: rgba(156, 70, 255, 0.7);
}

/* 搜索框样式 */
.search-container {
  position: relative;
  margin-bottom: 15px;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  background: rgba(25, 25, 40, 0.4);
  border: 1px solid rgba(156, 70, 255, 0.2);
  border-radius: 6px;
  color: white;
  font-size: 14px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.search-input:focus {
  background: rgba(30, 30, 45, 0.6);
  border-color: rgba(156, 70, 255, 0.4);
  outline: none;
  box-shadow: 0 0 0 2px rgba(156, 70, 255, 0.15);
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(156, 70, 255, 0.7);
  pointer-events: none;
  transition: all 0.2s ease;
}

.search-input:focus+.search-icon {
  color: rgba(156, 70, 255, 0.9);
}

/* 节点详情对话框 */
.node-details-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20000;
  animation: fadeIn 0.2s ease-out;
}

.node-details-dialog {
  background: rgba(15, 15, 25, 0.95);
  border-radius: 10px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(156, 70, 255, 0.2);
  width: 600px;
  max-width: 90%;
  max-height: 90vh;
  overflow: hidden;
  animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
}

.node-details-dialog .details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(10, 10, 18, 0.95);
  border-bottom: 1px solid rgba(156, 70, 255, 0.15);
  position: relative;
}

.node-details-dialog .details-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg,
      rgba(156, 70, 255, 0) 0%,
      rgba(156, 70, 255, 0.6) 50%,
      rgba(156, 70, 255, 0) 100%);
  opacity: 0.8;
}

.node-details-dialog .details-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: white;
  display: flex;
  align-items: center;
}

.node-details-dialog .details-header h3::before {
  content: '🧩';
  margin-right: 10px;
  font-size: 18px;
}

.node-details-dialog .node-info-section {
  padding: 20px;
  border-bottom: 1px solid rgba(156, 70, 255, 0.1);
  background: rgba(20, 20, 35, 0.3);
}

.node-details-dialog .node-info-item {
  display: flex;
  margin-bottom: 12px;
}

.node-details-dialog .node-info-item:last-child {
  margin-bottom: 0;
}

.node-details-dialog .info-label {
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  width: 80px;
  flex-shrink: 0;
}

.node-details-dialog .info-value {
  flex: 1;
  color: white;
  word-break: break-all;
}

.node-details-dialog .info-value.clickable {
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0 4px;
  border-radius: 3px;
}

.node-details-dialog .info-value.clickable:hover {
  background: rgba(156, 70, 255, 0.1);
}

.node-details-dialog .code-section-title {
  margin: 20px 20px 10px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  display: flex;
  align-items: center;
}

.node-details-dialog .code-section-title::before {
  content: "📄";
  margin-right: 8px;
  font-size: 15px;
}

.node-details-dialog .node-code {
  margin: 0 20px 20px;
  background: rgba(15, 15, 25, 0.7);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(156, 70, 255, 0.1);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
}

.node-details-dialog .code-container {
  max-height: 400px;
  overflow-y: auto;
  padding: 5px;
}

.node-details-dialog .details-actions {
  display: flex;
  justify-content: flex-end;
  padding: 15px 20px;
  border-top: 1px solid rgba(156, 70, 255, 0.1);
  gap: 10px;
  background: rgba(12, 12, 22, 1);
  margin-top: auto;
}

.node-details-dialog .action-btn {
  background: linear-gradient(to bottom, rgba(156, 70, 255, 0.3), rgba(156, 70, 255, 0.2));
  color: white;
  border: 1px solid rgba(156, 70, 255, 0.4);
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative;
  overflow: hidden;
}

.node-details-dialog .action-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.node-details-dialog .action-btn:hover {
  background: linear-gradient(to bottom, rgba(156, 70, 255, 0.4), rgba(156, 70, 255, 0.3));
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(156, 70, 255, 0.3);
}

.node-details-dialog .action-btn:hover::before {
  opacity: 1;
}

.nodes-list-container {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  width: 100%;
}
</style>
