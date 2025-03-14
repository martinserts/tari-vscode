import { CallNodeData } from "@/store/types";
import { TemplateDef } from "@tari-project/typescript-bindings";

export class TemplateReader {
  constructor(
    public templateDef: TemplateDef,
    public templateAddress: string,
  ) {}

  public get templateName(): string {
    return this.templateDef.V1.template_name;
  }

  public getCallNodes(functionNames: string[]): CallNodeData[] {
    return functionNames.flatMap((name) => {
      const fnDef = this.templateDef.V1.functions.find((f) => f.name === name);
      if (!fnDef?.arguments.length) {
        return [];
      }
      const isMethod = fnDef.arguments[0].name === "self";
      const fn = isMethod ? { ...fnDef, arguments: fnDef.arguments.filter((arg) => arg.name !== "self") } : fnDef;

      return [{ templateName: this.templateName, templateAddress: this.templateAddress, isMethod, fn }];
    });
  }
}
