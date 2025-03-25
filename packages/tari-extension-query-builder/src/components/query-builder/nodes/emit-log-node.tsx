import { NodeProps } from "@xyflow/react";
import { RocketIcon, TrashIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import useStore from "@/store/store";
import { NodeType, type EmitLogNode } from "@/store/types";
import CallInputText from "../input/call-input-text";
import { ROW_HEIGHT_PX } from "./constamts";
import CallInputSelect from "../input/call-input-select";
import { useCallback } from "react";
import { SafeParseReturnType, z } from "zod";
import EnterConnection from "./enter-connection";
import ExitConnection from "./exit-connection";

export const LOG_LEVEL_NAME = "log_level";
const LOG_LEVEL_CHOICES = ["Error", "Warn", "Info", "Debug"] as const;
const logLevelValidator = z.enum(LOG_LEVEL_CHOICES);
export const MESSAGE_NAME = "message";
const messageValidator = z.any();

function EmitLogNode({ id }: NodeProps<EmitLogNode>) {
  const removeNode = useStore((store) => store.removeNode);
  const readOnly = useStore((store) => store.readOnly);
  const getNodeById = useStore((store) => store.getNodeById);
  const updateNodeArgValue = useStore((store) => store.updateNodeArgValue);

  const getNodeValue = useCallback(
    (name: string) => {
      const node = getNodeById(id);
      if (!node || node.type !== NodeType.EmitLogNode) {
        return undefined;
      }
      if (!node.data.values) {
        return undefined;
      }
      return node.data.values[name];
    },
    [id, getNodeById],
  );

  const handleOnChange = (argName: string, value: SafeParseReturnType<unknown, unknown>) => {
    updateNodeArgValue(id, argName, value);
  };

  return (
    <>
      <EnterConnection />
      <ExitConnection />
      <div className="absolute top-3 left-4 flex items-center">
        <RocketIcon className="h-5 w-5 mr-1" />
      </div>
      <div className="absolute top-1 right-2 nodrag nopan">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            removeNode(id);
          }}
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </div>

      <h3 className="text-center font-bold p-2 border-b">Emit Log</h3>
      <form noValidate>
        <CallInputSelect
          choices={[...LOG_LEVEL_CHOICES]}
          readOnly={readOnly}
          name={LOG_LEVEL_NAME}
          label="Log level"
          validate={(data) => logLevelValidator.safeParse(data)}
          value={getNodeValue(LOG_LEVEL_NAME)}
          onChange={(value) => {
            handleOnChange(LOG_LEVEL_NAME, value);
          }}
          rowHeight={ROW_HEIGHT_PX}
        />
        <CallInputText
          readOnly={readOnly}
          name={MESSAGE_NAME}
          label="Message"
          placeHolder="Message"
          type="text"
          validate={(data) => messageValidator.safeParse(data)}
          value={getNodeValue(MESSAGE_NAME)}
          onChange={(value) => {
            handleOnChange(MESSAGE_NAME, value);
          }}
          rowHeight={ROW_HEIGHT_PX}
        />
      </form>
    </>
  );
}

export default EmitLogNode;
