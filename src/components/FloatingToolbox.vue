<template>
  <div ref="toolbox" class="toolbar-container" :class="{ 'is-running': isRunning }">
    <div class="toolbar-content">
      <div class="logo-container">
        <div class="logo">
          <svg class="logo-icon" width="28" height="28" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="boxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#9c46ff" />
                <stop offset="100%" stop-color="#6617cb" />
              </linearGradient>
              <filter id="boxShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feFlood flood-color="#9c46ff" flood-opacity="0.6" result="color" />
                <feComposite in="color" in2="blur" operator="in" result="shadow" />
                <feComposite in="shadow" in2="SourceGraphic" operator="over" />
              </filter>
              <filter id="glowEffect">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feFlood flood-color="#9c46ff" flood-opacity="0.7" result="glow" />
                <feComposite in="glow" in2="blur" operator="in" result="coloredBlur" />
                <feComposite in="SourceGraphic" in2="coloredBlur" operator="over" />
              </filter>
            </defs>
            <rect x="10" y="10" width="80" height="80" rx="10" fill="url(#boxGradient)" filter="url(#boxShadow)" />
            <rect x="20" y="20" width="60" height="60" rx="6" fill="none" stroke="#fff" stroke-width="4"
              stroke-opacity="0.5" />
            <text x="50" y="65" font-family="monospace" font-size="36" font-weight="bold" fill="#fff"
              text-anchor="middle" filter="url(#glowEffect)">N</text>
          </svg>
        </div>
        <div class="logo-text">Box<span class="highlight">N</span>.js</div>
      </div>

      <!-- 文件管理标签页 -->
      <div class="file-tabs-container" :class="{ 'tabs-disabled': isRunning }">
        <div class="file-tabs-scroll">
          <div class="file-tabs">
            <div v-for="(file, index) in files" :key="index"
              :class="['file-tab', { active: currentFileIndex === index }]" @click="!isRunning && switchFile(index)">
              <span v-if="editingFileIndex !== index" class="file-tab-name"
                @dblclick="!isRunning && startEditFileName(index)">{{ file.name }}</span>
              <input v-else ref="fileNameInput" class="file-name-edit" type="text" v-model="file.name"
                @blur="finishEditFileName" @keydown.enter="finishEditFileName" @keydown.esc="cancelEditFileName" />
              <button class="file-tab-close" @click.stop="!isRunning && confirmDeleteFile(index)" title="关闭文件"
                :disabled="isRunning" :class="{ 'btn-disabled': isRunning }">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
        <button class="new-file-btn" @click="!isRunning && createNewFile()" title="创建新文件" :disabled="isRunning"
          :class="{ 'btn-disabled': isRunning }">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>

      <div class="toolbar-actions">
        <button class="toolbar-btn btn-node-manager" @click="$emit('open-manager')" title="节点管理器" :disabled="isRunning"
          :class="{ 'btn-disabled': isRunning }">
          <svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="20"
            height="20">
            <path
              d="M832 64H192c-35.3 0-64 28.7-64 64v768c0 35.3 28.7 64 64 64h640c35.3 0 64-28.7 64-64V128c0-35.3-28.7-64-64-64zM200 192h80v80h-80v-80z m0 160h80v80h-80v-80z m0 160h80v80h-80v-80z m160 320H200v-80h160v80z m240 0H400v-80h200v80z m264 0h-224v-80h224v80z m0-160H400v-80h464v80z m0-160H400v-80h464v80z m0-160H400v-80h464v80z"
              fill="#ffffff"></path>
          </svg>
        </button>

        <button class="toolbar-btn btn-import" @click="importIntoNewFile" title="导入到新文件" :disabled="isRunning"
          :class="{ 'btn-disabled': isRunning }">
          <svg class="icon" viewBox="0 0 1052 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="20"
            height="20">
            <path
              d="M22.926398 1001.119364V45.715511h397.573937l151.241007 137.283819h457.933056v818.120034z m91.522545-91.522546h823.702909v-439.308218h-823.702909z m823.702909-530.830764v-104.335701h-401.738213l-26.129687-23.795862-125.157081-113.579479H114.448943v241.711042z"
              fill="#ffffff"></path>
          </svg>
        </button>

        <button class="toolbar-btn btn-export" @click="exportFile" title="导出到文件" :disabled="isRunning"
          :class="{ 'btn-disabled': isRunning }">
          <svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="20"
            height="20">
            <path
              d="M918.186667 1024H105.813333C68.266667 1024 34.133333 993.28 34.133333 952.32V211.626667c0-37.546667 34.133333-71.68 71.68-71.68h194.56c30.72 0 54.613333 23.893333 54.613334 54.613333s-23.893333 51.2-54.613334 51.2H139.946667v672.426667h740.693333V245.76h-160.426667c-30.72 0-54.613333-23.893333-54.613333-54.613333S689.493333 136.533333 720.213333 136.533333h194.56C955.733333 139.946667 989.866667 174.08 989.866667 211.626667v740.693333c0 40.96-34.133333 71.68-71.68 71.68z m-177.493334-546.133333c0 13.653333-6.826667 27.306667-17.066666 37.546666L546.133333 692.906667c-10.24 10.24-23.893333 17.066667-37.546666 17.066666-13.653333 0-27.306667-6.826667-37.546667-17.066666l-177.493333-177.493334c-10.24-10.24-17.066667-23.893333-17.066667-37.546666 0-30.72 23.893333-54.613333 54.613333-54.613334 13.653333 0 27.306667 6.826667 37.546667 17.066667l85.333333 85.333333V54.613333C457.386667 23.893333 481.28 0 512 0s54.613333 23.893333 54.613333 54.613333v471.04l85.333334-85.333333c10.24-10.24 23.893333-17.066667 37.546666-17.066667 27.306667 0 51.2 23.893333 51.2 54.613334z"
              fill="#ffffff"></path>
          </svg>
        </button>

        <button class="toolbar-btn btn-save" @click="saveCurrentFile" title="保存 (Ctrl+S / ⌘+S)" :disabled="isRunning"
          :class="{ 'btn-disabled': isRunning }">
          <svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="20"
            height="20">
            <path
              d="M298.666667 810.666667v-256h426.666666v256h85.333334V333.994667L690.005333 213.333333H213.333333v597.333334h85.333334zM170.666667 128h554.666666l170.666667 170.666667v554.666666a42.666667 42.666667 0 0 1-42.666667 42.666667H170.666667a42.666667 42.666667 0 0 1-42.666667-42.666667V170.666667a42.666667 42.666667 0 0 1 42.666667-42.666667z m213.333333 512v170.666667h256v-170.666667H384z"
              fill="#ffffff"></path>
          </svg>
        </button>

        <button class="toolbar-btn btn-control" :class="{ 'btn-stop': isRunning, 'btn-run': !isRunning }"
          @click="toggleRunning" :title="isRunning ? '停止' : '运行'">
          <svg v-if="isRunning" class="icon icon-control" viewBox="0 0 1024 1024" version="1.1"
            xmlns="http://www.w3.org/2000/svg" width="20" height="20">
            <path
              d="M128 128m53.333333 0l661.333334 0q53.333333 0 53.333333 53.333333l0 661.333334q0 53.333333-53.333333 53.333333l-661.333334 0q-53.333333 0-53.333333-53.333333l0-661.333334q0-53.333333 53.333333-53.333333Z"
              fill="#ffffff"></path>
          </svg>
          <svg v-else class="icon icon-control" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
            width="20" height="20">
            <path
              d="M170.666667 128l2.133333 768c0 34.133333 36.266667 53.333333 64 34.133333l597.333333-384c25.6-17.066667 25.6-53.333333 0-70.4L234.666667 91.733333C206.933333 74.666667 170.666667 93.866667 170.666667 128z"
              fill="#ffffff"></path>
          </svg>
        </button>
      </div>
    </div>
  </div>

  <!-- 确认删除对话框 -->
  <div v-if="showDeleteConfirm" class="modal-wrapper">
    <div class="modal-overlay" @click="cancelDelete"></div>
    <div class="modal-container">
      <div class="modal-header">
        <h3>确认删除</h3>
        <button class="close-btn" @click="cancelDelete">&times;</button>
      </div>
      <div class="modal-body">
        <p>确定要删除文件 "{{ fileToDelete?.name }}" 吗？</p>
        <p class="warning-text">此操作不可撤销，文件内容将会丢失。</p>
      </div>
      <div class="modal-footer">
        <button class="modal-btn cancel-btn" @click="cancelDelete">取消</button>
        <button class="modal-btn confirm-btn" @click="deleteFile">删除</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'

// 定义文件接口
interface GraphFile {
  id: string;
  name: string;
  content: string;
  lastModified: number;
}

const emit = defineEmits(['run', 'stop', 'save', 'export', 'import', 'open-manager', 'switchFile']);

// 文件管理
const files = ref<GraphFile[]>([]);
const currentFileIndex = ref(0);
const showDeleteConfirm = ref(false);
const fileToDeleteIndex = ref(-1);
const editingFileIndex = ref(-1); // 新增：当前正在编辑名称的文件索引
const fileNameInput = ref<HTMLInputElement | null>(null); // 新增：文件名输入框引用
const fileNameBeforeEdit = ref(''); // 新增：保存编辑前的文件名，用于取消编辑

// 计算当前文件
const currentFile = computed({
  get: () => {
    if (files.value.length === 0) return { id: '', name: '', content: '', lastModified: 0 };
    return files.value[currentFileIndex.value];
  },
  set: (value) => {
    if (files.value.length === 0) return;
    files.value[currentFileIndex.value] = value;
  }
});

// 用于删除确认的文件引用
const fileToDelete = computed(() => {
  if (fileToDeleteIndex.value < 0 || fileToDeleteIndex.value >= files.value.length) {
    return null;
  }
  return files.value[fileToDeleteIndex.value];
});

// 新增：开始编辑文件名
const startEditFileName = (index: number) => {
  editingFileIndex.value = index;
  fileNameBeforeEdit.value = files.value[index].name;

  // 在下一个DOM更新周期后聚焦输入框
  nextTick(() => {
    if (fileNameInput.value) {
      fileNameInput.value.focus();
      fileNameInput.value.select();
    }
  });
};

// 新增：完成编辑文件名
const finishEditFileName = () => {
  if (editingFileIndex.value < 0) return;

  // 检查并修正空文件名
  if (files.value[editingFileIndex.value].name.trim() === '') {
    files.value[editingFileIndex.value].name = fileNameBeforeEdit.value || `untitled_${editingFileIndex.value + 1}`;
  }

  // 更新文件修改时间
  files.value[editingFileIndex.value].lastModified = Date.now();
  saveFilesToStorage();

  // 重置编辑状态
  editingFileIndex.value = -1;
};

// 新增：取消编辑文件名
const cancelEditFileName = () => {
  if (editingFileIndex.value < 0) return;

  // 恢复原文件名
  files.value[editingFileIndex.value].name = fileNameBeforeEdit.value;

  // 重置编辑状态
  editingFileIndex.value = -1;
};

// 初始化文件
const initializeFiles = () => {
  try {
    // 尝试从localStorage加载已有文件
    const savedFiles = localStorage.getItem('boxn_files');
    if (savedFiles) {
      files.value = JSON.parse(savedFiles);
      // 确保至少有一个文件
      if (files.value.length === 0) {
        createDefaultFile();
      }
    } else {
      createDefaultFile();
    }
  } catch (e) {
    console.warn('无法从本地存储加载文件列表', e);
    createDefaultFile();
  }
};

// 创建默认文件
const createDefaultFile = () => {
  files.value = [{
    id: generateId(),
    name: 'untitled',
    content: '',
    lastModified: Date.now()
  }];
  currentFileIndex.value = 0;
  saveFilesToStorage();
};

// 生成唯一ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

// 保存文件列表到本地存储
const saveFilesToStorage = () => {
  try {
    localStorage.setItem('boxn_files', JSON.stringify(files.value));
    console.log(`已保存 ${files.value.length} 个文件到本地存储`);
  } catch (e) {
    console.error('无法保存文件列表到本地存储', e);
  }
};

// 创建新文件
const createNewFile = () => {
  const newFile: GraphFile = {
    id: generateId(),
    name: `untitled_${files.value.length + 1}`,
    content: '',
    lastModified: Date.now()
  };

  files.value.push(newFile);
  currentFileIndex.value = files.value.length - 1;
  saveFilesToStorage();

  // 通知父组件切换到新文件
  emit('switchFile', newFile);

  // 自动进入编辑模式
  startEditFileName(files.value.length - 1);
};

// 切换文件
const switchFile = (index: number) => {
  if (isRunning.value) return;
  currentFileIndex.value = index;
  emit('switchFile', files.value[index]);
};

// 保存当前文件
const saveCurrentFile = () => {
  // 如果图形正在运行，则不允许保存
  if (isRunning.value) return;

  const file = currentFile.value;
  file.lastModified = Date.now();
  saveFilesToStorage();

  // 调用原有的保存功能
  emit('save', file.id);
};

// 确认删除文件
const confirmDeleteFile = (index: number) => {
  // 如果图形正在运行或只有一个文件，则不允许删除
  if (isRunning.value || files.value.length <= 1) {
    return;
  }

  fileToDeleteIndex.value = index;
  showDeleteConfirm.value = true;
};

// 取消删除
const cancelDelete = () => {
  showDeleteConfirm.value = false;
  fileToDeleteIndex.value = -1;
};

// 删除文件
const deleteFile = () => {
  if (fileToDeleteIndex.value < 0 || files.value.length <= 1) {
    cancelDelete();
    return;
  }

  const isCurrentFile = fileToDeleteIndex.value === currentFileIndex.value;

  // 删除文件
  files.value.splice(fileToDeleteIndex.value, 1);

  // 调整当前索引
  if (isCurrentFile) {
    // 如果删除的是当前文件，切换到前一个文件或第一个文件
    currentFileIndex.value = Math.min(fileToDeleteIndex.value, files.value.length - 1);

    // 通知父组件切换文件
    const file = files.value[currentFileIndex.value];
    emit('switchFile', file);
  } else if (fileToDeleteIndex.value < currentFileIndex.value) {
    // 如果删除的文件在当前文件之前，需要调整索引
    currentFileIndex.value--;
  }

  saveFilesToStorage();
  cancelDelete();
};

// 更新文件内容
const updateFileContent = (fileId: string, content: string) => {
  const fileIndex = files.value.findIndex(f => f.id === fileId);
  if (fileIndex >= 0) {
    // 更新文件内容
    files.value[fileIndex].content = content;
    files.value[fileIndex].lastModified = Date.now();

    // 确保保存到localStorage
    saveFilesToStorage();

    console.log(`已更新文件内容: ${fileId}`);
  } else {
    console.warn(`找不到要更新的文件: ${fileId}`);
  }
};

// 导出文件
const exportFile = () => {
  // 如果图形正在运行，则不允许导出
  if (isRunning.value) return;

  emit('export', currentFile.value.name);
};

// 导入文件到新文件
const importIntoNewFile = () => {
  // 如果图形正在运行，则不允许导入
  if (isRunning.value) return;

  // 先创建一个新文件
  const newFile: GraphFile = {
    id: generateId(),
    name: `imported_${files.value.length + 1}`,
    content: '',
    lastModified: Date.now()
  };

  files.value.push(newFile);
  currentFileIndex.value = files.value.length - 1;
  saveFilesToStorage();

  // 通知父组件切换到新文件并触发导入
  emit('switchFile', newFile);
  emit('import');
};

// 工具箱状态
const isRunning = ref(false);
const toolbox = ref<HTMLElement | null>(null);

// 切换运行状态
const toggleRunning = () => {
  isRunning.value = !isRunning.value;
  if (isRunning.value) {
    emit('run');
  } else {
    emit('stop');
  }
};

// 组件挂载时初始化
onMounted(() => {
  initializeFiles();

  // 添加全局键盘快捷键监听
  window.addEventListener('keydown', handleKeyboardShortcut);
});

// 组件卸载时清理事件监听器
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyboardShortcut);
});

// 处理键盘快捷键
const handleKeyboardShortcut = (event: KeyboardEvent) => {
  // Ctrl+S 或 Cmd+S (保存)
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault(); // 阻止浏览器默认保存行为

    // 只有在图形未运行时才能保存
    if (!isRunning.value) {
      saveCurrentFile();
    }
  }
};

// 监听文件变化
watch(files, saveFilesToStorage, { deep: true });

// 暴露给父组件的方法
defineExpose({
  updateFileContent,
  currentFileId: computed(() => currentFile.value.id)
});
</script>

<style scoped>
/* 文件名内联编辑样式 */
.file-name-edit {
  background: rgba(25, 25, 35, 0.7);
  border: 1px solid rgba(156, 70, 255, 0.4);
  border-radius: 3px;
  color: white;
  padding: 2px 6px;
  font-size: 12px;
  outline: none;
  width: 100%;
  max-width: calc(100% - 20px);
}

.file-name-edit:focus {
  border-color: rgba(156, 70, 255, 0.6);
  box-shadow: 0 0 0 2px rgba(156, 70, 255, 0.2);
}

/* 导航栏容器 */
.toolbar-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 50px;
  background: rgba(10, 10, 18, 0.95);
  color: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(156, 70, 255, 0.08);
  padding: 0 16px;
  z-index: 1000;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: all 0.3s ease;
  border-bottom: 1px solid rgba(0, 0, 0, 0.3);
}

.toolbar-container::before {
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

.toolbar-content {
  width: 100%;
  max-width: 1400px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  height: 100%;
}

/* Logo 样式 */
.logo-container {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 140px;
  padding-right: 12px;
  position: relative;
  z-index: 1;
  transition: transform 0.3s ease;
}

.logo-container:hover {
  transform: translateY(-1px);
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.logo::after {
  content: '';
  position: absolute;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: radial-gradient(circle, rgba(156, 70, 255, 0.15) 0%, rgba(30, 30, 50, 0) 70%);
  animation: pulse 4s infinite ease-in-out;
}

.logo-icon {
  filter: drop-shadow(0 2px 10px rgba(156, 70, 255, 0.5));
  transition: all 0.3s ease;
  position: relative;
  z-index: 2;
}

.logo-container:hover .logo-icon {
  filter: drop-shadow(0 3px 12px rgba(156, 70, 255, 0.7));
  transform: scale(1.05);
}

.logo-text {
  font-weight: 600;
  font-size: 16px;
  background: linear-gradient(90deg, #ffffff 0%, #e9d2ff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 0.5px;
  position: relative;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.logo-text .highlight {
  color: #9c46ff;
  -webkit-text-fill-color: #9c46ff;
  font-weight: 700;
  text-shadow: 0 0 8px rgba(156, 70, 255, 0.4);
}

.logo-text::after {
  content: '';
  position: absolute;
  bottom: -3px;
  left: 0;
  width: 0;
  height: 1px;
  background: rgba(156, 70, 255, 0.5);
  transition: width 0.3s ease;
}

.logo-container:hover .logo-text::after {
  width: 100%;
}

/* 文件标签页样式 */
.file-tabs-container {
  flex: 1;
  display: flex;
  overflow: visible;
  max-width: 65%;
  position: relative;
  height: 100%;
  padding-top: 4px;
  align-items: center;
  gap: 8px;
}

.tabs-disabled {
  opacity: 0.6;
  pointer-events: none;
}

.tabs-disabled .file-tab,
.tabs-disabled .file-tab-close,
.tabs-disabled .new-file-btn {
  cursor: not-allowed !important;
}

.file-tabs-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 70, 255, 0.3) rgba(0, 0, 0, 0);
  width: 100%;
  position: relative;
  display: flex;
  height: 100%;
  align-items: flex-end;
  mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%);
  -webkit-mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%);
}

.file-tabs-scroll::-webkit-scrollbar {
  height: 1px;
}

.file-tabs-scroll::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0);
}

.file-tabs-scroll::-webkit-scrollbar-thumb {
  background: rgba(156, 70, 255, 0.3);
  border-radius: 3px;
}

.file-tabs-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 70, 255, 0.5);
}

.file-tabs {
  display: flex;
  align-items: flex-end;
  min-width: min-content;
  height: 100%;
}

.file-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  height: 28px;
  min-width: 100px;
  max-width: 160px;
  background: rgba(25, 25, 40, 0);
  margin-right: 3px;
  margin-bottom: 0;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
  z-index: 1;
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
  border-radius: 4px 4px 0 0;
  border: 1px solid transparent;
  border-bottom: none;
}

.file-tab::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(156, 70, 255, 0);
  transition: all 0.2s ease;
}

.file-tab::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 4px;
  right: 4px;
  height: 2px;
  background: rgba(156, 70, 255, 0);
  transition: all 0.2s ease;
  border-radius: 1px;
}

.file-tab:hover {
  background: rgba(35, 35, 50, 0.5);
  border-color: rgba(156, 70, 255, 0.2);
}

.file-tab:hover::before {
  background: rgba(156, 70, 255, 0.3);
}

.file-tab:hover::after {
  background: rgba(156, 70, 255, 0.4);
}

.file-tab.active {
  background: rgba(35, 35, 50, 0.75);
  border-color: rgba(156, 70, 255, 0.25);
  height: 32px;
  z-index: 2;
}

.file-tab.active::before {
  background: rgba(156, 70, 255, 0.4);
}

.file-tab.active::after {
  background: rgb(156, 70, 255);
  box-shadow: 0 0 6px rgba(156, 70, 255, 0.6);
}

.file-tab-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.2s ease;
}

.file-tab:hover .file-tab-name {
  color: rgba(255, 255, 255, 0.9);
}

.active .file-tab-name {
  color: white;
  font-weight: 500;
}

.file-tab-close {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
  opacity: 0.7;
}

.file-tab-close:hover {
  background: rgba(156, 70, 255, 0.2);
  color: rgba(255, 255, 255, 0.95);
  opacity: 1;
  transform: rotate(90deg);
}

.file-tab.active .file-tab-close {
  color: rgba(255, 255, 255, 0.6);
}

.new-file-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, rgba(156, 70, 255, 0.2) 0%, rgba(156, 70, 255, 0.1) 100%);
  color: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(156, 70, 255, 0.3);
  border-radius: 4px;
  min-width: 32px;
  height: 28px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  padding: 0 10px;
  flex-shrink: 0;
  margin-left: 2px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.new-file-btn::before {
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

.new-file-btn::after {
  content: '';
  position: absolute;
  top: -1px;
  left: 8px;
  right: 8px;
  height: 2px;
  background: rgba(156, 70, 255, 0.8);
  border-radius: 1px;
  transition: all 0.2s ease;
}

.new-file-btn:hover {
  background: linear-gradient(180deg, rgba(156, 70, 255, 0.3) 0%, rgba(156, 70, 255, 0.2) 100%);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(156, 70, 255, 0.3);
  border-color: rgba(156, 70, 255, 0.5);
}

.new-file-btn:hover::before {
  opacity: 1;
}

.new-file-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.new-file-btn svg {
  width: 14px;
  height: 14px;
  transition: transform 0.3s ease;
}

.new-file-btn:hover svg {
  transform: rotate(90deg);
}

/* 工具栏操作区 */
.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 100%;
  margin-left: auto;
  padding-left: 16px;
  position: relative;
}

.toolbar-actions::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 1px;
  background: linear-gradient(to bottom,
      rgba(156, 70, 255, 0),
      rgba(156, 70, 255, 0.2),
      rgba(156, 70, 255, 0));
}

/* 统一按钮样式 */
.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to bottom, rgba(30, 30, 45, 0.6), rgba(20, 20, 35, 0.7));
  color: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(50, 50, 65, 0.5);
  border-radius: 6px;
  width: 34px;
  height: 34px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.toolbar-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.15) 0%, transparent 80%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.toolbar-btn:hover {
  background: linear-gradient(to bottom, rgba(40, 40, 60, 0.7), rgba(30, 30, 45, 0.8));
  color: white;
  border-color: rgba(156, 70, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

.toolbar-btn:hover::before {
  opacity: 1;
}

.toolbar-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.icon {
  width: 20px;
  height: 20px;
  transition: all 0.2s ease;
  opacity: 0.9;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

.toolbar-btn:hover .icon {
  opacity: 1;
  transform: scale(1.1);
}

/* 不同按钮的微妙区分 */
.btn-control {
  background: rgba(156, 70, 255, 0.2);
  border-color: rgba(156, 70, 255, 0.3);
  position: relative;
}

.btn-control::after {
  content: '';
  position: absolute;
  top: -1px;
  left: 10px;
  right: 10px;
  height: 2px;
  background: rgba(156, 70, 255, 0.6);
  border-radius: 1px;
}

.btn-control:hover {
  background: rgba(156, 70, 255, 0.3);
  border-color: rgba(156, 70, 255, 0.4);
}

.btn-run:hover .icon {
  transform: translateX(2px) scale(1.1);
}

.btn-stop {
  background: rgba(211, 47, 47, 0.15);
  border-color: rgba(211, 47, 47, 0.3);
}

.btn-stop::after {
  content: '';
  position: absolute;
  top: -1px;
  left: 10px;
  right: 10px;
  height: 2px;
  background: rgba(211, 47, 47, 0.6);
  border-radius: 1px;
}

.btn-stop:hover {
  background: rgba(211, 47, 47, 0.25);
  border-color: rgba(211, 47, 47, 0.4);
}

.btn-save {
  position: relative;
}

.btn-save::after {
  content: '';
  position: absolute;
  top: -1px;
  left: 10px;
  right: 10px;
  height: 2px;
  background: rgba(76, 175, 80, 0.6);
  border-radius: 1px;
}

.btn-save:hover .icon {
  transform: translateY(-2px) scale(1.1);
}

.btn-export {
  position: relative;
}

.btn-export::after {
  content: '';
  position: absolute;
  top: -1px;
  left: 10px;
  right: 10px;
  height: 2px;
  background: rgba(156, 70, 255, 0.6);
  border-radius: 1px;
}

.btn-export:hover .icon {
  transform: translateY(2px) scale(1.1);
}

.btn-import {
  position: relative;
}

.btn-import::after {
  content: '';
  position: absolute;
  top: -1px;
  left: 10px;
  right: 10px;
  height: 2px;
  background: rgba(255, 152, 0, 0.6);
  border-radius: 1px;
}

.btn-import:hover .icon {
  transform: translateY(2px) scale(1.1);
}

.btn-node-manager {
  position: relative;
}

.btn-node-manager::after {
  content: '';
  position: absolute;
  top: -1px;
  left: 10px;
  right: 10px;
  height: 2px;
  background: rgba(156, 70, 255, 0.6);
  border-radius: 1px;
}

.btn-node-manager:hover .icon {
  transform: rotate(45deg) scale(1.1);
}

.btn-disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
  transform: none !important;
  box-shadow: none !important;
}

/* 确认删除对话框 */
.modal-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(3px);
  animation: fadeIn 0.3s ease;
  pointer-events: auto;
}

.modal-container {
  position: relative;
  background: rgb(16, 16, 26);
  border-radius: 8px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(156, 70, 255, 0.2);
  width: 380px;
  max-width: 90%;
  overflow: hidden;
  animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: auto;
}

.modal-header {
  background: rgba(30, 30, 45, 0.7);
  padding: 12px 16px;
  border-bottom: 1px solid rgba(156, 70, 255, 0.2);
  position: relative;
}

.close-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 22px;
  line-height: 1;
  padding: 0;
  position: absolute;
  right: 16px;
  top: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  color: #ffffff;
  transform: scale(1.1);
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #fff;
  display: flex;
  align-items: center;
}

.modal-header h3::before {
  content: "⚠️";
  margin-right: 10px;
  font-size: 16px;
}

.modal-body {
  padding: 16px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
  font-size: 13px;
}

.modal-body p {
  margin-top: 0;
  margin-bottom: 10px;
}

.warning-text {
  color: rgb(255, 120, 120);
  font-size: 13px;
  margin-top: 10px;
  display: flex;
  align-items: center;
}

.warning-text::before {
  content: "⚠️";
  margin-right: 8px;
  font-size: 13px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px;
  border-top: 1px solid rgba(156, 70, 255, 0.1);
  gap: 8px;
  background: rgba(12, 12, 22, 1);
}

.modal-btn {
  padding: 6px 14px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 12px;
  min-width: 70px;
  position: relative;
  overflow: hidden;
}

.modal-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.1) 0%, transparent 80%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.modal-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.modal-btn:hover::before {
  opacity: 1;
}

.modal-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.cancel-btn {
  background: rgba(35, 35, 50, 0.5);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(156, 70, 255, 0.25);
}

.cancel-btn:hover {
  background: rgba(35, 35, 50, 0.7);
  color: white;
}

.confirm-btn {
  background: rgba(211, 47, 47, 0.15);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(211, 47, 47, 0.3);
  position: relative;
}

.confirm-btn::after {
  content: '';
  position: absolute;
  top: -1px;
  left: 10px;
  right: 10px;
  height: 2px;
  background: rgba(211, 47, 47, 0.6);
  border-radius: 1px;
}

.confirm-btn:hover {
  background: rgba(211, 47, 47, 0.25);
  color: white;
  border-color: rgba(211, 47, 47, 0.5);
}

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
    transform: scale(0.95) translateY(10px);
    opacity: 0;
  }

  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }

  50% {
    transform: scale(1.1);
    opacity: 0.3;
  }

  100% {
    transform: scale(1);
    opacity: 0.6;
  }
}
</style>
