/**
 * Type declarations for node generator service
 */

declare module '../services/nodeGeneratorService' {
  /**
   * Creates a new node file based on AI-generated code
   * @param className The name of the node class
   * @param category The category the node belongs to
   * @param code The TypeScript code for the node
   */
  export function createNodeFile(
    className: string,
    category: string,
    code: string,
  ): Promise<boolean>

  /**
   * Returns available node categories
   */
  export function getNodeCategories(): string[]

  /**
   * Checks if a node name is valid
   * @param name The node name to check
   */
  export function isValidNodeName(name: string): boolean
}
