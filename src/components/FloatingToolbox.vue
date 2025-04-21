<template>
  <div ref="toolbox" class="toolbar-container" :class="{ 'is-running': isRunning }">
    <div class="toolbar-content">
      <div class="logo-container">
        <div class="logo">
          <svg class="logo-icon" width="30" height="30" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
            <path d="M40 0C17.909 0 0 17.909 0 40s17.909 40 40 40 40-17.909 40-40S62.091 0 40 0z"
              fill="url(#gradient-bg)" />
            <path d="M59 28c0-2.2-1.8-4-4-4H25c-2.2 0-4 1.8-4 4v24c0 2.2 1.8 4 4 4h30c2.2 0 4-1.8 4-4V28z"
              fill="#1a1a2d" stroke="#4a6baf" stroke-width="2" />
            <path d="M25 35h30M25 45h30M35 24v32M45 24v32" stroke="#4a6baf" stroke-width="2" stroke-linecap="round" />
            <path d="M52 40a12 12 0 11-24 0 12 12 0 0124 0z" fill="rgba(74, 107, 175, 0.3)" stroke="#4a6baf"
              stroke-width="2" />
            <defs>
              <linearGradient id="gradient-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#4a6baf" />
                <stop offset="100%" stop-color="#2a3b66" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div class="logo-text">LiteGraph <span>Editor</span></div>
      </div>

      <!-- 文件管理标签页 -->
      <div class="file-tabs-container" :class="{ 'tabs-disabled': isRunning }">
        <div class="file-tabs-scroll">
          <div class="file-tabs">
            <div v-for="(file, index) in files" :key="index"
              :class="['file-tab', { active: currentFileIndex === index }]" @click="!isRunning && switchFile(index)">
              <span class="file-tab-name">{{ file.name }}</span>
              <button class="file-tab-close" @click.stop="!isRunning && confirmDeleteFile(index)" title="关闭文件"
                :disabled="isRunning" :class="{ 'btn-disabled': isRunning }">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <button class="new-file-btn" @click="!isRunning && createNewFile()" title="创建新文件" :disabled="isRunning"
              :class="{ 'btn-disabled': isRunning }">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="toolbar-actions">
        <div class="filename-container">
          <input type="text" v-model="currentFile.name" placeholder="文件名称" class="filename-input" title="编辑当前文件名称"
            @change="updateFileName" :disabled="isRunning" />
        </div>

        <button class="toolbar-btn btn-node-manager" @click="$emit('open-manager')" title="节点管理器" :disabled="isRunning"
          :class="{ 'btn-disabled': isRunning }">
          <svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="24"
            height="24">
            <path
              d="M832 64H192c-35.3 0-64 28.7-64 64v768c0 35.3 28.7 64 64 64h640c35.3 0 64-28.7 64-64V128c0-35.3-28.7-64-64-64zM200 192h80v80h-80v-80z m0 160h80v80h-80v-80z m0 160h80v80h-80v-80z m160 320H200v-80h160v80z m240 0H400v-80h200v80z m264 0h-224v-80h224v80z m0-160H400v-80h464v80z m0-160H400v-80h464v80z m0-160H400v-80h464v80z"
              fill="#ffffff"></path>
          </svg>
        </button>

        <button class="toolbar-btn btn-import" @click="importIntoNewFile" title="导入到新文件" :disabled="isRunning"
          :class="{ 'btn-disabled': isRunning }">
          <svg class="icon" viewBox="0 0 1052 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="24"
            height="24">
            <path
              d="M22.926398 1001.119364V45.715511h397.573937l151.241007 137.283819h457.933056v818.120034z m91.522545-91.522546h823.702909v-439.308218h-823.702909z m823.702909-530.830764v-104.335701h-401.738213l-26.129687-23.795862-125.157081-113.579479H114.448943v241.711042z"
              fill="#ffffff"></path>
          </svg>
        </button>

        <button class="toolbar-btn btn-export" @click="exportFile" title="导出到文件" :disabled="isRunning"
          :class="{ 'btn-disabled': isRunning }">
          <svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="24"
            height="24">
            <path
              d="M918.186667 1024H105.813333C68.266667 1024 34.133333 993.28 34.133333 952.32V211.626667c0-37.546667 34.133333-71.68 71.68-71.68h194.56c30.72 0 54.613333 23.893333 54.613334 54.613333s-23.893333 51.2-54.613334 51.2H139.946667v672.426667h740.693333V245.76h-160.426667c-30.72 0-54.613333-23.893333-54.613333-54.613333S689.493333 136.533333 720.213333 136.533333h194.56C955.733333 139.946667 989.866667 174.08 989.866667 211.626667v740.693333c0 40.96-34.133333 71.68-71.68 71.68z m-177.493334-546.133333c0 13.653333-6.826667 27.306667-17.066666 37.546666L546.133333 692.906667c-10.24 10.24-23.893333 17.066667-37.546666 17.066666-13.653333 0-27.306667-6.826667-37.546667-17.066666l-177.493333-177.493334c-10.24-10.24-17.066667-23.893333-17.066667-37.546666 0-30.72 23.893333-54.613333 54.613333-54.613334 13.653333 0 27.306667 6.826667 37.546667 17.066667l85.333333 85.333333V54.613333C457.386667 23.893333 481.28 0 512 0s54.613333 23.893333 54.613333 54.613333v471.04l85.333334-85.333333c10.24-10.24 23.893333-17.066667 37.546666-17.066667 27.306667 0 51.2 23.893333 51.2 54.613334z"
              fill="#ffffff"></path>
          </svg>
        </button>

        <button class="toolbar-btn btn-save" @click="saveCurrentFile" title="保存 (Ctrl+S / ⌘+S)" :disabled="isRunning"
          :class="{ 'btn-disabled': isRunning }">
          <svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="24"
            height="24">
            <path
              d="M298.666667 810.666667v-256h426.666666v256h85.333334V333.994667L690.005333 213.333333H213.333333v597.333334h85.333334zM170.666667 128h554.666666l170.666667 170.666667v554.666666a42.666667 42.666667 0 0 1-42.666667 42.666667H170.666667a42.666667 42.666667 0 0 1-42.666667-42.666667V170.666667a42.666667 42.666667 0 0 1 42.666667-42.666667z m213.333333 512v170.666667h256v-170.666667H384z"
              fill="#ffffff"></path>
          </svg>
        </button>

        <button class="toolbar-btn btn-control" :class="{ 'btn-stop': isRunning, 'btn-run': !isRunning }"
          @click="toggleRunning" :title="isRunning ? '停止' : '运行'">
          <svg v-if="isRunning" class="icon icon-control" viewBox="0 0 1024 1024" version="1.1"
            xmlns="http://www.w3.org/2000/svg" width="24" height="24">
            <path
              d="M128 128m53.333333 0l661.333334 0q53.333333 0 53.333333 53.333333l0 661.333334q0 53.333333-53.333333 53.333333l-661.333334 0q-53.333333 0-53.333333-53.333333l0-661.333334q0-53.333333 53.333333-53.333333Z"
              fill="#ffffff"></path>
          </svg>
          <svg v-else class="icon icon-control" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
            width="24" height="24">
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
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'

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
};

// 切换文件
const switchFile = (index: number) => {
  if (isRunning.value) return;
  currentFileIndex.value = index;
  emit('switchFile', files.value[index]);
};

// 更新文件名
const updateFileName = () => {
  // 如果图形正在运行，则不允许更新文件名
  if (isRunning.value) return;

  if (currentFile.value.name.trim() === '') {
    currentFile.value.name = `untitled_${currentFileIndex.value + 1}`;
  }

  currentFile.value.lastModified = Date.now();
  saveFilesToStorage();
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
.toolbar-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(90deg, rgba(26, 26, 45, 0.98) 0%, rgba(37, 37, 64, 0.98) 100%);
  color: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3), 0 2px 0 rgba(74, 107, 175, 0.3);
  padding: 0 20px;
  z-index: 1000;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: all 0.3s ease;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.toolbar-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(180deg, rgba(74, 107, 175, 0.1) 0%, rgba(0, 0, 0, 0) 100%);
  pointer-events: none;
  opacity: 0.5;
}

.toolbar-container::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg,
      rgba(58, 93, 217, 0.1) 0%,
      rgba(74, 110, 224, 0.6) 50%,
      rgba(58, 93, 217, 0.1) 100%);
  filter: drop-shadow(0 1px 2px rgba(74, 107, 175, 0.5));
}

.toolbar-content {
  width: 100%;
  max-width: 1400px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.toolbar-content::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 10%;
  width: 80%;
  height: 1px;
  background: linear-gradient(90deg,
      rgba(74, 107, 175, 0) 0%,
      rgba(74, 107, 175, 0.05) 50%,
      rgba(74, 107, 175, 0) 100%);
  transform: translateY(-50%);
  pointer-events: none;
}

/* Logo 样式 */
.logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 160px;
  padding-right: 10px;
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

.logo::before {
  content: '';
  position: absolute;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(74, 107, 175, 0.2) 0%, rgba(30, 30, 50, 0) 70%);
  animation: pulse 3s infinite ease-in-out;
}

.logo::after {
  content: '';
  position: absolute;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(74, 107, 175, 0.05) 0%, rgba(30, 30, 50, 0) 70%);
  animation: pulse 4s infinite ease-in-out 1s;
}

.logo-icon {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  transition: all 0.3s ease;
  z-index: 2;
  position: relative;
}

.logo-icon:hover {
  filter: drop-shadow(0 2px 8px rgba(74, 107, 175, 0.5));
  transform: rotate(-5deg) scale(1.05);
}

.logo-text {
  font-weight: 600;
  font-size: 16px;
  background: linear-gradient(90deg, #ffffff 0%, #d0d0f0 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  position: relative;
  transition: all 0.3s ease;
}

.logo-text:hover {
  background: linear-gradient(90deg, #ffffff 0%, #a0c0ff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  letter-spacing: 0.6px;
  transform: translateY(-1px);
}

.logo-text span {
  font-weight: 400;
  opacity: 0.8;
  font-size: 15px;
  transition: all 0.3s ease;
}

.logo-text:hover span {
  opacity: 1;
}

.logo-text::after {
  content: '';
  position: absolute;
  bottom: -3px;
  left: 0;
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg,
      rgba(74, 110, 224, 0.6) 0%,
      rgba(74, 110, 224, 0.1) 100%);
  transition: all 0.3s ease;
}

.logo-text:hover::after {
  width: 80%;
  left: 10%;
  background: linear-gradient(90deg,
      rgba(74, 110, 224, 0.1) 0%,
      rgba(74, 110, 224, 0.8) 50%,
      rgba(74, 110, 224, 0.1) 100%);
}

/* 文件标签页样式 */
.file-tabs-container {
  flex: 1;
  display: flex;
  overflow: hidden;
  max-width: 60%;
  position: relative;
  padding-bottom: 1px;
}

.file-tabs-container::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(255, 255, 255, 0.05);
  z-index: 0;
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
  scrollbar-color: rgba(74, 107, 175, 0.4) rgba(0, 0, 0, 0.2);
  width: 100%;
  position: relative;
  padding-bottom: 2px;
  mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%);
  -webkit-mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%);
}

.file-tabs-scroll::-webkit-scrollbar {
  height: 4px;
}

.file-tabs-scroll::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.file-tabs-scroll::-webkit-scrollbar-thumb {
  background: rgba(74, 107, 175, 0.4);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.file-tabs-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(74, 107, 175, 0.6);
}

.file-tabs {
  display: flex;
  height: 35px;
  align-items: center;
  min-width: min-content;
  position: relative;
  padding-bottom: 1px;
  margin-top: 3px;
}

.file-tab {
  display: flex;
  align-items: center;
  padding: 0 12px 0 14px;
  height: 32px;
  min-width: 120px;
  max-width: 180px;
  background: rgba(40, 40, 65, 0.5);
  border-radius: 6px 6px 0 0;
  margin-right: 2px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  z-index: 1;
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-bottom: none;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.file-tab::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 50%);
  border-radius: 6px 6px 0 0;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.file-tab:hover::before {
  opacity: 1;
}

.file-tab::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg,
      rgba(74, 107, 175, 0.2) 0%,
      rgba(74, 107, 175, 0.5) 50%,
      rgba(74, 107, 175, 0.2) 100%);
  opacity: 0;
  transform: scaleX(0.7);
  transition: all 0.3s ease;
}

.file-tab:hover::after {
  opacity: 0.7;
  transform: scaleX(1);
}

.file-tab.active {
  background: linear-gradient(180deg, rgba(74, 107, 175, 0.3) 0%, rgba(60, 90, 150, 0.2) 100%);
  height: 35px;
  z-index: 2;
  border-top: 2px solid #4a6baf;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
}

.file-tab.active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
}

.file-tab.active::after {
  opacity: 1;
  transform: scaleX(1);
  height: 2px;
  background: linear-gradient(90deg,
      rgba(74, 107, 175, 0.3) 0%,
      rgba(100, 150, 255, 0.8) 50%,
      rgba(74, 107, 175, 0.3) 100%);
}

.file-tab:hover:not(.active) {
  background: rgba(50, 50, 80, 0.7);
  transform: translateY(-1px);
}

.file-tab-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: #ccc;
  padding-right: 5px;
  transition: color 0.2s ease, transform 0.2s ease;
  position: relative;
}

.file-tab:hover .file-tab-name {
  color: #fff;
  transform: translateX(2px);
}

.active .file-tab-name {
  color: white;
  font-weight: 500;
}

.file-tab-close {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #888;
  cursor: pointer;
  opacity: 0.5;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  padding: 0;
}

.file-tab-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  opacity: 1;
  transform: scale(1.1) rotate(90deg);
}

.file-tab.active .file-tab-close {
  opacity: 0.7;
}

.new-file-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2e3044 0%, #252535 100%);
  color: white;
  border: 1px solid rgba(74, 107, 175, 0.15);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  margin-left: 5px;
  position: relative;
  overflow: hidden;
}

.new-file-btn:hover {
  background: linear-gradient(135deg, #363852 0%, #2d2d43 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.new-file-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.new-file-btn svg {
  transition: transform 0.3s ease;
}

.new-file-btn:hover svg {
  transform: rotate(90deg);
}

/* 工具栏操作区 */
.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  position: relative;
}

.filename-container {
  position: relative;
  width: 180px;
}

.filename-container::before {
  content: '';
  position: absolute;
  top: 50%;
  left: -20px;
  width: 1px;
  height: 24px;
  background: linear-gradient(to bottom, rgba(74, 107, 175, 0.1), rgba(74, 107, 175, 0.3), rgba(74, 107, 175, 0.1));
  transform: translateY(-50%);
  opacity: 0.5;
}

.filename-input {
  width: 100%;
  background-color: rgba(30, 30, 50, 0.6);
  border: 1px solid rgba(74, 107, 175, 0.3);
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
}

.filename-input:focus {
  border-color: #4a6baf;
  box-shadow: 0 0 0 2px rgba(74, 107, 175, 0.25), inset 0 1px 3px rgba(0, 0, 0, 0.1);
  background-color: rgba(40, 40, 65, 0.7);
  transform: translateY(-1px);
}

.filename-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: rgba(20, 20, 30, 0.6);
}

.toolbar-btn {
  background: linear-gradient(135deg, #303050 0%, #252540 100%);
  border: none;
  border-radius: 10px;
  color: white;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  width: 42px;
  height: 42px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
}

.toolbar-btn::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.toolbar-btn:hover::before {
  opacity: 1;
}

.toolbar-btn:disabled {
  cursor: not-allowed;
}

.btn-disabled {
  opacity: 0.4;
  filter: grayscale(0.8);
  transform: none !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.02) inset !important;
  cursor: not-allowed;
}

.btn-disabled::after {
  opacity: 0.3;
}

.btn-disabled:hover {
  transform: none !important;
  background: linear-gradient(135deg, #303050 0%, #252540 100%) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.02) inset !important;
}

.toolbar-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0));
  border-radius: 10px 10px 0 0;
}

.toolbar-btn:hover {
  background: linear-gradient(135deg, #3a3a60 0%, #2d2d4d 100%);
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
}

.toolbar-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.icon {
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  z-index: 2;
}

.toolbar-btn:hover .icon {
  transform: scale(1.1);
}

.btn-control {
  height: 42px;
  width: 42px;
  background: linear-gradient(135deg, #2e3044 0%, #252535 100%);
  position: relative;
  border: 1px solid rgba(74, 107, 175, 0.15);
}

.btn-control::after {
  content: '';
  position: absolute;
  top: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background: rgba(74, 107, 175, 0.8);
  border-radius: 1px;
}

.btn-control:hover {
  background: linear-gradient(135deg, #363852 0%, #2d2d43 100%);
}

.btn-run {
  background: linear-gradient(135deg, #2e3044 0%, #252535 100%);
}

.btn-run .icon {
  transform: translateX(1px);
}

.btn-run:hover .icon {
  transform: translateX(2px) scale(1.1);
}

.btn-stop {
  background: linear-gradient(135deg, #2e3044 0%, #252535 100%);
  border: 1px solid rgba(211, 47, 47, 0.15);
}

.btn-stop::after {
  background: rgba(211, 47, 47, 0.7);
}

.btn-stop:hover {
  background: linear-gradient(135deg, #363852 0%, #2d2d43 100%);
}

.btn-save {
  background: linear-gradient(135deg, #2e3044 0%, #252535 100%);
  border: 1px solid rgba(48, 160, 85, 0.15);
}

.btn-save::after {
  background: rgba(48, 160, 85, 0.7);
}

.btn-save:hover {
  background: linear-gradient(135deg, #363852 0%, #2d2d43 100%);
}

.btn-save:hover .icon {
  transform: translateY(-2px) scale(1.1);
}

.btn-export {
  background: linear-gradient(135deg, #2e3044 0%, #252535 100%);
  border: 1px solid rgba(138, 84, 227, 0.15);
}

.btn-export::after {
  background: rgba(138, 84, 227, 0.7);
}

.btn-export:hover {
  background: linear-gradient(135deg, #363852 0%, #2d2d43 100%);
}

.btn-export:hover .icon {
  transform: translateY(-2px) scale(1.1);
}

.btn-import {
  background: linear-gradient(135deg, #2e3044 0%, #252535 100%);
  border: 1px solid rgba(227, 138, 84, 0.15);
}

.btn-import::after {
  background: rgba(227, 138, 84, 0.7);
}

.btn-import:hover {
  background: linear-gradient(135deg, #363852 0%, #2d2d43 100%);
}

.btn-import:hover .icon {
  transform: translateY(2px) scale(1.1);
}

.is-running .btn-control {
  background: linear-gradient(135deg, #2e3044 0%, #252535 100%);
  border: 1px solid rgba(211, 47, 47, 0.25);
}

.is-running .btn-control::after {
  background: rgba(211, 47, 47, 0.8);
}

.is-running .btn-control:hover {
  background: linear-gradient(135deg, #363852 0%, #2d2d43 100%);
}

/* 添加节点管理器按钮样式 */
.btn-node-manager {
  background: linear-gradient(135deg, #2e3044 0%, #252535 100%);
  border: 1px solid rgba(138, 84, 227, 0.15);
}

.btn-node-manager::after {
  background: rgba(138, 84, 227, 0.7);
}

.btn-node-manager:hover {
  background: linear-gradient(135deg, #363852 0%, #2d2d43 100%);
}

.btn-node-manager:hover .icon {
  transform: rotate(45deg) scale(1.1);
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
  background: linear-gradient(145deg, #1e1e2d 0%, #1a1a25 100%);
  border-radius: 14px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05),
    0 0 0 3px rgba(74, 107, 175, 0.2),
    0 0 30px rgba(74, 107, 175, 0.1);
  width: 400px;
  max-width: 90%;
  overflow: hidden;
  animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: auto;
}

.modal-header {
  background: linear-gradient(90deg, #303048 0%, #252538 100%);
  padding: 15px 20px;
  border-bottom: 1px solid #3a3a58;
  position: relative;
}

.close-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 24px;
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
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  display: flex;
  align-items: center;
}

.modal-header h3::before {
  content: "⚠️";
  margin-right: 10px;
  font-size: 18px;
}

.modal-body {
  padding: 20px;
  color: #bbbbcc;
  line-height: 1.5;
  font-size: 15px;
}

.modal-body p {
  margin-top: 0;
  margin-bottom: 10px;
}

.warning-text {
  color: #e57373;
  font-size: 13px;
  margin-top: 10px;
  display: flex;
  align-items: center;
}

.warning-text::before {
  content: "⚠️";
  margin-right: 8px;
  font-size: 14px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 15px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  gap: 12px;
  background: rgba(0, 0, 0, 0.15);
}

.modal-btn {
  padding: 10px 18px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  font-weight: 500;
  border: none;
  min-width: 80px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
}

.modal-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0));
  border-radius: 8px 8px 0 0;
}

.modal-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.modal-btn:active {
  transform: translateY(0);
}

.cancel-btn {
  background: linear-gradient(145deg, #2e3044, #252535);
  color: #bbbbcc;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.cancel-btn:hover {
  background: linear-gradient(145deg, #363852, #2d2d43);
}

.confirm-btn {
  background: linear-gradient(145deg, #2e3044, #252535);
  color: white;
  border: 1px solid rgba(211, 47, 47, 0.2);
}

.confirm-btn::before {
  content: '';
  position: absolute;
  top: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 2px;
  background: rgba(211, 47, 47, 0.7);
  border-radius: 1px;
}

.confirm-btn:hover {
  background: linear-gradient(145deg, #363852, #2d2d43);
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
    transform: scale(0.9) translateY(20px);
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
    transform: scale(1.2);
    opacity: 0.3;
  }

  100% {
    transform: scale(1);
    opacity: 0.6;
  }
}

/* 响应式布局 */
@media (max-width: 950px) {
  .logo-text {
    display: none;
  }

  .logo-container {
    min-width: auto;
    padding-right: 5px;
  }

  .file-tabs-container {
    max-width: 50%;
  }
}

@media (max-width: 768px) {
  .toolbar-container {
    height: auto;
    padding: 12px 15px;
    flex-direction: column;
    align-items: flex-start;
  }

  .toolbar-content {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .logo-container {
    margin-bottom: 10px;
    align-self: center;
  }

  .logo-text {
    display: inline;
  }

  .file-tabs-container {
    max-width: 100%;
    width: 100%;
    order: 1;
  }

  .toolbar-actions {
    width: 100%;
    justify-content: space-between;
    margin-top: 5px;
    order: 2;
  }

  .filename-container {
    flex: 1;
    margin-right: 10px;
    width: auto;
  }

  .toolbar-btn {
    width: 38px;
    height: 38px;
  }
}
</style>
