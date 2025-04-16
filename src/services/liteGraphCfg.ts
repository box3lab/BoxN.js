/**
 * LiteGraph全局配置文件
 * 所有LiteGraph相关的全局参数设置都在此处配置
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck
import { LiteGraph } from 'litegraph.js'

// ==== 基础配置 ====
LiteGraph.debug = true // 启用调试模式
LiteGraph.catch_exceptions = true // 捕获异常而不崩溃
LiteGraph.throw_errors = true // 当有错误时抛出异常
LiteGraph.allow_scripts = false // 安全设置: 禁止在节点中执行动态代码

// ==== 界面与交互 ====
LiteGraph.searchbox_extras = {} // 搜索框额外功能
LiteGraph.auto_sort_node_types = true // 在菜单中自动排序节点类型
LiteGraph.node_box_coloured_when_on = true // 节点触发时改变颜色
LiteGraph.node_box_coloured_by_mode = true // 根据节点模式着色
LiteGraph.dialog_close_on_mouse_leave = true // 鼠标离开时关闭对话框
LiteGraph.dialog_close_on_mouse_leave_delay = 500 // 关闭延迟
LiteGraph.shift_click_do_break_link_from = false // 禁用Shift+点击断开连接
LiteGraph.click_do_break_link_to = false // 禁用点击断开连接
LiteGraph.search_hide_on_mouse_leave = true // 鼠标离开时隐藏搜索框
LiteGraph.search_filter_enabled = true // 启用搜索过滤
LiteGraph.search_show_all_on_open = true // 打开搜索时显示所有结果

// ==== 高级特性 ====
LiteGraph.auto_load_slot_types = true // 自动加载插槽类型
LiteGraph.alt_drag_do_clone_nodes = true // Alt+拖拽克隆节点
LiteGraph.do_add_triggers_slots = true // 创建和连接事件插槽
LiteGraph.allow_multi_output_for_events = false // 禁止事件多输出
LiteGraph.middle_click_slot_add_default_node = true // 鼠标中键添加默认节点
LiteGraph.release_link_on_empty_shows_menu = true // 连接拖到空白处显示菜单
LiteGraph.pointerevents_method = 'mouse' // 使用鼠标而非指针事件
LiteGraph.ctrl_shift_v_paste_connect_unselected_outputs = true // Ctrl+Shift+V粘贴连接

export default LiteGraph
