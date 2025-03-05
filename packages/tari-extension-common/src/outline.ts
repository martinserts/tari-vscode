export interface TreeItemAction {
  actionId: string;
  icon: string;
  tooltip?: string;
}

export interface Markdown {
  text: string;
  language?: string;
}

export interface JsonOutlineItemBase {
  title: string;
  details?: string;
  icon?: string;
  value?: unknown;
  hoverMessage?: Markdown;
  actions?: TreeItemAction[];
}

export interface JsonOutlineItem extends JsonOutlineItemBase {
  offset: number;
  length: number;
}
