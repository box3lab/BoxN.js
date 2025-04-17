import { createApp } from 'vue'
import App from './App.vue'

// 引入全局样式
import './assets/styles/graph-editor.css'
import './style.css'
import 'highlight.js/styles/atom-one-dark.css'

// 引入lodash的clamp函数并添加到全局对象
import { clamp } from 'lodash'
window.clamp = clamp

// 创建并挂载应用
createApp(App).mount('#app')
