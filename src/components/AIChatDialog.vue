<template>
  <div class="ai-chat-container">
    <!-- 聊天按钮 -->
    <button class="chat-toggle-button" @click="toggleChat">
      <svg v-if="!visible" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
      <span>{{ visible ? '关闭' : 'AI 助手' }}</span>
    </button>

    <!-- 聊天对话框 -->
    <div class="chat-dialog" v-show="visible" ref="chatDialog" :class="{
      'fullscreen': isFullscreen,
      'dragging': isDragging,
      'resizing': isResizing
    }" :style="!isFullscreen ? {
      width: dialogWidth + 'px',
      height: dialogHeight + 'px',
      left: dialogPosition.x + 'px',
      top: dialogPosition.y + 'px'
    } : {}">
      <!-- 拖拽区域 -->
      <div class="chat-header" @mousedown="startDrag">
        <div class="chat-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 18h.01"></path>
            <path d="M12 12L21 3"></path>
            <path d="M15.5 7.5L18 10"></path>
            <path d="M8.5 3.5L10 2l1.5 1.5"></path>
            <path d="M2 10l1.5 1.5"></path>
            <path d="M7 21l1-1"></path>
            <path d="M3 21h18"></path>
          </svg>
          LiteGraph 节点助手
        </div>
        <div class="dialog-controls">
          <!-- 最小化按钮 -->
          <button class="control-button" @click="toggleMinimize">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <!-- 全屏按钮 -->
          <button class="control-button" @click="toggleFullscreen">
            <svg v-if="!isFullscreen" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3"></path>
              <path d="M21 8V5a2 2 0 0 0-2-2h-3"></path>
              <path d="M3 16v3a2 2 0 0 0 2 2h3"></path>
              <path d="M16 21h3a2 2 0 0 0 2-2v-3"></path>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 3v3a2 2 0 0 1-2 2H3"></path>
              <path d="M21 8h-3a2 2 0 0 1-2-2V3"></path>
              <path d="M3 16h3a2 2 0 0 1 2 2v3"></path>
              <path d="M16 21v-3a2 2 0 0 1 2-2h3"></path>
            </svg>
          </button>
          <!-- 关闭按钮 -->
          <button class="close-button" @click="toggleChat">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <div class="chat-messages" ref="messagesContainer">
        <div v-for="(message, index) in messages" :key="index" :class="['message', message.role]">
          <div class="avatar">
            <svg v-if="message.role === 'user'" xmlns="http://www.w3.org/2000/svg" width="20" height="20"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z"></path>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
              <line x1="9" y1="9" x2="9.01" y2="9"></line>
              <line x1="15" y1="9" x2="15.01" y2="9"></line>
            </svg>
          </div>
          <div class="message-content">
            <div class="message-text" v-html="formatMessage(message.content, index)"></div>
          </div>
        </div>
        <div v-if="isTyping" class="message assistant typing">
          <div class="avatar">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z"></path>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
              <line x1="9" y1="9" x2="9.01" y2="9"></line>
              <line x1="15" y1="9" x2="15.01" y2="9"></line>
            </svg>
          </div>
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>

      <div class="chat-input-container">
        <input type="text" v-model="inputMessage" ref="inputField" @keyup.enter="sendMessage" placeholder="输入您的问题..."
          class="chat-input" :disabled="isProcessing" />

        <button v-if="isProcessing" @click="stopResponse" class="stop-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="6" y="6" width="12" height="12"></rect>
          </svg>
        </button>

        <button v-else @click="sendMessage" class="send-button" :disabled="!inputMessage.trim()">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>

      <!-- 缩放手柄 -->
      <div v-if="!isFullscreen" class="resize-handle resize-handle-se" @mousedown="startResize"></div>
    </div>

    <!-- 通知 -->
    <div class="notification" :class="{ active: showNotification }">
      {{ notificationMessage }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { createNodeFile, getNodeCategories } from '../services/nodeGeneratorService'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'

// OpenAI请求接口
interface OpenAIRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  stream: boolean; // 添加流式响应选项
}

// 初始化欢迎消息
const WELCOME_MESSAGE = `欢迎使用 LiteGraph 节点助手！

我可以帮你生成自定义节点代码，只需描述你需要的功能。例如：
• "创建一个图像模糊处理节点"
• "设计一个数学函数节点，可以计算正弦和余弦"
• "做一个可以随机生成颜色的节点"

生成的代码可以一键应用到编辑器中。`;

// 系统提示，指导AI生成合适的节点代码
const SYSTEM_PROMPT = `你是LiteGraph节点编辑器的AI助手，专门帮助用户创建自定义节点。

响应要求：
1. 使用清晰的Markdown格式回答
2. 节点代码必须用\`\`\`javascript 包裹
3. 简洁解释节点功能和用法

节点代码规范：
1. 类名须以Node结尾，如ColorGeneratorNode
2. 继承自LGraphNode
3. 在constructor中设置inputs/outputs
4. 实现onExecute方法处理节点逻辑
5. 正确注册节点：LiteGraph.registerNodeType('类别/名称', 类名)
6. 可以设置节点颜色、形状等美观属性

代码示例:
\`\`\`javascript
class RandomColorNode extends LGraphNode {
  constructor() {
    super("Random Color");
    this.addOutput("color", "color");
    this.properties = { alpha: 1 };
    this.color = "#347";
  }

  onExecute() {
    const color = [Math.random(), Math.random(), Math.random(), this.properties.alpha];
    this.setOutputData(0, color);
  }
}
LiteGraph.registerNodeType("color/random", RandomColorNode);
\`\`\`
`;

// 为Window对象添加类型定义
declare global {
  interface Window {
    applySingleNodeCode: (messageIndex: number, blockIndex: number) => Promise<void>;
  }
}

export default defineComponent({
  name: 'AIChatDialog',

  setup() {
    const visible = ref(false)
    const inputMessage = ref('')
    const messages = ref<{ role: string; content: string }[]>([
      { role: 'assistant', content: WELCOME_MESSAGE }
    ])
    const isTyping = ref(false)
    const inputField = ref<HTMLInputElement | null>(null)
    const messagesContainer = ref<HTMLElement | null>(null)
    const showNotification = ref(false)
    const notificationMessage = ref('')
    const chatDialog = ref<HTMLElement | null>(null)
    const isMinimized = ref(false)
    const isFullscreen = ref(false)
    const isDragging = ref(false)
    const isResizing = ref(false)
    const streamController = ref<AbortController | null>(null)
    const isProcessing = ref(false)

    // 对话框尺寸和位置状态
    const dialogWidth = ref(350)
    const dialogHeight = ref(500)
    const dialogPosition = ref({ x: 0, y: 0 })

    // 拖拽和缩放状态
    const dragOffset = ref({ x: 0, y: 0 })
    const resizeStart = ref({ width: 0, height: 0, x: 0, y: 0 })

    // 在组件setup中添加已应用节点的状态追踪
    const appliedNodeMessages = ref(new Set<number>());

    // 提取代码块
    const extractCodeBlock = (text: string): string | null => {
      const regex = /```(?:javascript|js|typescript|ts)?\s*([\s\S]*?)```/g;
      const match = regex.exec(text);
      return match ? match[1].trim() : null;
    };

    // 在某些情况下使用detectClassName，或者注释掉未使用的函数
    const detectClassName = (code: string): string | null => {
      // 如果我们需要单独获取一个类名，使用这个
      const classNames = detectAllClassNames(code);
      return classNames.length > 0 ? classNames[0] : null;
    };

    // 检测或猜测节点类别
    const detectCategory = (code: string, className: string): string => {
      // 先尝试从代码中找出类别定义
      const categoryMatch = /this\s*\.\s*category\s*=\s*['"]([^'"]+)['"]/.exec(code);
      if (categoryMatch) {
        return categoryMatch[1].toLowerCase();
      }

      // 从类名中猜测类别
      const categories = getNodeCategories();
      const lowerClassName = className.toLowerCase();

      for (const category of categories) {
        if (lowerClassName.includes(category)) {
          return category;
        }
      }

      // 默认类别
      return 'custom';
    };

    // 修改检测原始路径的函数，支持检测多个节点注册
    const detectOriginalPaths = (code: string): Map<string, string> => {
      // 用Map存储 类名->路径 的映射
      const pathMap = new Map<string, string>();

      // 匹配所有 LiteGraph.registerNodeType('path/name', ClassName) 格式的注册
      const registerRegex = /LiteGraph\.registerNodeType\s*\(\s*['"]([^'"]+)['"]\s*,\s*([a-zA-Z0-9_]+)\s*\)/g;
      let match;

      while ((match = registerRegex.exec(code)) !== null) {
        const path = match[1];    // 路径
        const className = match[2]; // 类名
        pathMap.set(className, path);
      }

      return pathMap;
    };

    // 添加识别所有类定义的函数
    const detectAllClassNames = (code: string): string[] => {
      const classNames: string[] = [];
      const classRegex = /class\s+([a-zA-Z0-9_]+)(?:\s+extends\s+(?:[a-zA-Z0-9_\.]+))?\s*\{/g;
      let match;

      while ((match = classRegex.exec(code)) !== null) {
        classNames.push(match[1]);
      }

      return classNames;
    };

    // 修改formatMessage方法，添加节点应用中状态
    const formatMessage = (text: string, messageIndex: number) => {
      try {
        // 准备一个空数组来收集处理后的内容片段
        const contentParts: string[] = [];

        // 将消息拆分为代码块和普通文本
        const parts = text.split(/(```(?:javascript|js|typescript|ts)?[\s\S]*?```)/g);

        // 处理每一段内容
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];

          // 检查是否是代码块
          if (part.startsWith('```') && part.endsWith('```')) {
            // 提取代码块内容和语言
            const codeBlockRegex = /```(\w*)([\s\S]*?)```/;
            const match = codeBlockRegex.exec(part);

            if (match) {
              const language = match[1].trim();
              const code = match[2].trim();

              // 代码高亮处理
              let highlightedCode;
              try {
                if (language && hljs.getLanguage(language)) {
                  highlightedCode = hljs.highlight(code, { language }).value;
                } else {
                  highlightedCode = hljs.highlightAuto(code).value;
                }
              } catch {
                // 使用空的catch块，不需要变量
                highlightedCode = code; // 高亮失败时使用原始代码
              }

              // 构建代码块HTML，添加重新应用功能
              const blockIndex = Math.floor(i / 2); // 计算实际的代码块索引
              const isApplied = appliedNodeBlocks.value.has(`${messageIndex}-${blockIndex}`);
              const isApplying = applyingBlocks.value.has(`${messageIndex}-${blockIndex}`);

              const buttonStateClass = isApplied ? 'applied' : (isApplying ? 'applying' : '');
              const isDisabled = isApplying; // 只在应用中时禁用按钮，已应用状态可以再次点击

              const codeBlockHtml = `
                <div class="code-block-container" data-block-index="${blockIndex}">
                  <div class="code-block-header">
                    <span class="code-language">${language || 'javascript'}</span>
                  </div>
                  <pre class="code-block"><code class="hljs">${highlightedCode}</code></pre>
                  <div class="code-block-actions">
                    <button onclick="window.applySingleNodeCode(${messageIndex}, ${blockIndex})"
                      class="apply-node-button ${buttonStateClass}"
                      ${isDisabled ? 'disabled' : ''}>
                      <span class="apply-icon">
                        ${isApplied ?
                  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M20 6L9 17l-5-5"/>
                            </svg>`
                  : (isApplying ?
                    `<svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M16 12a4 4 0 1 1-8 0"></path>
                              </svg>`
                    :
                    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                <polyline points="22 4 12 14.01 9 11.01"/>
                              </svg>`
                  )
                }
                      </span>
                      <span class="apply-text">${isApplied ? '重新应用' : (isApplying ? '应用中...' : '应用节点')}</span>
                    </button>
                  </div>
                </div>
              `;

              // 添加处理后的代码块到结果中
              contentParts.push(codeBlockHtml);
            } else {
              // 如果匹配失败，保留原始内容
              contentParts.push(part);
            }
          } else {
            // 非代码块内容，作为markdown解析
            // 修复Promise<string>类型错误，强制转换为string
            contentParts.push(marked.parse(part) as string);
          }
        }

        // 将所有处理后的内容合并
        return contentParts.join('');
      } catch (error) {
        console.error('格式化消息错误:', error);
        return text.replace(/\n/g, '<br>');
      }
    };

    // 发送消息函数修改
    const sendMessage = () => {
      const userMessage = inputMessage.value.trim();
      if (!userMessage || isProcessing.value) return;

      // 设置处理状态，禁止同时发送多条消息
      isProcessing.value = true;

      // 调用流式API请求
      streamOpenAIResponse(userMessage);
    };

    // 修改流式响应处理，在结束时重置处理状态
    const streamOpenAIResponse = async (userMessage: string) => {
      try {
        // 添加用户消息到聊天记录
        messages.value.push({
          role: 'user',
          content: userMessage
        });

        // 清空输入框
        inputMessage.value = '';

        // 滚动到底部
        nextTick(scrollToBottom);

        // 激活打字状态
        isTyping.value = true;

        // 准备接收流式响应
        const lastMessageIndex = messages.value.length;
        messages.value.push({
          role: 'assistant',
          content: ''
        });

        // 创建所有历史消息
        const messageHistory = [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.value.slice(0, -1) // 不包括我们刚刚添加的空消息
        ];

        // 准备请求体
        const requestData: OpenAIRequest = {
          model: 'deepseek-ai/DeepSeek-V2.5',
          messages: messageHistory,
          stream: true
        };

        // 中止之前的请求
        if (streamController.value) {
          streamController.value.abort();
        }

        // 创建新的控制器
        streamController.value = new AbortController();
        const signal = streamController.value.signal;

        // 发送请求
        const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
          },
          body: JSON.stringify(requestData),
          signal
        });

        if (!response.ok) {
          throw new Error(`API请求失败: ${response.statusText}`);
        }

        // 隐藏打字状态
        isTyping.value = false;

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('无法获取响应流');
        }

        const decoder = new TextDecoder('utf-8');
        let done = false;

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;

          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.substring(6));

                // 修复解析逻辑，处理不同API响应格式
                if (data.choices && data.choices[0]) {
                  const choice = data.choices[0];
                  if (choice.delta && choice.delta.content) {
                    // OpenAI格式
                    messages.value[lastMessageIndex].content += choice.delta.content;
                    nextTick(scrollToBottom);
                  } else if (choice.text) {
                    // 一些API返回text而不是delta.content
                    messages.value[lastMessageIndex].content += choice.text;
                    nextTick(scrollToBottom);
                  } else if (choice.message && choice.message.content) {
                    // 其他API可能在message对象中包含content
                    messages.value[lastMessageIndex].content += choice.message.content;
                    nextTick(scrollToBottom);
                  } else if (choice.content) {
                    // 直接包含content
                    messages.value[lastMessageIndex].content += choice.content;
                    nextTick(scrollToBottom);
                  }
                }
              } catch (e) {
                console.error('解析流数据失败:', e);
                // 尝试记录原始数据以便调试
                console.log('原始数据:', line.substring(6));
              }
            }
          }
        }

        // 完成后滚动到底部并重置处理状态
        nextTick(scrollToBottom);
        isProcessing.value = false;

      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('流请求被中止');
        } else {
          console.error('流式请求失败:', error);
          messages.value.push({
            role: 'assistant',
            content: '抱歉，API请求失败，请稍后再试。'
          });
        }
        isTyping.value = false;
        isProcessing.value = false; // 确保错误情况下也重置状态
        nextTick(scrollToBottom);
      }
    };

    // 滚动到消息底部
    const scrollToBottom = () => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    }

    // 切换聊天窗口可见性
    const toggleChat = () => {
      visible.value = !visible.value

      if (visible.value) {
        nextTick(() => {
          if (inputField.value) {
            inputField.value.focus()
          }
          scrollToBottom()
        })
      }
    }

    // 最小化对话框
    const toggleMinimize = () => {
      if (isFullscreen.value) return; // 全屏模式下不允许最小化

      isMinimized.value = !isMinimized.value
      if (isMinimized.value) {
        // 保存当前高度并最小化
        dialogHeight.value = 50
      } else {
        // 恢复之前的高度
        dialogHeight.value = 500
        nextTick(scrollToBottom)
      }
    }

    // 切换全屏模式
    const toggleFullscreen = () => {
      isFullscreen.value = !isFullscreen.value

      if (isFullscreen.value) {
        // 进入全屏模式，记住当前大小位置
        isMinimized.value = false; // 退出最小化状态
      } else {
        // 退出全屏模式，恢复原始大小位置
        nextTick(scrollToBottom)
      }
    }

    // 开始拖拽
    const startDrag = (event: MouseEvent) => {
      // 全屏模式下不允许拖拽
      if (isFullscreen.value) return;

      // 如果点击的是按钮，不启动拖拽
      if ((event.target as HTMLElement).closest('button')) {
        return
      }

      isDragging.value = true

      // 记录鼠标相对于对话框左上角的偏移
      if (chatDialog.value) {
        const rect = chatDialog.value.getBoundingClientRect()
        dragOffset.value = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        }
      }

      // 阻止默认行为和冒泡
      event.preventDefault()
      event.stopPropagation()
    }

    // 拖拽过程
    const doDrag = (event: MouseEvent) => {
      if (!isDragging.value) return

      // 计算新位置
      dialogPosition.value = {
        x: event.clientX - dragOffset.value.x,
        y: event.clientY - dragOffset.value.y
      }

      // 阻止默认行为和冒泡
      event.preventDefault()
      event.stopPropagation()
    }

    // 结束拖拽
    const endDrag = () => {
      isDragging.value = false
    }

    // 开始缩放
    const startResize = (event: MouseEvent) => {
      // 全屏模式下不允许缩放
      if (isFullscreen.value) return;

      isResizing.value = true

      // 记录初始值
      resizeStart.value = {
        width: dialogWidth.value,
        height: dialogHeight.value,
        x: event.clientX,
        y: event.clientY
      }

      // 阻止默认行为和冒泡
      event.preventDefault()
      event.stopPropagation()
    }

    // 缩放过程
    const doResize = (event: MouseEvent) => {
      if (!isResizing.value) return

      // 使用 requestAnimationFrame 优化性能
      requestAnimationFrame(() => {
        // 计算新尺寸
        const newWidth = resizeStart.value.width + (event.clientX - resizeStart.value.x)
        const newHeight = resizeStart.value.height + (event.clientY - resizeStart.value.y)

        // 设置最小尺寸限制
        dialogWidth.value = Math.max(300, newWidth)
        dialogHeight.value = Math.max(200, newHeight)
      })

      // 阻止默认行为和冒泡
      event.preventDefault()
      event.stopPropagation()
    }

    // 结束缩放
    const endResize = () => {
      isResizing.value = false
    }

    // 添加用于跟踪已应用代码块的状态
    const appliedNodeBlocks = ref(new Set<string>());

    // 添加正在应用节点的状态追踪
    const applyingBlocks = ref(new Set<string>());

    onMounted(() => {
      // 添加全局鼠标事件监听
      window.addEventListener('mousemove', doDrag)
      window.addEventListener('mousemove', doResize)
      window.addEventListener('mouseup', endDrag)
      window.addEventListener('mouseup', endResize)

      // 计算初始位置（右下角）
      const screenWidth = window.innerWidth
      const screenHeight = window.innerHeight
      dialogPosition.value = {
        x: screenWidth - dialogWidth.value - 20,
        y: screenHeight - dialogHeight.value - 80
      }

      // 只保留应用节点方法
      window.applySingleNodeCode = async (messageIndex: number, blockIndex: number) => {
        console.log(`应用节点，消息索引: ${messageIndex}, 代码块索引: ${blockIndex}`);
        const message = messages.value[messageIndex]?.content || '';
        const codeBlocks = extractAllCodeBlocks(message);
        console.log(`找到 ${codeBlocks.length} 个代码块`);

        if (blockIndex < codeBlocks.length) {
          const blockId = `${messageIndex}-${blockIndex}`;
          // 设置应用中状态
          applyingBlocks.value.add(blockId);

          try {
            const singleCode = codeBlocks[blockIndex];
            const success = await applyNodeCode(singleCode, messageIndex, blockIndex);

            if (success) {
              // 标记此代码块已应用
              appliedNodeBlocks.value.add(blockId);
            }
          } finally {
            // 无论成功失败，都移除应用中状态
            applyingBlocks.value.delete(blockId);
          }
        } else {
          console.error('代码块索引超出范围:', blockIndex, codeBlocks.length);
          notificationMessage.value = '无法找到对应的代码块';
          showNotification.value = true;
          setTimeout(() => { showNotification.value = false; }, 3000);
        }
      };
    })

    onBeforeUnmount(() => {
      // 在组件销毁前移除事件监听
      window.removeEventListener('mousemove', doDrag)
      window.removeEventListener('mousemove', doResize)
      window.removeEventListener('mouseup', endDrag)
      window.removeEventListener('mouseup', endResize)

      // 移除应用节点方法
      window.applySingleNodeCode = undefined as unknown as (messageIndex: number, blockIndex: number) => Promise<void>;
    })

    // 提取消息中的所有代码块
    const extractAllCodeBlocks = (text: string): string[] => {
      const codeBlocks: string[] = [];
      const regex = /```(?:javascript|js|typescript|ts)?\s*([\s\S]*?)```/g;
      let match;

      while ((match = regex.exec(text)) !== null) {
        codeBlocks.push(match[1].trim());
      }

      return codeBlocks;
    };

    // 修改应用节点代码函数，添加错误处理和修复建议功能
    const applyNodeCode = async (message: string, messageIndex: number, blockIndex?: number): Promise<boolean> => {
      try {
        // 如果传入了完整代码，直接使用
        let code: string | null;

        if (blockIndex !== undefined) {
          // 处理单个代码块的情况
          code = message; // 这里message已经是提取好的代码
        } else {
          // 处理整个消息的情况
          code = extractCodeBlock(message);
        }

        if (!code) {
          showNotification.value = true;
          notificationMessage.value = '无法提取节点代码。';
          setTimeout(() => { showNotification.value = false; }, 3000);
          return false;
        }

        // 检测所有类名
        const classNames = detectAllClassNames(code);
        if (!classNames || classNames.length === 0) {
          showNotification.value = true;
          notificationMessage.value = '无法识别节点类名。';
          setTimeout(() => { showNotification.value = false; }, 3000);

          // 添加到对话中让AI修复错误
          addFixRequestMessage(code, '无法识别节点类名，请提供有效的节点类定义。');
          return false;
        }

        // 检测所有注册路径
        const pathMap = detectOriginalPaths(code);

        // 注册所有节点
        let successCount = 0;
        const registeredNodes: { className: string, path: string }[] = [];

        try {
          // 尝试评估代码以发现语法错误
          // 注意：这只是一个简单的语法检查，不能捕获所有错误
          new Function(code);

          for (const className of classNames) {
            let nodePath: string;

            // 如果在注册语句中找到了这个类的路径，就使用它
            if (pathMap.has(className)) {
              nodePath = pathMap.get(className)!;
            } else {
              // 否则生成一个默认路径
              const category = detectCategory(code, className);
              nodePath = `custom/${category}/${className.toLowerCase()}`;
            }

            // 注册节点
            const success = await createNodeFile(className, nodePath, code);

            if (success) {
              successCount++;
              registeredNodes.push({ className, path: nodePath });
            }
          }
        } catch (syntaxError) {
          // 捕获JavaScript语法错误
          console.error('节点代码存在语法错误:', syntaxError);
          showNotification.value = true;
          notificationMessage.value = `代码存在语法错误: ${(syntaxError as Error).message}`;
          setTimeout(() => { showNotification.value = false; }, 5000);

          // 添加到对话中让AI修复错误
          addFixRequestMessage(code, `语法错误: ${(syntaxError as Error).message}`);
          return false;
        }

        if (successCount > 0) {
          // 显示成功通知，包含详细的路径信息
          showNotification.value = true;

          // 针对单个或多个节点创建不同的通知消息
          if (successCount === 1) {
            const node = registeredNodes[0];
            notificationMessage.value = `节点 ${node.className} 已成功注册为 ${node.path}！使用"${node.path}"搜索可找到此节点`;
          } else {
            notificationMessage.value = `成功注册了 ${successCount} 个节点！详见聊天窗口`;
          }

          // 延长显示时间，确保用户能看到路径信息
          setTimeout(() => { showNotification.value = false; }, 5000);

          // 单个代码块不需要添加系统消息
          if (blockIndex === undefined) {
            // 生成详细的注册结果消息
            let resultMessage = `✅ 以下节点已成功注册：\n`;
            registeredNodes.forEach(node => {
              resultMessage += `- **${node.className}** 注册为 \`${node.path}\`\n`;
            });
            resultMessage += `\n> 💡 提示：在节点菜单中搜索路径或类名可以找到这些节点`;

            // 添加系统消息
            messages.value.push({
              role: 'assistant',
              content: resultMessage
            });

            // 标记该消息已应用节点
            appliedNodeMessages.value.add(messageIndex);

            nextTick(scrollToBottom);
          } else {
            // 对于单个代码块，也添加一个简洁的成功消息
            // 创建特殊的成功消息元素
            const successElement = document.createElement('div');
            successElement.className = 'node-apply-success';
            successElement.innerHTML = `
              <div class="success-message">
                <span class="success-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </span>
                <div class="success-details">
                  <div class="success-title">节点已注册成功</div>
                  <div class="success-paths">
                    ${registeredNodes.map(node =>
              `<div class="path-item">${node.className} → <code>${node.path}</code></div>`
            ).join('')}
                  </div>
                </div>
              </div>
            `;

            // 找到代码块容器并添加成功消息
            setTimeout(() => {
              const codeBlockContainer = document.querySelector(
                `.message[data-index="${messageIndex}"] .code-block-container[data-block-index="${blockIndex}"]`
              );

              if (codeBlockContainer) {
                // 移除之前的成功消息（如果有）
                const existingSuccess = codeBlockContainer.querySelector('.node-apply-success');
                if (existingSuccess) existingSuccess.remove();

                // 添加新的成功消息
                codeBlockContainer.appendChild(successElement);
              }
            }, 100);
          }

          return true; // 返回应用成功
        } else {
          showNotification.value = true;
          notificationMessage.value = '节点应用失败，可能存在语法或兼容性错误。';

          // 添加到对话中让AI修复错误
          addFixRequestMessage(code, '节点应用失败，可能存在不明显的语法或兼容性问题。');
          return false;
        }
      } catch (error) {
        console.error('应用节点代码失败:', error);
        showNotification.value = true;
        notificationMessage.value = `应用节点时发生错误: ${(error as Error).message}`;
        setTimeout(() => { showNotification.value = false; }, 5000);

        // 添加到对话中让AI修复错误
        addFixRequestMessage(message, `应用节点失败，错误信息: ${(error as Error).message}`);
        return false;
      }
    };

    // 添加请求AI修复代码的函数
    const addFixRequestMessage = (code: string, errorMessage: string) => {
      // 添加用户消息，请求修复
      const fixRequestMessage = `修复这段代码，错误信息: ${errorMessage}\n\`\`\`javascript\n${code}\n\`\`\``;

      messages.value.push({
        role: 'user',
        content: fixRequestMessage
      });

      // 触发AI响应，但是不通过正常的sendMessage函数，直接调用streamOpenAIResponse
      // 这样避免再次添加用户消息，防止消息显示两次
      isProcessing.value = true;

      // 直接调用API请求，跳过sendMessage中的消息添加部分
      streamOpenAIResponseDirectly();

      nextTick(scrollToBottom);
    };

    // 添加直接调用API的函数，避免重复添加消息
    const streamOpenAIResponseDirectly = async () => {
      try {
        // 激活打字状态
        isTyping.value = true;

        // 准备接收流式响应
        const lastMessageIndex = messages.value.length;
        messages.value.push({
          role: 'assistant',
          content: ''
        });

        // 创建所有历史消息
        const messageHistory = [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.value.slice(0, -1) // 不包括我们刚刚添加的空消息
        ];

        // 准备请求体
        const requestData: OpenAIRequest = {
          model: 'deepseek-ai/DeepSeek-V2.5',
          messages: messageHistory,
          stream: true
        };

        // 中止之前的请求
        if (streamController.value) {
          streamController.value.abort();
        }

        // 创建新的控制器
        streamController.value = new AbortController();
        const signal = streamController.value.signal;

        // 发送请求
        const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
          },
          body: JSON.stringify(requestData),
          signal
        });

        if (!response.ok) {
          throw new Error(`API请求失败: ${response.statusText}`);
        }

        // 隐藏打字状态
        isTyping.value = false;

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('无法获取响应流');
        }

        const decoder = new TextDecoder('utf-8');
        let done = false;

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;

          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.substring(6));

                // 修复解析逻辑，处理不同API响应格式
                if (data.choices && data.choices[0]) {
                  const choice = data.choices[0];
                  if (choice.delta && choice.delta.content) {
                    // OpenAI格式
                    messages.value[lastMessageIndex].content += choice.delta.content;
                    nextTick(scrollToBottom);
                  } else if (choice.text) {
                    // 一些API返回text而不是delta.content
                    messages.value[lastMessageIndex].content += choice.text;
                    nextTick(scrollToBottom);
                  } else if (choice.message && choice.message.content) {
                    // 其他API可能在message对象中包含content
                    messages.value[lastMessageIndex].content += choice.message.content;
                    nextTick(scrollToBottom);
                  } else if (choice.content) {
                    // 直接包含content
                    messages.value[lastMessageIndex].content += choice.content;
                    nextTick(scrollToBottom);
                  }
                }
              } catch (e) {
                console.error('解析流数据失败:', e);
                // 尝试记录原始数据以便调试
                console.log('原始数据:', line.substring(6));
              }
            }
          }
        }

        // 完成后滚动到底部并重置处理状态
        nextTick(scrollToBottom);
        isProcessing.value = false;

      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('流请求被中止');
        } else {
          console.error('流式请求失败:', error);
          messages.value.push({
            role: 'assistant',
            content: '抱歉，API请求失败，请稍后再试。'
          });
        }
        isTyping.value = false;
        isProcessing.value = false; // 确保错误情况下也重置状态
        nextTick(scrollToBottom);
      }
    };

    // 添加copy函数，修复stopResponse函数遗漏
    // 复制代码到剪贴板
    const copyCode = (message: string) => {
      const codeRegex = /```(?:.*\n)?([\s\S]*?)```/g
      const matches = [...message.matchAll(codeRegex)]

      if (matches.length > 0) {
        const codeToClip = matches.map(match => match[1]).join('\n\n')
        navigator.clipboard.writeText(codeToClip)

        // 显示通知
        notificationMessage.value = '代码已复制到剪贴板！'
        showNotification.value = true

        setTimeout(() => {
          showNotification.value = false
        }, 3000)
      }
    }

    // 停止AI响应
    const stopResponse = () => {
      if (streamController.value) {
        streamController.value.abort();
        isTyping.value = false;
        isProcessing.value = false;
        // 添加一个提示消息
        if (messages.value[messages.value.length - 1]?.content === '') {
          messages.value.pop(); // 移除空消息
          messages.value.push({
            role: 'assistant',
            content: '(响应已被用户停止)'
          });
          nextTick(scrollToBottom);
        }
      }
    };

    return {
      visible,
      toggleChat,
      inputMessage,
      messages,
      sendMessage,
      isTyping,
      formatMessage,
      copyCode,
      applyNodeCode,
      detectClassName,
      inputField,
      messagesContainer,
      showNotification,
      notificationMessage,
      chatDialog,
      dialogWidth,
      dialogHeight,
      dialogPosition,
      startDrag,
      startResize,
      isMinimized,
      toggleMinimize,
      isFullscreen,
      toggleFullscreen,
      isDragging,
      isResizing,
      appliedNodeMessages,
      appliedNodeBlocks,
      isProcessing,
      stopResponse,
      applyingBlocks
    }
  }
})
</script>

<style scoped>
.ai-chat-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.chat-toggle-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #4a6baf;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 12px 18px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  font-weight: 600;
  font-size: 14px;
}

.chat-toggle-button:hover {
  background-color: #5577bd;
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
}

.chat-dialog {
  position: fixed;
  background-color: #0f0f18;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease-out;
  overflow: hidden;
  border: 1px solid #2d2d4d;
  /* 只对高度变化添加过渡效果（最小化时），其他属性不加过渡 */
  transition: height 0.3s ease;
  min-width: 300px;
  min-height: 200px;
  /* 移除原生resize功能，我们使用自定义缩放 */
  resize: none;
  /* 添加硬件加速 */
  transform: translateZ(0);
  will-change: width, height, left, top;
}

/* 当正在拖拽或者缩放时，移除所有过渡效果 */
.chat-dialog.dragging,
.chat-dialog.resizing {
  transition: none !important;
}

/* 全屏样式 */
.chat-dialog.fullscreen {
  position: fixed;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  border-radius: 0;
  z-index: 9999;
  /* 全屏切换保留过渡效果 */
  transition: all 0.3s ease;
}

.chat-dialog.fullscreen .chat-header {
  border-radius: 0;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #4a6baf;
  color: white;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  cursor: move;
  user-select: none;
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 16px;
}

.dialog-controls {
  display: flex;
  gap: 8px;
}

.control-button,
.close-button {
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.control-button:hover,
.close-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  background-color: #0f0f18;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #1a1a28;
}

.chat-messages::-webkit-scrollbar-thumb {
  background-color: #3e3e5e;
  border-radius: 3px;
}

.message {
  display: flex;
  gap: 10px;
  max-width: 85%;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.message.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #3e3e5e;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.message.user .avatar {
  background-color: #4a6baf;
  color: white;
}

.message.assistant .avatar {
  background-color: #2d7494;
  color: white;
}

.message-content {
  background-color: #2a2a42;
  padding: 0px 12px;
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  position: relative;
  color: #e0e0e0;
}

.message.user .message-content {
  background-color: #2e4a8a;
  color: white;
  border-top-right-radius: 0;
}

.message.assistant .message-content {
  background-color: #2a2a42;
  border-top-left-radius: 0;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 10px 15px;
  background-color: #2a2a42;
  border-radius: 12px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background-color: #6d6d8d;
  border-radius: 50%;
  display: inline-block;
  animation: typing 1.5s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: 0s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-5px);
  }
}

.chat-input-container {
  padding: 15px;
  background-color: #0f0f18;
  border-top: 1px solid #2a2a42;
  display: flex;
  gap: 10px;
}

.chat-input {
  flex: 1;
  padding: 12px 18px;
  border-radius: 10px;
  border: 1px solid #3e3e5e;
  outline: none;
  transition: border-color 0.2s ease;
  font-size: 14px;
  background-color: #1a1a30;
  color: #e0e0e0;
}

.chat-input:focus {
  border-color: #4a6baf;
  box-shadow: 0 0 0 2px rgba(74, 107, 175, 0.2);
}

.chat-input:disabled {
  background-color: #282840;
  cursor: not-allowed;
}

.chat-input::placeholder {
  color: #6d6d8d;
}

.send-button {
  background-color: #4a6baf;
  color: white;
  border: none;
  border-radius: 10px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.send-button:hover {
  background-color: #5577bd;
}

.send-button:disabled {
  background-color: #3e3e5e;
  cursor: not-allowed;
}

.stop-button {
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 10px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.stop-button:hover {
  background-color: #c0392b;
}

.message-actions {
  margin-top: 12px;
  margin-bottom: 12px;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 5px;
  background-color: #3a3a58;
  color: #d0d0e0;
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button:hover {
  background-color: #4e4e6e;
  transform: translateY(-1px);
}

.action-button.disabled,
.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #4e4e5e;
  transform: none;
}

.apply-button {
  background-color: #27ae60;
  color: white;
}

.apply-button:hover {
  background-color: #2ecc71;
}

.apply-button.disabled,
.apply-button:disabled {
  background-color: #1d6350;
}

.preview-button {
  background-color: #8e44ad;
  color: white;
}

.preview-button:hover {
  background-color: #9b59b6;
}

.notification {
  position: fixed;
  bottom: -50px;
  right: 20px;
  background-color: #4a6baf;
  color: white;
  padding: 12px 20px;
  border-radius: 10px;
  transition: bottom 0.3s ease;
  font-size: 14px;
  opacity: 0;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.notification.active {
  bottom: 80px;
  opacity: 1;
}

/* 缩放控制 */
.resize-handle {
  position: absolute;
  width: 15px;
  height: 15px;
  background: transparent;
  cursor: nwse-resize;
}

.resize-handle-se {
  right: 0;
  bottom: 0;
}

.resize-handle::after {
  content: '';
  position: absolute;
  right: 3px;
  bottom: 3px;
  width: 8px;
  height: 8px;
  border-right: 2px solid #4a6baf;
  border-bottom: 2px solid #4a6baf;
  opacity: 0.6;
}

.resize-handle:hover::after {
  opacity: 1;
}

/* 代码块样式优化 */
:deep(.message-text pre) {
  background-color: #0a0a14;
  border: 1px solid #3a3a58;
  border-radius: 8px;
  padding: 15px;
  margin: 12px 0;
}

:deep(.message-text code) {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

:deep(.message-text h1),
:deep(.message-text h2),
:deep(.message-text h3) {
  color: #d0d0e0;
  margin-top: 1em;
  margin-bottom: 0.5em;
}

:deep(.message-text ul),
:deep(.message-text ol) {
  padding-left: 1.5em;
  margin: 0.8em 0;
}

:deep(.message-text li) {
  margin-bottom: 0.4em;
}

:deep(.message-text a) {
  color: #61afef;
  text-decoration: underline;
}

:deep(.message-text blockquote) {
  border-left: 4px solid #4a6baf;
  padding: 0.5em 1em;
  margin: 1em 0;
  background-color: #1e1e30;
  border-radius: 4px;
}

/* 新添加的代码块样式 */
:deep(.code-block-container) {
  margin: 15px 0;
  border-radius: 10px;
  overflow: hidden;
  background-color: #0a0a14;
  border: 1px solid #3a3a58;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

:deep(.code-block-container:hover) {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
  border-color: #4a6baf;
}

:deep(.code-block-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(90deg, #1a1a28, #252538);
  border-bottom: 1px solid #3a3a58;
}

:deep(.code-block-actions) {
  padding: 16px;
  background: linear-gradient(90deg, #1a1a28, #252538);
  border-top: 1px solid #3a3a58;
}

/* 修改样式，美化应用节点按钮 */
:deep(.apply-node-button) {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  color: white;
  font-weight: 600;
  font-size: 14px;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(46, 204, 113, 0.3);
  position: relative;
  overflow: hidden;
}

:deep(.apply-node-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(46, 204, 113, 0.4);
  background: linear-gradient(135deg, #2ecc71, #27ae60);
}

:deep(.apply-node-button:active) {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(46, 204, 113, 0.4);
}

:deep(.apply-node-button::before) {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(255, 255, 255, 0) 100%);
  transition: left 0.7s ease;
}

:deep(.apply-node-button:hover::before) {
  left: 100%;
}

:deep(.apply-node-button.applied) {
  background: linear-gradient(135deg, #3498db, #2980b9);
  box-shadow: 0 4px 10px rgba(52, 152, 219, 0.3);
  cursor: pointer;
  opacity: 0.9;
}

:deep(.apply-node-button.applied:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(52, 152, 219, 0.4);
  background: linear-gradient(135deg, #2980b9, #3498db);
}

:deep(.apply-node-button.applied::before) {
  display: block;
}

:deep(.apply-icon) {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.apply-text) {
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* 改进代码块容器样式 */
:deep(.code-block-container) {
  margin: 15px 0;
  border-radius: 10px;
  overflow: hidden;
  background-color: #0a0a14;
  border: 1px solid #3a3a58;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

:deep(.code-block-container:hover) {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
  border-color: #4a6baf;
}

:deep(.code-block-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(90deg, #1a1a28, #252538);
  border-bottom: 1px solid #3a3a58;
}

:deep(.code-block-actions) {
  padding: 16px;
  background: linear-gradient(90deg, #1a1a28, #252538);
  border-top: 1px solid #3a3a58;
}

/* 代码高亮优化 */
:deep(.hljs) {
  background-color: transparent !important;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.6;
}

:deep(.hljs-keyword),
:deep(.hljs-title.class_) {
  color: #ff79c6;
}

:deep(.hljs-variable),
:deep(.hljs-template-variable) {
  color: #f8f8f2;
}

:deep(.hljs-title.function_) {
  color: #50fa7b;
}

:deep(.hljs-string) {
  color: #f1fa8c;
}

:deep(.hljs-comment) {
  color: #6272a4;
  font-style: italic;
}

:deep(.hljs-number) {
  color: #bd93f9;
}

:deep(.hljs-attr),
:deep(.hljs-attribute) {
  color: #50fa7b;
}

:deep(.hljs-literal),
:deep(.hljs-boolean) {
  color: #bd93f9;
}

:deep(.hljs-params) {
  color: #f8f8f2;
}

/* 添加简约漂亮的滚动条 */
:deep(.code-block::-webkit-scrollbar) {
  height: 6px;
}

:deep(.code-block::-webkit-scrollbar-track) {
  background: #1a1a28;
}

:deep(.code-block::-webkit-scrollbar-thumb) {
  background-color: #3e3e5e;
  border-radius: 3px;
}

:deep(.code-block::-webkit-scrollbar-thumb:hover) {
  background-color: #4a6baf;
}

/* 添加代码行高亮效果 */
:deep(.hljs-line-highlight) {
  background-color: rgba(74, 107, 175, 0.2);
  display: block;
  margin-right: -15px;
  margin-left: -15px;
  padding-left: 15px;
}

/* 添加复制和应用按钮动画效果 */
:deep(.action-button) {
  position: relative;
  overflow: hidden;
}

:deep(.action-button::after) {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(255, 255, 255, 0.3);
  opacity: 0;
  border-radius: 100%;
  transform: scale(1, 1) translate(-50%);
  transform-origin: 50% 50%;
}

:deep(.action-button:active::after) {
  opacity: 1;
  width: 100%;
  height: 100%;
  border-radius: 0;
  transform: scale(0, 0) translate(-50%, -50%);
  transition: all 0.4s ease;
}

/* 添加回丢失的代码块基础样式 */
:deep(.code-language) {
  font-size: 12px;
  color: #8e8ea0;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}

:deep(.code-block) {
  margin: 0;
  padding: 15px;
  overflow-x: auto;
  background-color: transparent;
  border-radius: 0;
  border: none;
  font-size: 14px;
  line-height: 1.5;
}

/* 添加应用中按钮的样式 */
:deep(.apply-node-button.applying) {
  background: linear-gradient(135deg, #3498db, #2980b9);
  cursor: not-allowed;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(52, 152, 219, 0.4);
  }

  70% {
    box-shadow: 0 0 0 10px rgba(52, 152, 219, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(52, 152, 219, 0);
  }
}

:deep(.spinner) {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

/* 添加节点应用成功的样式 */
:deep(.node-apply-success) {
  margin-top: 12px;
  padding: 10px 16px;
  background: linear-gradient(90deg, rgba(39, 174, 96, 0.1), rgba(39, 174, 96, 0.2));
  border-left: 3px solid #27ae60;
  border-radius: 0 6px 6px 0;
  overflow: hidden;
  animation: fadeIn 0.4s ease-out;
}

:deep(.success-message) {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

:deep(.success-icon) {
  color: #27ae60;
  margin-top: 3px;
}

:deep(.success-details) {
  flex: 1;
}

:deep(.success-title) {
  font-weight: 600;
  color: #27ae60;
  margin-bottom: 5px;
}

:deep(.success-paths) {
  font-size: 13px;
  color: #e0e0e0;
}

:deep(.path-item) {
  margin-bottom: 4px;
}

:deep(.path-item code) {
  background-color: rgba(0, 0, 0, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  color: #f1fa8c;
}
</style>
