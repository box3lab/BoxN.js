//@ts-nocheck
import { LiteGraph } from "litegraph.js";

LiteGraph.debug = true;
LiteGraph.catch_exceptions = true;
LiteGraph.throw_errors = true;
LiteGraph.allow_scripts = false; //如果设置为true，某些节点（如Formula）将被允许执行来自不安全源的代码（如节点配置），这可能导致安全漏洞

LiteGraph.searchbox_extras = {}; //用于向搜索框添加额外功能
LiteGraph.auto_sort_node_types = true; // [推荐true] 如果设置为true，将自动在上下文菜单中对节点类型/类别进行排序
LiteGraph.node_box_coloured_when_on = true; // [推荐true] 使节点盒（左上角圆圈）在触发时（执行/动作）变色，提供视觉反馈
LiteGraph.node_box_coloured_by_mode = true; // [推荐true] 节点盒基于节点模式着色，提供视觉反馈
LiteGraph.dialog_close_on_mouse_leave = true; // [移动设备上为false] 如果不是触摸设备，最好设为true
LiteGraph.dialog_close_on_mouse_leave_delay = 500;
LiteGraph.shift_click_do_break_link_from = false; // [推荐false] 设为false可避免过于容易断开连接
LiteGraph.click_do_break_link_to = false; // [推荐false] 设为false可避免过于容易断开连接
LiteGraph.search_hide_on_mouse_leave = true; // [移动设备上为false] 如果不是触摸设备，最好设为true
LiteGraph.search_filter_enabled = true; // [推荐true] 在搜索部件中启用插槽类型过滤；需要auto_load_slot_types或手动设置registered_slot_[in/out]_types和slot_types_[in/out]
LiteGraph.search_show_all_on_open = true; // [推荐true] 打开搜索部件时显示所有结果列表

LiteGraph.auto_load_slot_types = true; // [如果想设为false，先使用true运行一次，获取变量值进行静态设置，然后再禁用] 需要计算节点类型和节点类与节点类型的关联，如果不想这样，计算一次并设置registered_slot_[in/out]_types和slot_types_[in/out]
/*// 如果不使用auto_load_slot_types，请设置这些值
LiteGraph.registered_slot_in_types = {}; // 节点类的输入插槽类型
LiteGraph.registered_slot_out_types = {}; // 节点类的输出插槽类型
LiteGraph.slot_types_in = []; // 输入插槽类型
LiteGraph.slot_types_out = []; // 输出插槽类型*/

LiteGraph.alt_drag_do_clone_nodes = true; // [推荐true] 非常方便；按住ALT键点击可克隆并拖动新节点
LiteGraph.do_add_triggers_slots = true; // [推荐true] 使用动作/事件连接时将创建并连接事件插槽；使用onTrigger时将更改节点模式（启用模式颜色）；onExecuted不需要这个
LiteGraph.allow_multi_output_for_events = false; // [推荐false] 对于事件，强烈建议按顺序一个一个地使用它们
LiteGraph.middle_click_slot_add_default_node = true; //[推荐true] 允许使用鼠标中键（滚轮）创建并连接节点
LiteGraph.release_link_on_empty_shows_menu = true; //[推荐true] 将连接拖动到空白处将打开菜单，可从列表中添加、搜索或使用默认值
LiteGraph.pointerevents_method = "mouse"; // "mouse"|"pointer" 使用鼠标以保持向后兼容性？（目前未发现问题）
LiteGraph.ctrl_shift_v_paste_connect_unselected_outputs = true; //[推荐true] 允许使用Ctrl+Shift+V粘贴节点，并将未选中节点的输出与新粘贴节点的输入连接

export default LiteGraph;
