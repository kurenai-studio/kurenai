import type { Node } from 'cc';

/**
 * A view is a Component that builds or looks up its nodes under `root` in code.
 * Attach it at runtime: `root.addComponent(SomeView).bind(root)`.
 */
export interface IView {
    bind(root: Node): void;
}
