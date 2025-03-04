export interface JsonOutlineItemBase {
  title: string;
  details?: string;
  icon?: string;
}

export interface JsonOutlineItem extends JsonOutlineItemBase {
  offset: number;
  length: number;
}
