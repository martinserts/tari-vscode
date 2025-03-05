import { VscodeLabel, VscodeTree } from "@vscode-elements/react-elements";
import { JsonOutlineItem } from "tari-extension-common";
import { VscTreeActionEvent, VscTreeSelectEvent } from "@vscode-elements/elements/dist/vscode-tree/vscode-tree";

interface JsonOutlineProps {
  items: JsonOutlineItem[];
  onSelect?: (item: JsonOutlineItem) => void;
  onAction?: (actionId: string, item: JsonOutlineItem) => void;
}

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

  const treeItems = items.map((item, idx) => {
    const icons = item.icon ? { leaf: item.icon } : undefined;
    const description = item.details ? `(${item.details})` : undefined;
    return {
      label: item.title,
      description,
      icons,
      value: idx.toString(),
      actions: item.actions,
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

export default JsonOutlineTree;
