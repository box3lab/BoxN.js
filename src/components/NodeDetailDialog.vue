<template>
  <div v-if="visible" class="node-detail-sidebar">
    <div class="sidebar-content">
      <div class="sidebar-header">
        <div class="header-left">
          <div class="node-icon">
            <span class="icon">📊</span>
          </div>
          <h3>{{ node ? node.title : '节点详情' }}</h3>
        </div>
        <button class="close-btn" @click="close">×</button>
      </div>

      <div class="sidebar-body" v-if="node">
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
                  <input
                    v-if="isEditable(key, value) && !isEnumProperty(key) && !isBooleanProperty(value) && !isNumberProperty(value) && !isColorProperty(key, value)"
                    class="property-value" :value="value" @change="updateProperty(key, $event)"
                    :title="'编辑 ' + key + ' 属性'" />
                  <input v-else-if="isColorProperty(key, value)" type="color" class="property-value color-picker"
                    :value="formatColorValue(value)" @change="updateProperty(key, $event)"
                    :title="'选择 ' + key + ' 颜色'" />
                  <div v-else-if="isNumberProperty(value)" class="number-input-container">
                    <button class="number-btn" @click="decrementNumber(key)">-</button>
                    <input type="number" class="property-value number-value" :value="value"
                      @change="updateProperty(key, $event)" :title="'编辑 ' + key + ' 属性'" step="1" />
                    <button class="number-btn" @click="incrementNumber(key)">+</button>
                  </div>
                  <select v-else-if="isEnumProperty(key)" class="property-value select-value" :value="value"
                    @change="updateProperty(key, $event)" :title="'选择 ' + key + ' 属性'">
                    <option v-for="option in getPropertyOptions(key)" :key="option" :value="option">{{ option }}
                    </option>
                  </select>
                  <div v-else-if="isBooleanProperty(value)" class="toggle-switch-container">
                    <label class="toggle-switch">
                      <input type="checkbox" :checked="Boolean(value)" @change="updateBooleanProperty(key, $event)">
                      <span class="slider round"></span>
                    </label>
                    <span class="boolean-value">{{ Boolean(value) ? 'True' : 'False' }}</span>
                  </div>
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

      <div class="sidebar-footer">
        <button class="btn btn-primary" @click="close">关闭</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { PropType } from 'vue'

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

    // 克隆节点并更新属性，避免直接修改props和循环引用
    cloneAndUpdateNodeProperty(key: string, value: PropertyValue) {
      if (!this.node) return null;

      try {
        // 不使用JSON.parse(JSON.stringify())克隆，避免循环引用问题
        // 只复制必要的属性进行更新
        const clonedProperties: Record<string, PropertyValue> = {};

        // 复制现有属性（如果存在）
        const nodeProperties = this.node.properties || {};
        Object.keys(nodeProperties).forEach(propKey => {

          const propValue = nodeProperties[propKey];
          if (propValue !== undefined && propValue !== null &&
            typeof propValue !== 'function' && typeof propValue !== 'object') {
            clonedProperties[propKey] = propValue;
          }
        });

        // 添加新属性
        clonedProperties[key] = value;

        // 返回只有必要信息的更新后的节点
        return {
          title: this.node.title,
          type: this.node.type,
          properties: clonedProperties
        };
      } catch (error) {
        console.error('克隆节点失败:', error);
        return null;
      }
    },

    // 尝试设置节点属性的不同方法
    trySetNodeProperty(key: string, value: PropertyValue) {
      if (!this.node) return;

      try {
        // 方法1: 直接调用setProperty (如果存在)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (this.node && typeof (this.node as any).setProperty === 'function') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (this.node as any).setProperty(key, value);
          console.log(`使用setProperty方法: ${key} = ${value}`);
          return true;
        }

        // 方法2: 直接更新属性 (冒险但有效)
        if (this.node && this.node.properties) {
          // 先备份原始属性值
          const originalValue = this.node.properties[key];

          // eslint-disable-next-line vue/no-mutating-props
          this.node.properties[key] = value;

          console.log(`直接更新属性 (原始值=${originalValue}, 新值=${value})`);
          return true;
        }

        return false;
      } catch (error) {
        console.error('尝试设置节点属性失败:', error);
        return false;
      }
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
      if (!this.node) return

      const target = event.target as HTMLInputElement
      let value: PropertyValue = target.value

      try {
        // 尝试转换为原始类型
        const originalValue = this.node.properties ? this.node.properties[key] : null
        if (typeof originalValue === 'number') {
          value = Number(value)
        } else if (originalValue === 'true' || originalValue === 'false') {
          value = value === 'true'
        }

        // 尝试直接设置属性（内部处理了lint问题）
        this.trySetNodeProperty(key, value);

        // 创建副本通知父组件
        const updatedNode = this.cloneAndUpdateNodeProperty(key, value);
        if (updatedNode) {
          this.$emit('update', updatedNode);
        }
      } catch (error) {
        console.error('更新属性失败:', error)
      }
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

    isEnumProperty(key: string): boolean {
      // 根据属性名判断是否为枚举类型
      const enumProperties = [
        'shape', 'mode', 'type', 'alignment', 'direction', 'format', 'style',
        'position', 'target', 'size', 'variant', 'operation', 'method', 'action',
        'display', 'layout', 'color', 'state', 'status', 'level', 'theme'
      ];
      // 检查是否精确匹配
      if (enumProperties.includes(key.toLowerCase())) {
        return true;
      }
      // 检查是否包含关键词
      const keywords = ['mode', 'type', 'format', 'style', 'align', 'position', 'method'];
      for (const keyword of keywords) {
        if (key.toLowerCase().includes(keyword)) {
          return true;
        }
      }
      return false;
    },

    getPropertyOptions(key: string): string[] {
      // 根据不同属性名返回相应的选项
      const optionsMap: Record<string, string[]> = {
        'shape': ['box', 'round', 'circle', 'diamond', 'square', 'ellipse', 'rect'],
        'mode': ['default', 'always', 'never', 'auto', 'manual', 'normal', 'edit', 'view'],
        'type': ['default', 'primary', 'success', 'warning', 'danger', 'info', 'text', 'number', 'string', 'boolean', 'object'],
        'alignment': ['left', 'center', 'right', 'justify', 'start', 'end'],
        'direction': ['horizontal', 'vertical', 'both', 'up', 'down', 'left', 'right'],
        'format': ['number', 'string', 'boolean', 'object', 'array', 'date', 'time', 'datetime', 'json'],
        'style': ['solid', 'dashed', 'dotted', 'none', 'block', 'inline', 'flex', 'grid'],
        'position': ['top', 'bottom', 'left', 'right', 'center', 'absolute', 'relative', 'fixed'],
        'target': ['self', 'blank', 'parent', 'top', 'new', 'current'],
        'size': ['small', 'medium', 'large', 'mini', 'default', 'full', 'auto'],
        'color': ['primary', 'success', 'warning', 'danger', 'info', 'default', 'white', 'black'],
        'status': ['active', 'inactive', 'pending', 'success', 'error', 'warning'],
        'operation': ['add', 'subtract', 'multiply', 'divide', 'and', 'or', 'not', 'xor'],
        'method': ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
        'action': ['save', 'delete', 'update', 'create', 'cancel', 'submit', 'reset']
      };

      const lowKey = key.toLowerCase();

      // 检查是否有具体的属性键匹配
      for (const [mapKey, options] of Object.entries(optionsMap)) {
        if (lowKey === mapKey || lowKey.includes(mapKey)) {
          return options;
        }
      }

      // 默认返回一些通用选项
      return ['default', 'auto', 'custom', 'none'];
    },

    isBooleanProperty(value: PropertyValue): boolean {
      return typeof value === 'boolean' ||
        value === 'true' || value === 'false' ||
        (typeof value === 'string' && ['true', 'false', 'yes', 'no', 'on', 'off'].includes(value.toLowerCase()));
    },

    updateBooleanProperty(key: string, event: Event) {
      if (!this.node) return;

      try {
        const target = event.target as HTMLInputElement;
        const value = target.checked;

        // 尝试直接设置属性
        this.trySetNodeProperty(key, value);

        // 创建副本通知父组件
        const updatedNode = this.cloneAndUpdateNodeProperty(key, value);
        if (updatedNode) {
          this.$emit('update', updatedNode);
        }
      } catch (error) {
        console.error('更新布尔属性失败:', error);
      }
    },

    isNumberProperty(value: PropertyValue): boolean {
      return typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '');
    },

    incrementNumber(key: string) {
      if (!this.node) return;

      try {
        // 获取当前值
        let currentValue = 0;

        if (this.node.properties && key in this.node.properties) {
          currentValue = typeof this.node.properties[key] === 'number'
            ? this.node.properties[key] as number
            : Number(this.node.properties[key]) || 0;
        }

        const newValue = currentValue + 1;

        // 尝试直接设置属性
        this.trySetNodeProperty(key, newValue);

        // 创建副本通知父组件
        const updatedNode = this.cloneAndUpdateNodeProperty(key, newValue);
        if (updatedNode) {
          this.$emit('update', updatedNode);
        }
      } catch (error) {
        console.error('递增数值失败:', error);
      }
    },

    decrementNumber(key: string) {
      if (!this.node) return;

      try {
        // 获取当前值
        let currentValue = 0;

        if (this.node.properties && key in this.node.properties) {
          currentValue = typeof this.node.properties[key] === 'number'
            ? this.node.properties[key] as number
            : Number(this.node.properties[key]) || 0;
        }

        const newValue = currentValue - 1;

        // 尝试直接设置属性
        this.trySetNodeProperty(key, newValue);

        // 创建副本通知父组件
        const updatedNode = this.cloneAndUpdateNodeProperty(key, newValue);
        if (updatedNode) {
          this.$emit('update', updatedNode);
        }
      } catch (error) {
        console.error('递减数值失败:', error);
      }
    },

    isColorProperty(key: string, value: PropertyValue): boolean {
      // 检查属性名是否包含color关键词
      if (key.toLowerCase().includes('color') || key.toLowerCase() === 'background' || key.toLowerCase() === 'bgcolor') {
        return true;
      }
      // 检查值是否为颜色格式
      if (typeof value === 'string') {
        // CSS颜色格式检测: #000, #000000, rgb(), rgba(), hsl(), hsla()
        return /^#([0-9A-F]{3}){1,2}$/i.test(value) ||
          /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i.test(value) ||
          /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/i.test(value) ||
          /^hsl\(\s*\d+\s*,\s*\d+%?\s*,\s*\d+%?\s*\)$/i.test(value) ||
          /^hsla\(\s*\d+\s*,\s*\d+%?\s*,\s*\d+%?\s*,\s*[\d.]+\s*\)$/i.test(value);
      }
      return false;
    },

    formatColorValue(value: PropertyValue): string {
      // 将各种颜色格式转换为HEX格式以兼容color输入
      if (typeof value !== 'string') {
        return '#000000';
      }

      // 已经是HEX格式
      if (value.startsWith('#')) {
        // 如果是#RGB格式，转换为#RRGGBB
        if (value.length === 4) {
          const r = value[1];
          const g = value[2];
          const b = value[3];
          return `#${r}${r}${g}${g}${b}${b}`;
        }
        return value;
      }

      // 其他格式暂时返回默认黑色
      // 生产环境中这里可以使用颜色库来做更精确的转换
      return '#000000';
    },
  },
})
</script>

<style scoped>
.node-detail-sidebar {
  position: fixed;
  top: 50px;
  left: 0;
  bottom: 0;
  width: 340px;
  background: rgba(15, 15, 25, 0.95);
  border-right: 1px solid rgba(156, 70, 255, 0.15);
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  z-index: 40000;
  transform: translateX(0);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  animation: slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

@keyframes slide-in {
  from {
    transform: translateX(-340px);
  }

  to {
    transform: translateX(0);
  }
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(25, 25, 38, 0.95) 0%, rgba(16, 16, 28, 0.95) 100%);
  border-right: 1px solid rgba(156, 70, 255, 0.15);
  box-shadow: 0 0 25px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 18px;
  border-bottom: 1px solid rgba(156, 70, 255, 0.15);
  background: rgba(10, 10, 18, 0.95);
  min-height: 64px;
  position: relative;
}

.sidebar-header::after {
  content: '';
  position: absolute;
  top: 64px;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg,
      rgba(156, 70, 255, 0.1) 0%,
      rgba(156, 70, 255, 0.5) 50%,
      rgba(156, 70, 255, 0.1) 100%);
  z-index: 1;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.node-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, rgba(156, 70, 255, 0.2) 0%, rgba(156, 70, 255, 0.4) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05);
}

.icon {
  font-size: 20px;
}

.icon-small {
  font-size: 14px;
  margin-right: 4px;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 16px;
  color: #fff;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: #888;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  background: rgba(156, 70, 255, 0.1);
}

.close-btn:hover {
  color: #fff;
  background-color: rgba(156, 70, 255, 0.2);
  transform: rotate(90deg);
}

.sidebar-body {
  padding: 15px;
  overflow-y: auto;
  flex: 1;
  background: linear-gradient(135deg, rgba(20, 20, 35, 0.5) 0%, rgba(15, 15, 25, 0.5) 100%);
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 70, 255, 0.6) rgba(0, 0, 0, 0.2);
}

.sidebar-footer {
  padding: 15px;
  border-top: 1px solid rgba(156, 70, 255, 0.15);
  display: flex;
  justify-content: flex-end;
  background: linear-gradient(to top, rgba(10, 10, 18, 0.95), rgba(15, 15, 25, 0.95));
  position: relative;
}

.sidebar-footer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg,
      rgba(156, 70, 255, 0.1) 0%,
      rgba(156, 70, 255, 0.5) 50%,
      rgba(156, 70, 255, 0.1) 100%);
}

.btn {
  padding: 10px 20px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  background: rgba(30, 30, 45, 0.6);
  color: #e0e0e0;
  transition: all 0.3s;
  font-weight: 500;
  border: 1px solid rgba(156, 70, 255, 0.3);
  position: relative;
  overflow: hidden;
}

.btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 200%;
  height: 100%;
  background: linear-gradient(90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.1) 50%,
      rgba(255, 255, 255, 0) 100%);
  transform: translateX(-100%);
  transition: transform 0.8s;
}

.btn:hover::after {
  transform: translateX(100%);
}

.btn-primary {
  background: linear-gradient(90deg, rgba(156, 70, 255, 0.7) 0%, rgba(156, 70, 255, 0.6) 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(156, 70, 255, 0.3);
  border: none;
}

.btn-primary:hover {
  background: linear-gradient(90deg, rgba(156, 70, 255, 0.8) 0%, rgba(156, 70, 255, 0.7) 100%);
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(156, 70, 255, 0.4);
}

.btn-primary:active {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(156, 70, 255, 0.3);
}

.node-info {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.info-card {
  background: linear-gradient(145deg, rgba(25, 25, 40, 0.5), rgba(20, 20, 35, 0.5));
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(156, 70, 255, 0.1);
  transition: all 0.3s;
  margin-bottom: 0;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-left: 3px solid rgba(156, 70, 255, 0.5);
  position: relative;
  overflow: hidden;
}

.info-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg,
      rgba(156, 70, 255, 0) 0%,
      rgba(156, 70, 255, 0.03) 50%,
      rgba(156, 70, 255, 0) 100%);
  transform: translateX(-100%);
  transition: transform 0.8s ease;
  pointer-events: none;
}

.info-card:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(156, 70, 255, 0.2);
  transform: translateY(-2px);
}

.info-card:hover::before {
  transform: translateX(100%);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.label {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  font-size: 14px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.value {
  font-family: 'Monaco', 'Consolas', monospace;
}

.node-type {
  color: white;
  background: linear-gradient(145deg, rgba(156, 70, 255, 0.2), rgba(156, 70, 255, 0.1));
  padding: 6px 12px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(156, 70, 255, 0.2);
  border-left: 3px solid rgba(156, 70, 255, 0.7);
}

.properties-list,
.slots-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-left: 10px;
  border-left: 2px solid rgba(156, 70, 255, 0.4);
  padding-left: 15px;
  padding-top: 8px;
  padding-bottom: 8px;
}

.property-item,
.slot-item {
  display: flex;
  align-items: center;
  transition: all 0.2s;
  border-radius: 8px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.03);
}

.property-item:hover,
.slot-item:hover {
  background: rgba(255, 255, 255, 0.06);
  transform: translateX(3px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.property-name,
.slot-name {
  min-width: 90px;
  font-weight: 500;
  color: #ddd;
  margin-right: 10px;
  font-size: 12px;
}

.property-value,
.slot-type {
  flex: 1;
  color: #fff;
  font-size: 12px;
}

input.property-value {
  border: 1px solid rgba(156, 70, 255, 0.3);
  padding: 8px 12px;
  border-radius: 10px;
  background-color: rgba(30, 30, 45, 0.6);
  color: #e0e0e0;
  transition: all 0.2s;
  font-size: 12px;
  width: 100%;
  max-width: 140px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

input.property-value:hover {
  border-color: rgba(156, 70, 255, 0.5);
  background-color: rgba(35, 35, 50, 0.6);
}

input.property-value:focus {
  outline: none;
  border-color: #4a6ee0;
  background-color: rgba(40, 40, 55, 0.6);
  box-shadow: 0 0 0 3px rgba(156, 70, 255, 0.2);
}

select.property-value {
  border: 1px solid rgba(156, 70, 255, 0.3);
  padding: 8px 12px;
  border-radius: 10px;
  background-color: rgba(30, 30, 45, 0.6);
  color: #e0e0e0;
  transition: all 0.2s;
  font-size: 12px;
  min-width: 100px;
  max-width: 140px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

/* 自定义下拉列表选项样式 - 仅支持Firefox */
select.property-value option {
  background-color: #252525;
  color: #e0e0e0;
  padding: 8px;
}

select.property-value:hover {
  border-color: rgba(156, 70, 255, 0.5);
  background-color: rgba(35, 35, 50, 0.6);
}

select.property-value:focus {
  outline: none;
  border-color: #4a6ee0;
  background-color: rgba(40, 40, 55, 0.6);
  box-shadow: 0 0 0 3px rgba(156, 70, 255, 0.2);
}

.select-value {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23aaa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 12px;
  padding-right: 24px;
}

.readonly {
  opacity: 0.7;
  font-style: italic;
}

/* 滚动条样式 */
.sidebar-body::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.sidebar-body::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.sidebar-body::-webkit-scrollbar-thumb {
  background: rgba(156, 70, 255, 0.6);
  border-radius: 3px;
  border: 1px solid rgba(20, 20, 35, 0.8);
}

.sidebar-body::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 70, 255, 0.8);
}

/* 开关样式 */
.toggle-switch-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.boolean-value {
  font-size: 12px;
  min-width: 40px;
  color: #bbb;
  font-weight: 500;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 46px;
  height: 22px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(145deg, rgba(50, 50, 65, 0.6), rgba(40, 40, 55, 0.6));
  transition: .3s;
  border-radius: 10px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 0 rgba(255, 255, 255, 0.1);
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

input:checked+.slider {
  background: linear-gradient(145deg, #4a6ee0, #3a5dd9);
}

input:focus+.slider {
  box-shadow: 0 0 0 3px rgba(156, 70, 255, 0.2);
}

input:checked+.slider:before {
  transform: translateX(24px);
}

.slider.round {
  border-radius: 10px;
}

.slider.round:before {
  border-radius: 50%;
}

/* 数值输入控件样式 */
.number-input-container {
  display: flex;
  align-items: center;
  max-width: 140px;
  background: rgba(30, 30, 45, 0.6);
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(156, 70, 255, 0.3);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.number-value {
  text-align: center;
  flex: 1;
  margin: 0;
  padding: 8px 5px;
  -moz-appearance: textfield;
  border: none;
  background: transparent;
  color: #e0e0e0;
  font-size: 12px;
}

.number-value::-webkit-outer-spin-button,
.number-value::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.number-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(40, 40, 60, 0.5);
  border: none;
  color: #ddd;
  font-size: 14px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
}

.number-btn:hover {
  background: linear-gradient(145deg, #4a6ee0, #3a5dd9);
  color: white;
}

.number-btn:active {
  transform: scale(0.95);
  background: linear-gradient(145deg, #3a5dd9, #2a4dc9);
}

/* 颜色选择器样式 */
.color-picker {
  width: 70px;
  height: 30px;
  padding: 2px;
  background-color: transparent;
  border: 1px solid rgba(156, 70, 255, 0.3);
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.color-picker:hover {
  transform: scale(1.05);
  border-color: rgba(156, 70, 255, 0.5);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
}

.color-picker:focus {
  outline: none;
  border-color: #4a6ee0;
  box-shadow: 0 0 0 3px rgba(156, 70, 255, 0.2);
}

.no-slots {
  color: #666;
  font-style: italic;
  padding: 6px 0;
}

/* 插槽类型徽章 */
.slot-type {
  padding: 5px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  text-align: center;
  min-width: 70px;
  max-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s;
}

.slot-item:hover .slot-type {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.type-number {
  background-color: rgba(66, 153, 225, 0.15);
  color: #63b3ed;
  border-left: 3px solid #63b3ed;
  border-radius: 10px;
  padding: 5px;
}

.type-string {
  background-color: rgba(72, 187, 120, 0.15);
  color: #68d391;
  border-left: 3px solid #68d391;
  border-radius: 10px;
  padding: 5px;
}

.type-boolean {
  background-color: rgba(237, 137, 54, 0.15);
  color: #f6ad55;
  border-left: 3px solid #f6ad55;
  border-radius: 10px;
  padding: 5px;
}

.type-object {
  background-color: rgba(159, 122, 234, 0.15);
  color: #b794f4;
  border-left: 3px solid #b794f4;
  border-radius: 10px;
  padding: 5px;
}

.type-array {
  background-color: rgba(159, 122, 234, 0.15);
  color: #b794f4;
  border-left: 3px solid #b794f4;
  border-radius: 10px;
  padding: 5px;
}

.type-color {
  background-color: rgba(237, 100, 166, 0.15);
  color: #f687b3;
  border-left: 3px solid #f687b3;
  border-radius: 10px;
  padding: 5px;
}

.type-vector {
  background-color: rgba(246, 173, 85, 0.15);
  color: #fbd38d;
  border-left: 3px solid #fbd38d;
  border-radius: 10px;
  padding: 5px;
}

.type-event {
  background-color: rgba(113, 128, 150, 0.15);
  color: #a0aec0;
  border-left: 3px solid #a0aec0;
  border-radius: 10px;
  padding: 5px;
}

.type-unknown {
  background-color: rgba(160, 174, 192, 0.15);
  color: #a0aec0;
  border-left: 3px solid #a0aec0;
  border-radius: 10px;
  padding: 5px;
}

.type-default {
  background-color: rgba(203, 213, 224, 0.15);
  color: #cbd5e0;
  border-left: 3px solid #cbd5e0;
  border-radius: 10px;
  padding: 5px;
}

/* 颜色选择器样式 */
.color-picker {
  width: 70px;
  height: 28px;
  padding: 2px;
  background-color: transparent;
  border: 1px solid #444;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.color-picker:hover {
  transform: scale(1.05);
  border-color: #555;
}

.color-picker:focus {
  outline: none;
  border-color: #4a6ee0;
  box-shadow: 0 0 0 3px rgba(156, 70, 255, 0.2);
}
</style>
