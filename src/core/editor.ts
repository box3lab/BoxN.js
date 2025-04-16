/**
 * 编辑器核心类
 * 负责管理图形编辑器的主要功能
 */

import { LGraph, LGraphCanvas, LiteGraph } from "litegraph.js";

export class Editor {
  private graph: LGraph;
  private canvas: LGraphCanvas;
  private canvasElement: HTMLCanvasElement;

  /**
   * 创建编辑器实例
   * @param canvasId 画布元素 ID
   */
  constructor(canvasId: string) {
    // 获取 canvas 元素
    this.canvasElement = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvasElement) {
      throw new Error(`Canvas element with id "${canvasId}" not found`);
    }

    // demo
    this.graph = new LGraph();
    // 创建一个基础节点
    const node1 = LiteGraph.createNode("basic/const");
    node1.pos = [200, 200];

    this.graph.add(node1);

    const node2 = LiteGraph.createNode("basic/watch");
    node2.pos = [700, 200];
    this.graph.add(node2);

    // 连接节点
    node1.connect(0, node2, 0);
    // 初始化画布
    this.canvas = new LGraphCanvas(`#${canvasId}`, this.graph);

    // 设置自适应画布
    this.setupCanvasResize();
  }

  /**
   * 运行节点
   */
  public start(): void {
    this.graph.start();
  }

  /**
   * 停止运行节点
   */
  public stop(): void {
    this.graph.stop();
  }

  /**
   * 获取图表实例
   */
  public getGraph(): LGraph {
    return this.graph;
  }

  /**
   * 获取画布实例
   */
  public getCanvas(): LGraphCanvas {
    return this.canvas;
  }

  /**
   * 设置画布大小自适应
   */
  private setupCanvasResize(): void {
    // 调整画布大小的函数
    const resizeCanvas = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      this.canvasElement.width = width;
      this.canvasElement.height = height;

      this.canvas.resize(width, height);
      this.canvas.draw(true, true);
    };

    // 初始调整大小
    resizeCanvas();

    // 监听窗口大小变化
    window.addEventListener("resize", resizeCanvas);
  }
}
