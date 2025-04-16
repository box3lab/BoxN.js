/**
 * 加法节点
 * 实现两个输入数字相加的功能
 */

import { LGraphNode } from "litegraph.js";

export class AddNode extends LGraphNode {
  constructor() {
    super("加法");
    this.addInput("A", "number");
    this.addInput("B", "number");
    this.addOutput("A+B", "number");

    // 加入精度配置
    this.properties = { precision: 1 };

    // 添加自定义小部件
    this.addWidget(
      "number",
      "精度",
      1,
      (value) => {
        this.properties.precision = value;
      },
      { min: 0, max: 10, step: 1 }
    );
  }

  /**
   * 节点执行函数
   */
  onExecute(): void {
    let A = this.getInputData<number>(0);
    if (A === undefined) A = 0;

    let B = this.getInputData<number>(1);
    if (B === undefined) B = 0;

    const result = A + B;
    this.setOutputData(0, result);
  }
}
