<template>
  <div v-if="visible" class="node-detail-dialog">
    <div class="dialog-content">
      <div class="dialog-header">
        <h3>{{ node ? node.title : '节点详情' }}</h3>
        <button class="close-btn" @click="close">×</button>
      </div>

      <div class="dialog-body" v-if="node">
        <div class="node-info">
          <div class="info-item">
            <span class="label">类型:</span>
            <span class="value">{{ node.type }}</span>
          </div>

          <div class="info-item" v-if="node.properties">
            <span class="label">属性:</span>
            <div class="properties-list">
              <div v-for="(value, key) in node.properties" :key="key" class="property-item">
                <span class="property-name">{{ key }}:</span>
                <input
                  v-if="isEditable(key, value)"
                  class="property-value"
                  :value="value"
                  @change="updateProperty(key, $event)"
                />
                <span v-else class="property-value">{{ formatValue(value) }}</span>
              </div>
            </div>
          </div>

          <div class="info-item">
            <span class="label">输入:</span>
            <div class="slots-list">
              <div v-for="(input, index) in getInputs()" :key="`input-${index}`" class="slot-item">
                <span class="slot-name">{{ input.name || `输入 ${index}` }}:</span>
                <span class="slot-type">{{ input.type }}</span>
              </div>
            </div>
          </div>

          <div class="info-item">
            <span class="label">输出:</span>
            <div class="slots-list">
              <div
                v-for="(output, index) in getOutputs()"
                :key="`output-${index}`"
                class="slot-item"
              >
                <span class="slot-name">{{ output.name || `输出 ${index}` }}:</span>
                <span class="slot-type">{{ output.type }}</span>
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
}

.dialog-content {
  background-color: #1e1e1e;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
  width: 500px;
  max-width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  border: 1px solid #333;
  color: #e0e0e0;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #333;
  background-color: #252525;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  color: #e0e0e0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #888;
}

.close-btn:hover {
  color: #ccc;
}

.dialog-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  background-color: #1e1e1e;
}

.dialog-footer {
  padding: 15px 20px;
  border-top: 1px solid #333;
  display: flex;
  justify-content: flex-end;
  background-color: #252525;
}

.btn {
  padding: 8px 15px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  background-color: #333;
  color: #e0e0e0;
}

.btn-primary {
  background-color: #3a5dd9;
  color: white;
}

.btn-primary:hover {
  background-color: #4a6ee0;
}

.node-info {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.label {
  font-weight: bold;
  color: #aaa;
}

.properties-list,
.slots-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-left: 10px;
  border-left: 2px solid #333;
  padding-left: 10px;
}

.property-item,
.slot-item {
  display: flex;
  align-items: center;
}

.property-name,
.slot-name {
  min-width: 100px;
  font-weight: 500;
  color: #bbb;
}

.property-value,
.slot-type {
  flex: 1;
  color: #ddd;
}

input.property-value {
  border: 1px solid #444;
  padding: 5px;
  border-radius: 3px;
  background-color: #252525;
  color: #e0e0e0;
}

input.property-value:focus {
  outline: 1px solid #4a6ee0;
  background-color: #2a2a2a;
}
</style>
