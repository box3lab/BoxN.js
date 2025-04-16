/**
 * 应用主文件
 * 负责初始化编辑器并设置基本行为
 */

// 导入编辑器核心
import { Editor } from "./core";

// 导入节点系统（会自动注册所有节点）
import "./nodes";
// 创建编辑器实例
const editor = new Editor("mycanvas");

// 将编辑器实例暴露在全局作用域（方便调试）
if (process.env.NODE_ENV !== "production") {
  (window as any).editor = editor;
}

// 运行按钮功能
document.getElementById("run-button")?.addEventListener("click", function () {
  editor.start();
});
