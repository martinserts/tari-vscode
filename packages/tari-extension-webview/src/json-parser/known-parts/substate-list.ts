import { KnownJsonPart } from "../JsonOutline";
import { getPropertyDetails, getSiblingProperties } from "../tree-node-helpers";

const SUBSTATE_ICON: Record<string, string> = {
  vault: "database",
  component: "package",
  resource: "file",
  template: "layout",
};

const substateOverview: KnownJsonPart = {
  path: ["substates", "*", "substate_id"],
  getOutlineItem: (node) => {
    const property = node.parent;
    const propertyDetails = getPropertyDetails(property);
    const substateId = propertyDetails?.value;
    if (!substateId) {
      return undefined;
    }
    const title = getSubstateTyoe(substateId as string);

    const moduleName = getSiblingProperties(property).find(({ key }) => key === "module_name");
    const details = moduleName?.value ? moduleName.value.toString() : undefined;
    const icon = SUBSTATE_ICON[title] ?? "";

    return {
      title,
      icon,
      details,
    };
  },
};

function getSubstateTyoe(id: string): string {
  const parts = id.split("_");
  if (parts.length < 2) {
    return "unknown";
  }
  return parts[0];
}

export const SUBSTATE_LIST_PARTS = [substateOverview];
