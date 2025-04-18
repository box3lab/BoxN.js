<template>
  <div v-if="visible" class="node-manager-overlay" @click="closeOnOverlayClick">
    <div class="node-manager-dialog" @click.stop>
      <div class="dialog-header">
        <h2>节点管理器</h2>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <div class="dialog-tabs">
        <button :class="['tab-btn', { active: activeTab === 'registered' }]" @click="activeTab = 'registered'">
          已注册节点
        </button>
        <button :class="['tab-btn', { active: activeTab === 'import' }]" @click="activeTab = 'import'">
          导入节点
        </button>
      </div>

      <div class="dialog-content">
        <!-- 已注册节点列表 -->
        <div v-if="activeTab === 'registered'" class="tab-content">
          <div class="registered-layout">
            <!-- 左侧筛选栏 -->
            <div class="filter-sidebar">
              <div class="filter-title">
                筛选
              </div>
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

            <!-- 右侧节点列表和详情 -->
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
                      :class="{ 'selected': selectedNode === node }">
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
                        <span class="source-icon" v-if="getNodeSource(selectedNode) === 'imported'">📦</span>
                        <span class="source-icon" v-else-if="getNodeSource(selectedNode) === 'custom'">⚙️</span>
                        <span class="source-icon" v-else>🔧</span>
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
                    系统将保留节点原定义的路径，仅在前面添加 import/ 前缀
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

    <!-- 确认删除对话框 -->
    <div v-if="showDeleteConfirmation" class="confirmation-dialog">
      <div class="confirmation-content">
        <h3>确认删除</h3>
        <p v-if="!isGroupDelete">确定要删除节点 "{{ selectedNode?.className }}" 吗？此操作不可恢复。</p>
        <p v-else>确定要删除 "{{ selectedGroupName }}" 组中的全部 {{ selectedGroupNodes.length }} 个节点吗？此操作不可恢复。</p>
        <div class="confirmation-actions">
          <button class="action-btn cancel-btn" @click="showDeleteConfirmation = false">取消</button>
          <button v-if="!isGroupDelete" class="action-btn delete-btn" @click="deleteNode">删除</button>
          <button v-else class="action-btn delete-btn" @click="deleteNodeGroup">
            <span class="btn-icon">🗑️</span> 删除整组
          </button>
        </div>
      </div>
    </div>

    <!-- 节点预览对话框 -->
    <div v-if="showPreview" class="preview-dialog">
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

    <!-- 通知提示 -->
    <div v-if="notification" class="notification" :class="[notification.type, 'notification-animate']">
      <div class="notification-icon">
        <span v-if="notification.type === 'success'">✓</span>
        <span v-else>✗</span>
      </div>
      <div class="notification-message">{{ notification.message }}</div>
    </div>
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
  if (node.nodeType.startsWith('import/')) {
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

  emits: ['close', 'node-imported', 'node-deleted', 'preview-node'],

  setup(props, { emit }) {
    // 激活的选项卡
    const activeTab = ref('registered')

    // 节点数据
    const customNodes = ref<NodeDefinition[]>([])
    const selectedNode = ref<NodeDefinition | null>(null)

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
          !nodeType.startsWith('custom/') &&
          !nodeType.startsWith('import/')) {

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

      // 为每个检测到的类创建一个节点
      for (const className of detectedClasses.value) {
        // 构建节点类型路径 - 使用import前缀标识导入节点
        // 修改这里，保留原始路径结构，但添加import前缀
        const fileName = uploadedFileName.value.replace(/\.[^/.]+$/, "");
        const nodeType = `import/${fileName}/${className}`;

        // 创建节点
        const success = await createNodeFile(className, nodeType, importedCode.value);

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
      if (node.nodeType.startsWith('import/')) {
        return 'imported'
      }

      // 检查是否是自定义节点
      if (node.nodeType.startsWith('custom/')) {
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
      customNodes.value.forEach(node => {
        if (node.category) {
          counts[node.category] = (counts[node.category] || 0) + 1
        }
      })
      return counts
    })

    // 过滤掉没有节点的分类
    const filteredCategories = computed(() => {
      return availableCategories.value.filter(category =>
        categoryCounts.value[category] && categoryCounts.value[category] > 0
      )
    })

    // 计算来源类型数量
    const sourceTypeCounts = computed(() => {
      const counts = {
        builtin: 0,
        imported: 0,
        custom: 0
      }

      customNodes.value.forEach(node => {
        const source = getNodeSource(node)
        counts[source]++
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

          // 移除"import/"前缀
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

    return {
      activeTab,
      customNodes,
      selectedNode,
      searchQuery,
      availableCategories,
      selectedCategories,
      selectedSources,
      filteredNodes,
      groupedNodes, // 添加分组后的节点
      filteredCategories, // 添加过滤后的分类
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
      getSourceFilePath, // 添加源文件路径方法
      toggleCategory,
      categoryCounts,
      sourceTypeCounts,
      handleInputClick,
      handleOutputClick,
      copyToClipboard,
      uploadedFileName,
      isImporting
    }
  }
})
</script>

<style scoped>
.node-manager-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1200;
}

.node-manager-dialog {
  background-color: #1e1e2d;
  width: 90%;
  max-width: 1200px;
  height: 80%;
  border-radius: 10px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.dialog-header {
  background: linear-gradient(90deg, #2d2d44 0%, #252536 100%);
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #3a3a58;
}

.dialog-header h2 {
  color: #ffffff;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.dialog-header h2::before {
  content: "📊";
  margin-right: 10px;
  font-size: 22px;
}

.close-btn {
  background: transparent;
  border: none;
  color: #9999aa;
  font-size: 24px;
  cursor: pointer;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #ffffff;
}

.dialog-tabs {
  display: flex;
  background: linear-gradient(90deg, #252536 0%, #1e1e2d 100%);
  border-bottom: 1px solid #3a3a58;
}

.tab-btn {
  padding: 12px 20px;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  color: #9999aa;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.tab-btn::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 3px;
  background-color: #4a6baf;
  transition: all 0.3s ease;
  transform: translateX(-50%);
}

.tab-btn:hover {
  color: #ffffff;
}

.tab-btn:hover::after {
  width: 30%;
}

.tab-btn.active {
  color: #4a6baf;
  background-color: rgba(74, 107, 175, 0.1);
}

.tab-btn.active::after {
  width: 100%;
}

.dialog-content {
  flex: 1;
  overflow: hidden;
  display: flex;
}

.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* 已注册节点选项卡样式 */
.filter-sidebar {
  background: linear-gradient(180deg, rgba(18, 20, 32, 0.8) 0%, rgba(22, 25, 37, 0.9) 100%);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  width: 230px;
  min-width: 230px;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px 15px;
  position: relative;
  box-shadow: 3px 0 15px rgba(0, 0, 0, 0.1);
}

.filter-title {
  font-size: 16px;
  color: #ffffff;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-weight: 500;
}

.filter-group {
  margin-bottom: 20px;
}

.filter-group-title {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}

.filter-group-title::before {
  content: "🏷️";
  margin-right: 8px;
  font-size: 14px;
}

.category-filters {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-filter {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: rgba(255, 255, 255, 0.03);
}

.category-filter:hover {
  background-color: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
}

.category-filter.active {
  background-color: rgba(74, 107, 175, 0.2);
  color: #ffffff;
  font-weight: 500;
  border-left: 3px solid #4a6baf;
}

.category-filter .count {
  margin-left: auto;
  font-size: 11px;
  background-color: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.6);
}

.search-container {
  position: relative;
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  padding: 10px 14px 10px 36px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  color: #ffffff;
  font-size: 13px;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: rgba(74, 107, 175, 0.5);
  box-shadow: 0 0 0 2px rgba(74, 107, 175, 0.2);
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

.nodes-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 15px;
}

.node-card {
  border-radius: 8px;
  background-color: #1a1a2e;
  padding: 14px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}

.node-card:hover {
  background-color: #20203a;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.node-card.selected {
  border: 1px solid #4b7bec;
  background-color: rgba(75, 123, 236, 0.1);
}

.node-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.node-name {
  font-weight: 600;
  font-size: 16px;
  color: #fff;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-path {
  font-size: 12px;
  color: #a0a0c0;
  margin-bottom: 8px;
  font-family: 'Courier New', monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-meta {
  display: flex;
  justify-content: space-between;
}

.node-category {
  font-size: 12px;
  position: relative;
  padding-left: 18px;
  color: #c8c8d8;
}

.node-category::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23a0a0c0"><path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zm-9 9h7v7H4v-7zm9 0h7v7h-7v-7z"/></svg>');
  background-size: contain;
}

.node-source-badge {
  color: cornflowerblue;
  font-size: 11px;
  padding: 4px 10px 4px 26px;
  border-radius: 12px;
  position: relative;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.node-source-badge.imported-node {
  background-color: rgba(255, 193, 7, 0.25);
  color: #ffc107;
  border-left: 3px solid #ffc107;
}

.node-source-badge.imported-node::before {
  content: '📦';
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
}

.node-source-badge.custom-node {
  background-color: rgba(75, 123, 236, 0.25);
  color: #4b7bec;
  border-left: 3px solid #4b7bec;
}

.node-source-badge.custom-node::before {
  content: '⚙️';
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
}

.node-source-badge.builtin-node {
  background-color: rgba(46, 213, 115, 0.25);
  color: #2ed573;
  border-left: 3px solid #2ed573;
}

.node-source-badge.builtin-node::before {
  content: '🔧';
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 300px;
  color: #ffffff;
  text-align: center;
  padding: 20px;
}

.empty-state::before {
  content: "🔍";
  font-size: 48px;
  margin-bottom: 20px;
  opacity: 0.6;
}

.empty-state p {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
}

.node-details {
  width: 45%;

  overflow-y: auto;
  padding: 24px;
  background: linear-gradient(180deg, rgba(22, 25, 37, 0.8) 0%, rgba(26, 29, 42, 0.9) 100%);
  border-left: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: -3px 0 15px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.node-details h3 {
  margin: 0;
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.node-details h3::before {
  content: "📝";
  margin-right: 10px;
  font-size: 20px;
}

.close-details-btn {
  background: transparent;
  border: none;
  color: #9999aa;
  font-size: 22px;
  cursor: pointer;
  transition: color 0.2s;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.close-details-btn:hover {
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.1);
}

.node-info-section {
  background-color: rgba(28, 28, 42, 0.5);
  border-radius: 10px;
  padding: 18px;
  margin-bottom: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(58, 58, 88, 0.4);
}

.node-info-item {
  display: flex;
  margin-bottom: 14px;
  align-items: center;
}

.node-info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  font-weight: 500;
  color: #9999aa;
  width: 80px;
  flex-shrink: 0;
}

.info-value {
  color: #ffffff;
  word-break: break-word;
}

.path-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  padding: 5px 10px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  border-left: 3px solid rgba(74, 107, 175, 0.5);
}

.source-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.code-section-title {
  color: #ffffff;
  font-size: 16px;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.code-section-title::before {
  content: "👨‍💻";
  margin-right: 10px;
}

.node-code {
  background-color: transparent;
  padding: 0;
  margin-bottom: 20px;
  max-height: none;
  box-shadow: none;
  border: none;
}

.action-buttons {
  display: flex;
  gap: 12px;
  padding-top: 10px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}

.btn-icon {
  font-size: 16px;
}

.copy-btn {
  background: linear-gradient(135deg, #2d7494 0%, #1e5978 100%);
  color: #ffffff;
}

.copy-btn:hover {
  background: linear-gradient(135deg, #3a95bd 0%, #2d7494 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.preview-btn {
  background: linear-gradient(135deg, #8e44ad 0%, #6c3483 100%);
  color: #ffffff;
}

.preview-btn:hover {
  background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(142, 68, 173, 0.3);
}

.delete-btn {
  background: linear-gradient(135deg, #a83232 0%, #8a2a2a 100%);
  color: #ffffff;
}

.delete-btn:hover {
  background: linear-gradient(135deg, #c13e3e 0%, #a33030 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(168, 50, 50, 0.4);
}

/* 恢复必要的布局样式 */
.registered-layout {
  display: flex;
  flex-direction: row;
  height: 100%;
  overflow: hidden;
}

.nodes-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.nodes-list-container {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  width: 100%;
  transition: width 0.3s ease;
}

.nodes-list-container.with-details {
  width: 60%;
}

/* 自定义滚动条样式 */
.filter-sidebar::-webkit-scrollbar,
.nodes-list-container::-webkit-scrollbar,
.node-details::-webkit-scrollbar,
.code-editor::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.filter-sidebar::-webkit-scrollbar-track,
.nodes-list-container::-webkit-scrollbar-track,
.node-details::-webkit-scrollbar-track,
.code-editor::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.filter-sidebar::-webkit-scrollbar-thumb,
.nodes-list-container::-webkit-scrollbar-thumb,
.node-details::-webkit-scrollbar-thumb,
.code-editor::-webkit-scrollbar-thumb {
  background: rgba(74, 107, 175, 0.6);
  border-radius: 4px;
  border: 2px solid rgba(20, 20, 35, 0.8);
}

.filter-sidebar::-webkit-scrollbar-thumb:hover,
.nodes-list-container::-webkit-scrollbar-thumb:hover,
.node-details::-webkit-scrollbar-thumb:hover,
.code-editor::-webkit-scrollbar-thumb:hover {
  background: rgba(74, 107, 175, 0.8);
}

/* Firefox滚动条样式 */
.filter-sidebar,
.nodes-list-container,
.node-details,
.code-editor {
  scrollbar-width: thin;
  scrollbar-color: rgba(74, 107, 175, 0.6) rgba(0, 0, 0, 0.2);
}

/* 内置节点代码占位符样式 */
.builtin-code-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
  padding: 20px;
  text-align: center;
  color: #8b949e;
  background-color: #0d1117;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 15px;
  color: #8b949e;
}

.builtin-code-placeholder p {
  font-size: 16px;
  margin: 0 0 8px 0;
  font-weight: 500;
  color: #c9d1d9;
}

.builtin-code-placeholder small {
  font-size: 12px;
  opacity: 0.7;
  max-width: 80%;
  line-height: 1.4;
}

.builtin-code {
  display: flex;
  background-color: transparent;
}

/* 美化节点项 */
.node-card:hover {
  border-color: rgba(74, 107, 175, 0.7);
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
}

.node-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  background-color: transparent;
  transition: background-color 0.3s ease;
}

.node-card.active {
  border-color: rgba(74, 107, 175, 0.9);
  background: linear-gradient(145deg, rgba(74, 107, 175, 0.2) 0%, rgba(74, 107, 175, 0.05) 100%);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
}

/* 响应式布局 */
@media (max-width: 1600px) {
  .nodes-list {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
}

@media (max-width: 1200px) {
  .nodes-list {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }

  .filter-sidebar {
    width: 220px;
    min-width: 220px;
  }
}

/* Node Preview Dialog Styles */
.preview-dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.preview-content {
  background: linear-gradient(135deg, #1e2337 0%, #171b2c 100%);
  padding: 30px;
  border-radius: 12px;
  width: 650px;
  max-width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  animation: fadeInScale 0.25s ease-out forwards;
}

.preview-content h3 {
  color: #4fc1ff;
  margin: 0 0 20px 0;
  font-size: 22px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 12px;
}

.preview-content h3 .node-source-badge {
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: normal;
}

.preview-content .code-section {
  margin: 24px 0;
  border-radius: 8px;
  overflow: hidden;
}

.preview-content pre {
  margin: 0;
  padding: 16px;
  border-radius: 8px;
  background-color: #0f111a;
  border: 1px solid rgba(255, 255, 255, 0.05);
  max-height: 400px;
  overflow-y: auto;
}

.preview-content .close-btn {
  min-width: 100px;
  margin-top: 16px;
}

.preview-content .close-btn:hover {
  transform: translateY(-2px);
}

/* Custom scrollbar for the preview dialog */
.preview-content::-webkit-scrollbar {
  width: 8px;
}

.preview-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
}

.preview-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 10px;
}

.preview-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}

/* 导入节点页面样式 */
.import-area {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  gap: 20px;
  animation: fadeIn 0.3s ease-out;
  height: calc(100% - 40px);
  /* 确保高度能够容纳内容并允许滚动 */
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropzone {
  border: 2px dashed rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  transition: all 0.3s ease;
  background-color: rgba(15, 15, 28, 0.5);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  margin-bottom: 20px;
}

.dropzone::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.05) 50%,
      rgba(255, 255, 255, 0) 100%);
  animation: shine 3s infinite linear;
}

@keyframes shine {
  0% {
    left: -100%;
  }

  20%,
  100% {
    left: 200%;
  }
}

.dropzone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.upload-icon {
  font-size: 48px;
  color: rgba(255, 255, 255, 0.5);
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

.dropzone-content p {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  text-align: center;
  line-height: 1.5;
}

.upload-btn {
  background: linear-gradient(135deg, #2d7494 0%, #1e5978 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(45, 116, 148, 0.3);
}

.upload-btn:hover {
  background: linear-gradient(135deg, #3a95bd 0%, #2d7494 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(45, 116, 148, 0.4);
}

.hidden-file-input {
  display: none;
}

.import-summary {
  background-color: rgba(15, 15, 28, 0.7);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.3s ease-out;
}

.import-header {
  background: linear-gradient(90deg, #1a1a28, #252538);
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.import-header h3 {
  margin: 0;
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.import-header h3::before {
  content: "🧩";
  margin-right: 10px;
  font-size: 20px;
}

.file-info {
  display: flex;
  align-items: center;
  background-color: rgba(10, 10, 20, 0.3);
  padding: 10px 15px;
  border-radius: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.file-icon {
  margin-right: 8px;
  font-size: 16px;
}

.file-name {
  font-family: 'JetBrains Mono', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 300px;
}

.change-file-btn {
  margin-left: 12px;
  background: rgba(74, 107, 175, 0.2);
  border: 1px solid rgba(74, 107, 175, 0.3);
  color: rgba(255, 255, 255, 0.9);
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.change-icon {
  font-size: 14px;
}

.change-file-btn:hover {
  background-color: rgba(74, 107, 175, 0.3);
  color: white;
  transform: translateY(-1px);
}

.import-actions {
  background-color: rgba(15, 15, 28, 0.8);
  padding: 15px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 30px;
  border-radius: 0 0 10px 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  position: sticky;
  bottom: 0;
  z-index: 100;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

/* 新的动画按钮样式 */
.animated-btn {
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  border: none;
  color: white;
  font-weight: 600;
  font-size: 15px;
  min-width: 160px;
  padding: 12px 20px;
  position: relative;
  overflow: hidden;
  z-index: 10;
  box-shadow: 0 4px 15px rgba(39, 174, 96, 0.4);
  transform-style: preserve-3d;
  transition: transform 0.3s, box-shadow 0.3s;
}

.animated-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg,
      rgba(255, 255, 255, 0),
      rgba(255, 255, 255, 0.2),
      rgba(255, 255, 255, 0));
  animation: shine 2s infinite;
}

.btn-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, #27ae60, #2ecc71, #27ae60);
  background-size: 200% 100%;
  animation: gradientMove 3s linear infinite;
  z-index: -1;
}

.btn-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.animated-btn:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 8px 20px rgba(39, 174, 96, 0.6);
}

.animated-btn:disabled {
  background: linear-gradient(135deg, #7f8c8d, #95a5a6);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.7;
}

.animated-btn:disabled::before {
  animation: none;
}

.animated-btn:disabled .btn-gradient {
  animation: none;
  background: linear-gradient(90deg, #7f8c8d, #95a5a6);
}

@keyframes shine {
  0% {
    left: -100%;
  }

  20%,
  100% {
    left: 100%;
  }
}

@keyframes gradientMove {
  0% {
    background-position: 0% 0%;
  }

  100% {
    background-position: 200% 0%;
  }
}

.import-summary {
  max-height: calc(100vh - 250px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.import-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 15px;
}

/* 修改导入区域的滚动行为，确保按钮总是可见 */
.import-area {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

/* 自定义滚动条 */
.import-summary::-webkit-scrollbar {
  width: 8px;
}

.import-summary::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

.import-summary::-webkit-scrollbar-thumb {
  background: rgba(74, 107, 175, 0.5);
  border-radius: 4px;
}

.import-summary::-webkit-scrollbar-thumb:hover {
  background: rgba(74, 107, 175, 0.8);
}

.no-classes-detected {
  color: #ff6b6b;
  font-size: 14px;
  margin-top: 10px;
  background-color: rgba(255, 107, 107, 0.1);
  padding: 10px;
  border-radius: 6px;
  border-left: 3px solid #ff6b6b;
}

.category-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 8px;
  font-style: italic;
}

.import-actions {
  background-color: rgba(15, 15, 28, 0.8);
  padding: 15px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 30px;
  border-radius: 0 0 10px 10px;
  position: relative;
  z-index: 5;
}

.action-info {
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.info-icon {
  margin-right: 8px;
  font-size: 16px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
  position: relative;
  overflow: hidden;
}

.import-btn {
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  color: white;
  box-shadow: 0 4px 10px rgba(39, 174, 96, 0.3);
  z-index: 10;
}

.import-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(39, 174, 96, 0.4);
}

.import-btn:disabled {
  background: linear-gradient(135deg, #7f8c8d, #95a5a6);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.7;
}

.btn-loading {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  right: 12px;
  animation: spin 1s linear infinite;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #cccccc;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.dropzone.active {
  border-color: #4a6baf;
  background-color: rgba(74, 107, 175, 0.1);
  animation: pulse 2s infinite;
}

@keyframes pulse {

  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(74, 107, 175, 0.4);
  }

  50% {
    box-shadow: 0 0 0 15px rgba(74, 107, 175, 0);
  }
}

.dropzone:hover {
  border-color: rgba(255, 255, 255, 0.3);
  background-color: rgba(22, 22, 42, 0.7);
}

/* 自定义滚动条样式 */
.import-area::-webkit-scrollbar,
.import-summary::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.import-area::-webkit-scrollbar-track,
.import-summary::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

.import-area::-webkit-scrollbar-thumb,
.import-summary::-webkit-scrollbar-thumb {
  background: rgba(74, 107, 175, 0.5);
  border-radius: 4px;
}

.import-area::-webkit-scrollbar-thumb:hover,
.import-summary::-webkit-scrollbar-thumb:hover {
  background: rgba(74, 107, 175, 0.8);
}

/* Confirmation Dialog Styles */
.confirmation-dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.confirmation-content {
  background: linear-gradient(135deg, #1e2337 0%, #171b2c 100%);
  padding: 30px;
  border-radius: 12px;
  width: 450px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  animation: fadeInScale 0.25s ease-out forwards;
}

.confirmation-content h3 {
  color: #eb5757;
  margin: 0 0 20px 0;
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.confirmation-content h3::before {
  content: "⚠️";
  margin-right: 10px;
  font-size: 20px;
}

.confirmation-content p {
  color: #f5f5f5;
  font-size: 16px;
  margin-bottom: 24px;
  line-height: 1.5;
}

.confirmation-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #cccccc;
  min-width: 100px;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.delete-btn {
  min-width: 100px;
}

.delete-btn:hover {
  background: linear-gradient(135deg, #c13e3e 0%, #a33030 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(168, 50, 50, 0.4);
}

@keyframes fadeInScale {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }

  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* 节点预览样式 */
.node-preview-display {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 25px 0;
  padding: 20px;
  background: rgba(10, 10, 20, 0.3);
  border-radius: 12px;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.2);
}

.node-preview-box {
  width: 320px;
  background: #252536;
  border-radius: 8px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  padding: 0;
  position: relative;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.node-preview-box.builtin {
  border-left: 4px solid #2ed573;
  background: linear-gradient(145deg, #252536, #292945);
}

.node-preview-box.custom {
  border-left: 4px solid #4b7bec;
  background: linear-gradient(145deg, #252536, #292945);
}

.node-preview-box.imported {
  border-left: 4px solid #ffc107;
  background: linear-gradient(145deg, #252536, #292945);
}

.node-preview-title {
  font-weight: 600;
  font-size: 16px;
  color: #fff;
  padding: 12px 15px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  text-align: center;
}

.node-preview-body {
  padding: 20px 10px;
}

.node-preview-io {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.node-preview-inputs,
.node-preview-outputs {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.io-slot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
}

.io-slot:hover {
  transform: scale(1.2);
  background-color: rgba(255, 255, 255, 0.4);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
}

.io-slot::before {
  content: attr(data-name);
  position: absolute;
  white-space: nowrap;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  top: 50%;
  transform: translateY(-50%);
}

/* 输入插槽标记在左侧 */
.node-preview-inputs .io-slot {
  margin-left: -6px;
  border-left: 2px solid rgba(75, 123, 236, 0.6);
}

.node-preview-inputs .io-slot::before {
  right: 20px;
}

/* 输出插槽标记在右侧 */
.node-preview-outputs .io-slot {
  margin-right: -6px;
  border-right: 2px solid rgba(46, 213, 115, 0.6);
}

.node-preview-outputs .io-slot::after {
  content: attr(data-type);
  position: absolute;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 2px;
}

.node-preview-outputs .io-slot::before {
  left: 20px;
}

/* 插槽类型色彩 */
.io-slot[data-type="number"] {
  background-color: rgba(46, 213, 115, 0.3);
}

.io-slot[data-type="string"] {
  background-color: rgba(255, 193, 7, 0.3);
}

.io-slot[data-type="boolean"] {
  background-color: rgba(46, 149, 213, 0.3);
}

.io-slot[data-type="image"] {
  background-color: rgba(156, 39, 176, 0.3);
}

.io-slot[data-type="audio"] {
  background-color: rgba(255, 87, 51, 0.3);
}

.io-slot[data-type="any"] {
  background-color: rgba(158, 158, 158, 0.3);
}

.node-preview-content {
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.node-preview-path {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  padding: 4px 8px;
  background-color: rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  font-family: 'Courier New', monospace;
}

.node-preview-category {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  position: relative;
  padding-left: 16px;
}

.node-preview-category::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 10px;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23e0e0e0"><path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4.86 8.86l-3 3.87L9 13.14 6 17h12l-3.86-5.14z"/></svg>');
  background-size: contain;
}

.node-preview-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.node-preview-actions .action-btn {
  background: linear-gradient(135deg, #2d7494 0%, #1e5978 100%);
  min-width: 90px;
}

.node-preview-actions .action-btn:hover {
  background: linear-gradient(135deg, #3a95bd 0%, #2d7494 100%);
  transform: translateY(-2px);
}

/* 添加复制功能和样式 */
.info-value.clickable {
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.info-value.clickable:hover {
  color: #4a6baf;
  text-decoration: underline;
}

code {
  color: #ffffff;
}

.info-value.clickable:hover::after {
  content: "📋";
  font-size: 14px;
  margin-left: 5px;
  opacity: 0.7;
}

.notification {
  position: fixed;
  bottom: 30px;
  right: 30px;
  min-width: 300px;
  padding: 16px 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 15px;
  z-index: 2000;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  color: white;
  font-weight: 500;
  backdrop-filter: blur(5px);
  transform-origin: bottom right;
}

.notification-animate {
  animation: notificationSlideIn 0.3s forwards, notificationFadeOut 0.5s 2.5s forwards;
}

.notification.success {
  background: linear-gradient(135deg, rgba(39, 174, 96, 0.9), rgba(46, 204, 113, 0.9));
  border-left: 5px solid #27ae60;
}

.notification.error {
  background: linear-gradient(135deg, rgba(235, 87, 87, 0.9), rgba(241, 130, 141, 0.9));
  border-left: 5px solid #eb5757;
}

.notification-icon {
  background: rgba(255, 255, 255, 0.2);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.notification-message {
  font-size: 15px;
  line-height: 1.4;
}

@keyframes notificationSlideIn {
  0% {
    transform: translateX(100px) scale(0.8);
    opacity: 0;
  }

  100% {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
}

@keyframes notificationFadeOut {
  0% {
    transform: translateX(0) scale(1);
    opacity: 1;
  }

  100% {
    transform: translateX(30px) scale(0.8);
    opacity: 0;
  }
}

/* 美化标题区域 */
.import-icon-container {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #4b7bec, #3867d6);
  border-radius: 8px;
  margin-right: 12px;
  box-shadow: 0 2px 8px rgba(75, 123, 236, 0.3);
}

.import-icon {
  font-size: 18px;
  line-height: 1;
}

.detected-classes-container {
  background-color: rgba(10, 10, 20, 0.3);
  border-radius: 8px;
  padding: 15px;
  max-height: 200px;
  overflow-y: auto;
}

.detected-classes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.detected-class {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, rgba(74, 107, 175, 0.2), rgba(74, 107, 175, 0.3));
  color: white;
  padding: 10px 15px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid rgba(74, 107, 175, 0.3);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  animation: fadeInUp 0.3s both;
}

.detected-class:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  background: linear-gradient(135deg, rgba(74, 107, 175, 0.3), rgba(74, 107, 175, 0.4));
}

.class-icon {
  margin-right: 8px;
  font-size: 14px;
}

.class-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.no-classes-detected {
  display: flex;
  align-items: center;
  color: #ff6b6b;
  font-size: 14px;
  padding: 15px;
  border-radius: 6px;
  border-left: 3px solid #ff6b6b;
  background-color: rgba(255, 107, 107, 0.1);
}

.warning-icon {
  margin-right: 8px;
  font-size: 18px;
}

/* 美化分类输入 */
.category-input-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.category-group input {
  padding: 12px 15px;
  background-color: rgba(10, 10, 20, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-size: 15px;
  transition: all 0.2s ease;
}

.category-group input:focus {
  outline: none;
  border-color: rgba(74, 107, 175, 0.5);
  box-shadow: 0 0 0 2px rgba(74, 107, 175, 0.2);
  background-color: rgba(10, 10, 20, 0.5);
}

.popular-categories {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.category-tag {
  background-color: rgba(74, 107, 175, 0.15);
  border: 1px solid rgba(74, 107, 175, 0.3);
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.category-tag:hover {
  background-color: rgba(74, 107, 175, 0.3);
  color: white;
  transform: translateY(-1px);
}

.category-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 5px;
  font-style: italic;
}

/* 添加动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

/* 新增导入信息区域样式 */
.import-details {
  background-color: rgba(10, 10, 20, 0.3);
  border-radius: 8px;
  padding: 15px;
}

.import-detail-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.detail-label {
  color: rgba(255, 255, 255, 0.7);
  width: 100px;
  flex-shrink: 0;
  font-weight: 500;
}

.detail-value {
  color: #ffffff;
  font-weight: 500;
  flex: 1;
}

.import-detail-note {
  margin-top: 15px;
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  line-height: 1.4;
}

.note-icon {
  margin-right: 8px;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
}

/* 覆盖多余的样式 */
.category-input-container,
.popular-categories,
.category-hint {
  display: none;
}

.highlight-btn {
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  color: white;
  font-weight: 600;
  font-size: 15px;
  box-shadow: 0 4px 15px rgba(39, 174, 96, 0.4);
  border: none;
  animation: pulse-light 2s infinite;
  position: relative;
  z-index: 20;
  min-width: 140px;
}

@keyframes pulse-light {

  0%,
  100% {
    box-shadow: 0 4px 15px rgba(39, 174, 96, 0.4);
  }

  50% {
    box-shadow: 0 4px 25px rgba(39, 174, 96, 0.7);
  }
}

.highlight-btn:hover {
  transform: translateY(-3px);
  background: linear-gradient(135deg, #2ecc71, #27ae60);
}

.option-group {
  background-color: rgba(15, 15, 28, 0.5);
  border-radius: 10px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.option-group label {
  display: flex;
  align-items: center;
  color: #ffffff;
  font-weight: 500;
  font-size: 16px;
  margin-bottom: 15px;
}

.option-icon {
  margin-right: 8px;
  font-size: 18px;
}

.code-preview-group {
  display: flex;
  flex-direction: column;
}

.code-preview-container {
  background-color: rgba(20, 20, 35, 0.8);
  border-radius: 10px;
  padding: 0;
  max-height: 350px;
  overflow-y: auto;
  position: relative;
  border: 1px solid rgba(74, 107, 175, 0.3);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.code-preview-container:hover {
  border-color: rgba(74, 107, 175, 0.5);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
}

.code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 15px;
  background-color: rgba(10, 10, 20, 0.7);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px 10px 0 0;
}

.code-dots {
  display: flex;
  gap: 6px;
}

.code-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  opacity: 0.8;
}

.code-dot.red {
  background-color: #ff5f56;
}

.code-dot.yellow {
  background-color: #ffbd2e;
}

.code-dot.green {
  background-color: #27c93f;
}

.code-title {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  font-family: 'JetBrains Mono', monospace;
}

.code-badge {
  font-size: 11px;
  background-color: rgba(74, 107, 175, 0.3);
  color: #ffffff;
  padding: 3px 8px;
  border-radius: 4px;
  margin-left: 10px;
  font-weight: normal;
  letter-spacing: 0.5px;
  vertical-align: middle;
}

.code-preview {
  margin: 0;
  padding: 15px 20px;
  overflow: auto;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #f8f8f2;
  background-color: transparent;
  white-space: pre-wrap;
}

.code-preview code {
  font-family: inherit;
  position: relative;
  padding-left: 12px;
}

.code-preview :deep(.hljs) {
  background: transparent;
  padding: 0;
}

.code-preview :deep(.hljs-keyword),
.code-preview :deep(.hljs-tag),
.code-preview :deep(.hljs-name) {
  color: #c678dd;
}

.code-preview :deep(.hljs-attr) {
  color: #e5c07b;
}

.code-preview :deep(.hljs-string) {
  color: #98c379;
}

.code-preview :deep(.hljs-comment) {
  color: #5c6370;
  font-style: italic;
}

.code-preview :deep(.hljs-function),
.code-preview :deep(.hljs-params) {
  color: #abb2bf;
}

.code-preview :deep(.hljs-number) {
  color: #d19a66;
}

.code-preview :deep(.hljs-operator) {
  color: #56b6c2;
}

.code-preview :deep(.hljs-class) {
  color: #e5c07b;
}

.code-preview :deep(.hljs-title) {
  color: #61afef;
}

.code-preview code::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: rgba(74, 107, 175, 0.3);
  border-radius: 2px;
}

.import-note {
  margin-top: 12px;
  padding: 12px;
  background-color: rgba(74, 107, 175, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  border-left: 3px solid rgba(74, 107, 175, 0.5);
}

.note-icon {
  margin-right: 10px;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
}

/* 自定义滚动条 */
.code-preview::-webkit-scrollbar,
.import-summary::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.code-preview::-webkit-scrollbar-track,
.import-summary::-webkit-scrollbar-track {
  background: rgba(10, 10, 20, 0.1);
  border-radius: 5px;
  margin: 5px;
}

.code-preview::-webkit-scrollbar-thumb,
.import-summary::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, rgba(74, 107, 175, 0.5), rgba(93, 120, 180, 0.7));
  border-radius: 5px;
  border: 2px solid rgba(10, 10, 20, 0.1);
}

.code-preview::-webkit-scrollbar-thumb:hover,
.import-summary::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, rgba(74, 107, 175, 0.7), rgba(93, 120, 180, 0.9));
}

.detected-classes-container {
  background-color: rgba(20, 20, 35, 0.8);
  border-radius: 10px;
  padding: 15px;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid rgba(74, 107, 175, 0.3);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.detected-classes-container:hover {
  border-color: rgba(74, 107, 175, 0.5);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.import-summary {
  max-height: calc(100vh - 250px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  scrollbar-width: thin;
  scrollbar-color: rgba(74, 107, 175, 0.5) rgba(10, 10, 20, 0.1);
}

.detected-classes-container::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.detected-classes-container::-webkit-scrollbar-track {
  background: rgba(10, 10, 20, 0.1);
  border-radius: 5px;
  margin: 5px;
}

.detected-classes-container::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, rgba(74, 107, 175, 0.5), rgba(93, 120, 180, 0.7));
  border-radius: 5px;
  border: 2px solid rgba(10, 10, 20, 0.1);
}

.detected-classes-container::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, rgba(74, 107, 175, 0.7), rgba(93, 120, 180, 0.9));
}

/* 来源筛选增强样式 */
.source-builtin {
  border-left: 3px solid #2ed573;
  padding-left: 28px;
  position: relative;
}

.source-builtin:before {
  content: '🔧';
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
}

.source-builtin.active {
  background-color: rgba(46, 213, 115, 0.2);
  color: #2ed573;
  font-weight: 500;
}

.source-imported {
  border-left: 3px solid #ffc107;
  padding-left: 28px;
  position: relative;
}

.source-imported:before {
  content: '📦';
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
}

.source-imported.active {
  background-color: rgba(255, 193, 7, 0.2);
  color: #ffc107;
  font-weight: 500;
}

/* 添加自定义来源筛选样式 */
.source-custom {
  border-left: 3px solid #4b7bec;
  padding-left: 28px;
  position: relative;
}

.source-custom:before {
  content: '⚙️';
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
}

.source-custom.active {
  background-color: rgba(75, 123, 236, 0.2);
  color: #4b7bec;
  font-weight: 500;
}

/* 添加顶部来源指示条 */
.node-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: transparent;
}

.node-card:has(.node-source-badge.builtin-node)::after {
  background: linear-gradient(90deg, #2ed573, transparent);
}

.node-card:has(.node-source-badge.custom-node)::after {
  background: linear-gradient(90deg, #4b7bec, transparent);
}

.node-card:has(.node-source-badge.imported-node)::after {
  background: linear-gradient(90deg, #ffc107, transparent);
}

.node-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 15px;
  background-color: rgba(10, 10, 20, 0.5);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px 6px 0 0;
}

.group-icon {
  font-size: 18px;
  margin-right: 10px;
}

.group-title {
  font-size: 16px;
  color: #ffffff;
}

.group-count {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

/* 节点组样式 */
.node-group-header {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  background: linear-gradient(90deg, rgba(20, 20, 35, 0.8), rgba(30, 30, 50, 0.5));
  border-left: 3px solid #ffc107;
  margin: 20px 0 10px 0;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.group-icon {
  font-size: 18px;
  margin-right: 10px;
  color: #ffc107;
}

.group-title {
  font-size: 16px;
  color: #ffffff;
  font-weight: 600;
  flex: 1;
}

.group-count {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  background-color: rgba(255, 255, 255, 0.1);
  padding: 3px 8px;
  border-radius: 10px;
  margin-right: 10px;
}

/* 节点组删除按钮 */
.group-delete-btn {
  background-color: rgba(168, 50, 50, 0.2);
  border: none;
  color: #ff5f5f;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.group-delete-btn:hover {
  background-color: rgba(168, 50, 50, 0.4);
  color: #ff7070;
}

.delete-icon {
  font-size: 16px;
}

/* 确保节点组内的节点卡片有合适的间距 */
.node-group-header+.node-card {
  margin-top: 0;
}

/* 节点组中的卡片特殊样式 */
.node-card {
  margin-bottom: 10px;
}

/* 节点列表的网格布局 */
.nodes-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 15px;
}

/* 使分组标题占据整行 */
.node-group-header {
  grid-column: 1 / -1;
}

/* 添加代码容器和高亮样式 */
.code-container {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  background-color: #0d1117;
  margin-bottom: 16px;
}

.code-header {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  background-color: #161b22;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
  background-color: #ff5f56;
}

.code-dot.yellow {
  background-color: #ffbd2e;
}

.code-dot.green {
  background-color: #27c93f;
}

.code-title {
  flex: 1;
  font-size: 13px;
  color: #8b949e;
  font-family: 'JetBrains Mono', monospace;
}

.code-actions {
  display: flex;
  gap: 8px;
}

.code-action-btn {
  background: transparent;
  border: none;
  color: #8b949e;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.code-action-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #c9d1d9;
}

.action-icon {
  font-size: 16px;
}

.code-editor {
  margin: 0;
  padding: 16px;
  background-color: #0d1117;
  /* 匹配highlighted.css的背景色 */
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  overflow: auto;
  max-height: 400px;
  border-radius: 0 0 8px 8px;
}

/* 覆盖highlight.js默认样式 */
:deep(.hljs) {
  background-color: transparent !important;
  padding: 0 !important;
  color: #f8f8f2 !important;
}

:deep(.hljs-keyword) {
  color: #ff79c6 !important;
  font-weight: bold;
}

:deep(.hljs-string) {
  color: #f1fa8c !important;
}

:deep(.hljs-title) {
  color: #50fa7b !important;
  font-weight: bold;
}

:deep(.hljs-class) {
  color: #8be9fd !important;
  font-style: italic;
}

:deep(.hljs-function) {
  color: #50fa7b !important;
}

:deep(.hljs-built_in) {
  color: #8be9fd !important;
  font-style: italic;
}

:deep(.hljs-comment) {
  color: #6272a4 !important;
  font-style: italic;
}

:deep(.hljs-number) {
  color: #bd93f9 !important;
}

:deep(.hljs-literal) {
  color: #bd93f9 !important;
}

:deep(.hljs-attr),
:deep(.hljs-selector-id),
:deep(.hljs-selector-class) {
  color: #50fa7b !important;
}

:deep(.hljs-params) {
  color: #f8f8f2 !important;
}

:deep(.hljs-variable),
:deep(.hljs-template-variable) {
  color: #ffb86c !important;
}
</style>
