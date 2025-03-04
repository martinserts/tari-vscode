import { VscodeTree } from "@vscode-elements/react-elements";
import { JsonOutlineItem } from "tari-extension-common";
import { VscTreeSelectEvent } from "@vscode-elements/elements/dist/vscode-tree/vscode-tree";

interface JsonOutlineProps {
  items: JsonOutlineItem[];
  onSelect: (item: JsonOutlineItem) => void;
}

function JsonOutlineTree({ items, onSelect }: JsonOutlineProps) {
  const handleSelect = (event: VscTreeSelectEvent) => {
    const index = parseInt(event.detail.value);
    if (Number.isNaN(index) || index >= items.length) {
      return;
    }
    const item = items[index];
    onSelect(item);
  };

  const treeItems = items.map((item, idx) => {
    const icons = item.icon ? { leaf: item.icon } : undefined;
    return {
      label: item.title,
      description: item.details,
      icons,
      value: idx.toString(),
    };
  });
  return (
    <>
      <VscodeTree data={treeItems} onVscTreeSelect={handleSelect}/>
    </>
  );
}

export default JsonOutlineTree;
