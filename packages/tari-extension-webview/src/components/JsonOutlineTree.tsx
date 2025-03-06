import { VscodeLabel, VscodeTree } from "@vscode-elements/react-elements";
import * as ve from "@vscode-elements/elements";
import { JsonOutlineItem } from "tari-extension-common";
import { VscTreeActionEvent, VscTreeSelectEvent } from "@vscode-elements/elements/dist/vscode-tree/vscode-tree";
import { buildTree, TreeNode } from "../json-parser/tree-builder";

interface JsonOutlineProps {
  items: JsonOutlineItem[];
  onSelect?: (item: JsonOutlineItem) => void;
  onAction?: (actionId: string, item: JsonOutlineItem) => void;
}

type IndexedItem<T> = T & { index: number };

function JsonOutlineTree({ items, onSelect, onAction }: JsonOutlineProps) {
  const handleSelect = (event: VscTreeSelectEvent) => {
    const index = parseInt(event.detail.value);
    if (Number.isNaN(index) || index >= items.length) {
      return;
    }
    const item = items[index];
    if (onSelect) {
      onSelect(item);
    }
  };

  const handleAction = (event: VscTreeActionEvent) => {
    const index = parseInt(event.detail.value);
    if (Number.isNaN(index) || index >= items.length) {
      return;
    }
    const item = items[index];
    if (onAction) {
      onAction(event.detail.actionId, item);
    }
  };

  const indexedItems = items.map((item, index) => ({ ...item, index }));
  const treeItems = mapTree(buildTree(indexedItems), (item) => {
    const icons = item.icon ? { leaf: item.icon } : undefined;
    const description = item.details ? `(${item.details})` : undefined;
    return {
      label: item.title,
      description,
      icons,
      value: item.index.toString(),
      actions: item.actions,
      open: item.open,
    };
  });

  const hasItems = treeItems.length > 0;
  return (
    <>
      {hasItems && <VscodeTree data={treeItems} onVscTreeSelect={handleSelect} onVscTreeAction={handleAction} />}
      {!hasItems && <VscodeLabel>No Items</VscodeLabel>}
    </>
  );
}

type TreeItem = ve.VscodeTree["data"][0];

function mapTree(
  from: TreeNode<IndexedItem<JsonOutlineItem>>[],
  f: (item: IndexedItem<JsonOutlineItem>) => TreeItem,
): TreeItem[] {
  const mappedTreeNodes: TreeItem[] = [];
  for (const node of from) {
    const mappedNode: TreeItem = f(node.item);
    if (node.children) {
      mappedNode.subItems = mapTree(node.children, f);
    }
    mappedTreeNodes.push(mappedNode);
  }
  return mappedTreeNodes;
}

export default JsonOutlineTree;
