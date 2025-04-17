<template>
  <div ref="toolbox" class="floating-toolbox" :class="{ 'is-running': isRunning }"
    :style="{ top: position.y + 'px', left: position.x + 'px' }" @mousedown="startDrag" @touchstart="startDrag">
    <div class="toolbox-handle">
      <span class="drag-indicator">⋮⋮</span>
    </div>
    <div class="filename-container">
      <div class="filename-label">文件名:</div>
      <div class="filename-input-group">
        <input type="text" v-model="filename" placeholder="请输入文件名" class="filename-input" title="设置导出文件名" />
      </div>
      <div class="filename-tips">设置下载时使用的文件名</div>
    </div>
    <div class="toolbox-content">
      <div class="other-buttons">
        <button class="toolbox-btn btn-node-manager" @click="$emit('open-manager')" title="节点管理器">
          <svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="24"
            height="24">
            <path
              d="M832 64H192c-35.3 0-64 28.7-64 64v768c0 35.3 28.7 64 64 64h640c35.3 0 64-28.7 64-64V128c0-35.3-28.7-64-64-64zM200 192h80v80h-80v-80z m0 160h80v80h-80v-80z m0 160h80v80h-80v-80z m160 320H200v-80h160v80z m240 0H400v-80h200v80z m264 0h-224v-80h224v80z m0-160H400v-80h464v80z m0-160H400v-80h464v80z m0-160H400v-80h464v80z"
              fill="#ffffff"></path>
          </svg>
        </button>

        <button class="toolbox-btn btn-import" @click="$emit('import')" title="从文件导入">
          <svg class="icon" viewBox="0 0 1052 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="24"
            height="24">
            <path
              d="M22.926398 1001.119364V45.715511h397.573937l151.241007 137.283819h457.933056v818.120034z m91.522545-91.522546h823.702909v-439.308218h-823.702909z m823.702909-530.830764v-104.335701h-401.738213l-26.129687-23.795862-125.157081-113.579479H114.448943v241.711042z"
              fill="#ffffff"></path>
          </svg>
        </button>

        <button class="toolbox-btn btn-export" @click="exportFile" title="导出到文件">
          <svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="24"
            height="24">
            <path
              d="M918.186667 1024H105.813333C68.266667 1024 34.133333 993.28 34.133333 952.32V211.626667c0-37.546667 34.133333-71.68 71.68-71.68h194.56c30.72 0 54.613333 23.893333 54.613334 54.613333s-23.893333 51.2-54.613334 51.2H139.946667v672.426667h740.693333V245.76h-160.426667c-30.72 0-54.613333-23.893333-54.613333-54.613333S689.493333 136.533333 720.213333 136.533333h194.56C955.733333 139.946667 989.866667 174.08 989.866667 211.626667v740.693333c0 40.96-34.133333 71.68-71.68 71.68z m-177.493334-546.133333c0 13.653333-6.826667 27.306667-17.066666 37.546666L546.133333 692.906667c-10.24 10.24-23.893333 17.066667-37.546666 17.066666-13.653333 0-27.306667-6.826667-37.546667-17.066666l-177.493333-177.493334c-10.24-10.24-17.066667-23.893333-17.066667-37.546666 0-30.72 23.893333-54.613333 54.613333-54.613334 13.653333 0 27.306667 6.826667 37.546667 17.066667l85.333333 85.333333V54.613333C457.386667 23.893333 481.28 0 512 0s54.613333 23.893333 54.613333 54.613333v471.04l85.333334-85.333333c10.24-10.24 23.893333-17.066667 37.546666-17.066667 27.306667 0 51.2 23.893333 51.2 54.613334z"
              fill="#ffffff"></path>
          </svg>
        </button>

        <button class="toolbox-btn btn-save" @click="$emit('save')" title="保存 (Ctrl+S / ⌘+S)">
          <svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="24"
            height="24">
            <path
              d="M298.666667 810.666667v-256h426.666666v256h85.333334V333.994667L690.005333 213.333333H213.333333v597.333334h85.333334zM170.666667 128h554.666666l170.666667 170.666667v554.666666a42.666667 42.666667 0 0 1-42.666667 42.666667H170.666667a42.666667 42.666667 0 0 1-42.666667-42.666667V170.666667a42.666667 42.666667 0 0 1 42.666667-42.666667z m213.333333 512v170.666667h256v-170.666667H384z"
              fill="#ffffff"></path>
          </svg>
        </button>
      </div>
      <button class="toolbox-btn btn-control" :class="{ 'btn-stop': isRunning, 'btn-run': !isRunning }"
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
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'

const props = defineProps({
  initialX: {
    type: Number,
    default: 20,
  },
  initialY: {
    type: Number,
    default: 20,
  },
})

const emit = defineEmits(['run', 'stop', 'save', 'export', 'import', 'open-manager'])

// 文件名
const filename = ref('litegraph')

// 从本地存储加载文件名
const loadSavedFilename = () => {
  try {
    const savedFilename = localStorage.getItem('boxn_filename')
    if (savedFilename) {
      filename.value = savedFilename
    }
  } catch (e) {
    console.warn('无法从本地存储加载文件名', e)
  }
}

// 保存文件名到本地存储
const saveFilenameToStorage = () => {
  try {
    localStorage.setItem('boxn_filename', filename.value)
  } catch (e) {
    console.warn('无法保存文件名到本地存储', e)
  }
}

// 监听文件名变化，保存到本地存储
watch(filename, saveFilenameToStorage)

// 组件挂载时加载文件名
onMounted(loadSavedFilename)

// 工具箱状态
const isRunning = ref(false)

// 工具箱位置
const position = reactive({
  x: props.initialX,
  y: props.initialY,
})

// 拖动状态
const isDragging = ref(false)
const dragOffset = reactive({ x: 0, y: 0 })
const toolbox = ref<HTMLElement | null>(null)

// 切换运行状态
const toggleRunning = () => {
  isRunning.value = !isRunning.value
  if (isRunning.value) {
    emit('run')
  } else {
    emit('stop')
  }
}

// 导出文件
const exportFile = () => {
  saveFilenameToStorage()
  emit('export', filename.value)
}

// 开始拖动
const startDrag = (event: MouseEvent | TouchEvent) => {
  if (!toolbox.value) return

  // 如果点击的是按钮或输入框，不启动拖动
  if (event.target instanceof HTMLElement) {
    const target = event.target as HTMLElement
    if (
      target.tagName === 'BUTTON' ||
      target.closest('button') ||
      target.tagName === 'INPUT' ||
      target.closest('input')
    ) {
      return
    }
  }

  isDragging.value = true

  // 计算点击/触摸位置与工具箱左上角的偏移
  if (event instanceof MouseEvent) {
    dragOffset.x = event.clientX - position.x
    dragOffset.y = event.clientY - position.y

    document.addEventListener('mousemove', onDrag)
    document.addEventListener('mouseup', stopDrag)
  } else {
    // TouchEvent
    const touch = event.touches[0]
    dragOffset.x = touch.clientX - position.x
    dragOffset.y = touch.clientY - position.y

    document.addEventListener('touchmove', onDrag)
    document.addEventListener('touchend', stopDrag)
  }
}

// 拖动中
const onDrag = (event: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return

  let clientX, clientY

  if (event instanceof MouseEvent) {
    clientX = event.clientX
    clientY = event.clientY
  } else {
    // TouchEvent
    const touch = event.touches[0]
    clientX = touch.clientX
    clientY = touch.clientY
  }

  // 计算新位置
  position.x = clientX - dragOffset.x
  position.y = clientY - dragOffset.y

  // 防止拖出视口
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const boxWidth = toolbox.value?.offsetWidth || 0
  const boxHeight = toolbox.value?.offsetHeight || 0

  position.x = Math.max(0, Math.min(position.x, viewportWidth - boxWidth))
  position.y = Math.max(0, Math.min(position.y, viewportHeight - boxHeight))
}

// 停止拖动
const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)

  // 保存位置到本地存储
  try {
    localStorage.setItem('boxn_toolbox_position', JSON.stringify(position))
  } catch (e) {
    console.warn('无法保存工具箱位置', e)
  }
}

// 挂载时尝试从本地存储恢复位置
onMounted(() => {
  try {
    const savedPosition = localStorage.getItem('boxn_toolbox_position')
    if (savedPosition) {
      const pos = JSON.parse(savedPosition)
      position.x = pos.x
      position.y = pos.y
    }
  } catch (e) {
    console.warn('无法加载工具箱位置', e)
  }
})
</script>

<style scoped>
.floating-toolbox {
  position: fixed;
  background-color: #333;
  color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  padding: 10px;
  width: 220px;
  z-index: 1000;
  user-select: none;
  display: flex;
  flex-direction: column;
}

.toolbox-handle {
  width: 100%;
  cursor: move;
  text-align: center;
  padding-bottom: 5px;
  margin-bottom: 5px;
  border-bottom: 1px solid #444;
}

.drag-indicator {
  color: #888;
  font-size: 14px;
  letter-spacing: 1px;
}

.filename-container {
  margin-bottom: 10px;
}

.filename-label {
  font-size: 12px;
  margin-bottom: 3px;
  color: #aaa;
}

.filename-input-group {
  display: flex;
  align-items: center;
}

.filename-input {
  flex: 1;
  background-color: #222;
  border: 1px solid #444;
  color: white;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 12px;
  outline: none;
}

.filename-input:focus {
  border-color: #666;
}

.filename-tips {
  font-size: 10px;
  color: #888;
  margin-top: 3px;
}

.toolbox-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toolbox-btn {
  background-color: #444;
  border: none;
  border-radius: 4px;
  color: white;
  padding: 8px;
  margin: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.toolbox-btn:hover {
  background-color: #555;
}

.btn-control {
  height: 40px;
  width: 40px;
  background-color: #2a6cbf;
}

.btn-control:hover {
  background-color: #2978d8;
}

.btn-run {
  background-color: #2a6cbf;
}

.btn-stop {
  background-color: #bf2a2a;
}

.btn-stop:hover {
  background-color: #d82a2a;
}

.other-buttons {
  display: flex;
}

.btn-save {
  background-color: #2a8c4a;
}

.btn-save:hover {
  background-color: #2a9e53;
}

.is-running .btn-control {
  background-color: #bf2a2a;
}

.is-running .btn-control:hover {
  background-color: #d82a2a;
}

/* 添加节点管理器按钮样式 */
.btn-node-manager {
  background-color: #8e44ad;
  border-radius: 5px;
}

.btn-node-manager:hover {
  background-color: #9b59b6;
}

@media (max-width: 480px) {
  .floating-toolbox {
    width: 180px;
  }
}
</style>
