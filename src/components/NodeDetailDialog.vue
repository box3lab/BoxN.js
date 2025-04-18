<template>
  <div v-if="visible" class="node-detail-dialog" @click="close">
    <div class="dialog-content" @click.stop>
      <div class="dialog-header">
        <div class="header-left">
          <div class="node-icon">
            <span class="icon">📊</span>
          </div>
          <h3>{{ node ? node.title : '节点详情' }}</h3>
        </div>
        <button class="close-btn" @click="close">×</button>
      </div>

      <div class="dialog-body" v-if="node">
        <div class="node-info">
          <div class="info-card">
            <div class="info-item">
              <span class="label"><span class="icon-small">🏷️</span> 类型:</span>
              <span class="value node-type">{{ node.type }}</span>
            </div>
          </div>

          <div class="info-card" v-if="node.properties">
            <div class="info-item">
              <span class="label"><span class="icon-small">⚙️</span> 属性:</span>
              <div class="properties-list">
                <div v-for="(value, key) in node.properties" :key="key" class="property-item">
                  <span class="property-name">{{ key }}:</span>
                  <input v-if="isEditable(key, value)" class="property-value" :value="value"
                    @change="updateProperty(key, $event)" :title="'编辑 ' + key + ' 属性'" />
                  <span v-else class="property-value readonly" :title="key + ' 不可编辑'">{{ formatValue(value) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="info-card">
            <div class="info-item">
              <span class="label"><span class="icon-small">⬇️</span> 输入:</span>
              <div class="slots-list">
                <div v-for="(input, index) in getInputs()" :key="`input-${index}`" class="slot-item">
                  <span class="slot-name">{{ input.name || `输入 ${index}` }}:</span>
                  <span class="slot-type" :class="getTypeClass(input.type)">{{ input.type }}</span>
                </div>
                <div v-if="getInputs().length === 0" class="no-slots">无输入插槽</div>
              </div>
            </div>
          </div>

          <div class="info-card">
            <div class="info-item">
              <span class="label"><span class="icon-small">⬆️</span> 输出:</span>
              <div class="slots-list">
                <div v-for="(output, index) in getOutputs()" :key="`output-${index}`" class="slot-item">
                  <span class="slot-name">{{ output.name || `输出 ${index}` }}:</span>
                  <span class="slot-type" :class="getTypeClass(output.type)">{{ output.type }}</span>
                </div>
                <div v-if="getOutputs().length === 0" class="no-slots">无输出插槽</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <button class="btn btn-primary" @click="close">确定</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { PropType } from 'vue'
// 使用any类型来兼容实际LiteGraph节点结构
// import type { LGraphNode } from 'litegraph.js'

// 定义LiteGraph节点输入插槽类型
interface INodeSlot {
  name?: string
  type?: string | number
  [key: string]: unknown
}

// 用于返回值的简化插槽类型
interface SlotInfo {
  name: string
  type: string
}

// 属性值类型
type PropertyValue = string | number | boolean | object | null | undefined | (() => void)

// 重新定义一个兼容的节点类型
interface CompatibleNode {
  title: string
  type?: string | null
  properties?: Record<string, PropertyValue>
  inputs?: INodeSlot[]
  outputs?: INodeSlot[]
  [key: string]: unknown
}

export default defineComponent({
  name: 'NodeDetailDialog',

  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    node: {
      // 使用兼容类型而不是LGraphNode
      type: Object as PropType<CompatibleNode>,
      default: undefined,
    },
  },

  emits: ['close', 'update'],

  methods: {
    close() {
      this.$emit('close')
    },

    isEditable(key: string, value: PropertyValue): boolean {
      return typeof value !== 'object' && typeof value !== 'function'
    },

    formatValue(value: PropertyValue): string {
      if (value === null || value === undefined) return '空'
      if (typeof value === 'object') return '[对象]'
      if (typeof value === 'function') return '[函数]'
      return String(value)
    },

    getTypeClass(type: string): string {
      const typeMap: Record<string, string> = {
        'number': 'type-number',
        'string': 'type-string',
        'boolean': 'type-boolean',
        'object': 'type-object',
        'array': 'type-array',
        'color': 'type-color',
        'vec2': 'type-vector',
        'vec3': 'type-vector',
        'vec4': 'type-vector',
        'event': 'type-event',
        '未知': 'type-unknown'
      }

      // 尝试匹配基本类型
      for (const [key, className] of Object.entries(typeMap)) {
        if (type.toLowerCase().includes(key.toLowerCase())) {
          return className
        }
      }

      return 'type-default'
    },

    updateProperty(key: string, event: Event) {
      if (!this.node || !this.node.properties) return

      const target = event.target as HTMLInputElement
      let value: PropertyValue = target.value

      // 尝试转换为原始类型
      const originalValue = this.node.properties[key]
      if (typeof originalValue === 'number') {
        value = Number(value)
      } else if (originalValue === 'true' || originalValue === 'false') {
        value = value === 'true'
      }

      // 创建副本而不是直接修改props
      const updatedNode = { ...this.node }
      if (!updatedNode.properties) {
        updatedNode.properties = {}
      }
      updatedNode.properties = { ...updatedNode.properties, [key]: value }

      // 通知父组件更新
      this.$emit('update', updatedNode)
    },

    getInputs(): SlotInfo[] {
      if (!this.node || !this.node.inputs) return []

      return this.node.inputs.map((input: INodeSlot, index: number) => {
        let typeName = '未知'
        if (input && input.type !== undefined) {
          typeName = input.type.toString()
        }

        return {
          name: input?.name || `输入 ${index}`,
          type: typeName,
        }
      })
    },

    getOutputs(): SlotInfo[] {
      if (!this.node || !this.node.outputs) return []

      return this.node.outputs.map((output: INodeSlot, index: number) => {
        let typeName = '未知'
        if (output && output.type !== undefined) {
          typeName = output.type.toString()
        }

        return {
          name: output?.name || `输出 ${index}`,
          type: typeName,
        }
      })
    },
  },
})
</script>

<style scoped>
.node-detail-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(3px);
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.dialog-content {
  background-color: #1a1a1a;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7),
    0 0 0 1px rgba(255, 255, 255, 0.05),
    0 1px 0 0 rgba(255, 255, 255, 0.1) inset;
  width: 550px;
  max-width: 90%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  color: #e0e0e0;
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 22px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: linear-gradient(90deg, #252530 0%, #1e1e28 100%);
  position: relative;
}

.dialog-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg,
      rgba(58, 93, 217, 0.1) 0%,
      rgba(74, 110, 224, 0.5) 50%,
      rgba(58, 93, 217, 0.1) 100%);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.node-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, rgba(66, 99, 205, 0.2) 0%, rgba(74, 110, 224, 0.4) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05);
}

.icon {
  font-size: 22px;
}

.icon-small {
  font-size: 14px;
  margin-right: 4px;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  color: #fff;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #888;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  color: #fff;
  background-color: rgba(255, 255, 255, 0.1);
  transform: rotate(90deg);
}

.dialog-body {
  padding: 25px;
  overflow-y: auto;
  flex: 1;
  background-color: #1a1a1a;
}

.dialog-footer {
  padding: 18px 22px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: flex-end;
  background-color: #1e1e28;
  position: relative;
}

.dialog-footer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg,
      rgba(58, 93, 217, 0.1) 0%,
      rgba(74, 110, 224, 0.5) 50%,
      rgba(58, 93, 217, 0.1) 100%);
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  background-color: #333;
  color: #e0e0e0;
  transition: all 0.2s;
  font-weight: 500;
}

.btn-primary {
  background: linear-gradient(90deg, #3a5dd9 0%, #4a6ee0 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(58, 93, 217, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
}

.btn-primary:hover {
  background: linear-gradient(90deg, #4a6ee0 0%, #5a7ef0 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(58, 93, 217, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.2) inset;
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(58, 93, 217, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
}

.node-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card {
  background-color: rgba(30, 30, 40, 0.4);
  border-radius: 10px;
  padding: 18px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.03);
  transition: all 0.3s;
}

.info-card:hover {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  background-color: rgba(36, 36, 48, 0.4);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.label {
  font-weight: 600;
  color: #aaa;
  display: flex;
  align-items: center;
  font-size: 15px;
}

.value {
  font-family: 'Monaco', 'Consolas', monospace;
}

.node-type {
  color: #4a6ee0;
  background-color: rgba(74, 110, 224, 0.1);
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 13px;
  border-left: 3px solid #4a6ee0;
  font-weight: 500;
  display: inline-block;
}

.properties-list,
.slots-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-left: 12px;
  border-left: 2px solid rgba(74, 110, 224, 0.4);
  padding-left: 16px;
  padding-top: 8px;
  padding-bottom: 8px;
}

.property-item,
.slot-item {
  display: flex;
  align-items: center;
  transition: all 0.2s;
  border-radius: 4px;
  padding: 4px 8px;
}

.property-item:hover,
.slot-item:hover {
  background-color: rgba(255, 255, 255, 0.03);
}

.property-name,
.slot-name {
  min-width: 120px;
  font-weight: 500;
  color: #ccc;
  margin-right: 12px;
}

.property-value,
.slot-type {
  flex: 1;
  color: #ddd;
}

.readonly {
  opacity: 0.7;
  font-style: italic;
}

input.property-value {
  border: 1px solid #444;
  padding: 9px 12px;
  border-radius: 6px;
  background-color: #252525;
  color: #e0e0e0;
  transition: all 0.2s;
  font-size: 13px;
}

input.property-value:hover {
  border-color: #555;
  background-color: #2a2a2a;
}

input.property-value:focus {
  outline: none;
  border-color: #4a6ee0;
  background-color: #2a2a2a;
  box-shadow: 0 0 0 3px rgba(74, 110, 224, 0.2);
}

.no-slots {
  color: #666;
  font-style: italic;
  padding: 6px 0;
}

/* 插槽类型徽章 */
.slot-type {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  min-width: 80px;
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.type-number {
  background-color: rgba(66, 153, 225, 0.15);
  color: #63b3ed;
  border-left: 3px solid #63b3ed;
}

.type-string {
  background-color: rgba(72, 187, 120, 0.15);
  color: #68d391;
  border-left: 3px solid #68d391;
}

.type-boolean {
  background-color: rgba(237, 137, 54, 0.15);
  color: #f6ad55;
  border-left: 3px solid #f6ad55;
}

.type-object {
  background-color: rgba(159, 122, 234, 0.15);
  color: #b794f4;
  border-left: 3px solid #b794f4;
}

.type-array {
  background-color: rgba(159, 122, 234, 0.15);
  color: #b794f4;
  border-left: 3px solid #b794f4;
}

.type-color {
  background-color: rgba(237, 100, 166, 0.15);
  color: #f687b3;
  border-left: 3px solid #f687b3;
}

.type-vector {
  background-color: rgba(246, 173, 85, 0.15);
  color: #fbd38d;
  border-left: 3px solid #fbd38d;
}

.type-event {
  background-color: rgba(113, 128, 150, 0.15);
  color: #a0aec0;
  border-left: 3px solid #a0aec0;
}

.type-unknown {
  background-color: rgba(160, 174, 192, 0.15);
  color: #a0aec0;
  border-left: 3px solid #a0aec0;
}

.type-default {
  background-color: rgba(203, 213, 224, 0.15);
  color: #cbd5e0;
  border-left: 3px solid #cbd5e0;
}

/* 滚动条样式 */
.dialog-body::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.dialog-body::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.dialog-body::-webkit-scrollbar-thumb {
  background: rgba(74, 107, 175, 0.6);
  border-radius: 4px;
  border: 2px solid rgba(20, 20, 35, 0.8);
}

.dialog-body::-webkit-scrollbar-thumb:hover {
  background: rgba(74, 107, 175, 0.8);
}

/* Firefox样式 */
.dialog-body {
  scrollbar-width: thin;
  scrollbar-color: rgba(74, 107, 175, 0.6) rgba(0, 0, 0, 0.2);
}
</style>
