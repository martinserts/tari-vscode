import { Handle, Position, NodeProps } from "@xyflow/react";
import CallInputText from "../input/call-input-text";
import { InputControlType, TariType } from "@/query-builder/tari-type";
import CallInputCheckbox from "../input/call-input-checkbox";
import { NodeType, type CallNode } from "@/store/types";
import useStore from "@/store/store";
import { useCallback } from "react";
import { SafeParseReturnType } from "zod";
import { Separator } from "@radix-ui/react-separator";
import { CubeIcon, HomeIcon, TrashIcon } from "@radix-ui/react-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CALL_NODE_RETURN } from "./call-node.types";
import { ROW_HEIGHT, ROW_HEIGHT_PX, ROW_PADDING } from "./constamts";
import EnterConnection from "./enter-connection";
import ExitConnection from "./exit-connection";

const HANDLE_STARTING_OFFSET = 68;
const COMPONENT_ADDRESS_HEIGHT = 64;

function CallNode({ id, data }: NodeProps<CallNode>) {
  const { fn, templateName, isMethod } = data;

  const getNodeById = useStore((store) => store.getNodeById);
  const updateNodeArgValue = useStore((store) => store.updateNodeArgValue);
  const getComponentAddress = useStore((store) => {
    const node = store.getNodeById(id);
    if (!node || node.type !== NodeType.CallNode) {
      return undefined;
    }
    return node.data.componentAddress;
  });
  const updateNodeComponentAddress = useStore((store) => store.updateCallNodeComponentAddress);
  const removeNode = useStore((store) => store.removeNode);
  const readOnly = useStore((store) => store.readOnly);

  const getNodeValue = useCallback(
    (name: string) => {
      const node = getNodeById(id);
      if (!node || node.type !== NodeType.CallNode) {
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

  const outputType = new TariType(fn.output);
  const componentAddressType = new TariType({ Other: { name: "Component" } });

  const rowHeight = ROW_HEIGHT + ROW_PADDING;
  const startingHandleOffset = HANDLE_STARTING_OFFSET + (isMethod ? COMPONENT_ADDRESS_HEIGHT : 0);

  const getOutputOffset = () => {
    const offset = startingHandleOffset + rowHeight * fn.arguments.length + 25;
    return `${offset.toString()}px`;
  };

  return (
    <>
      <EnterConnection />
      <ExitConnection />
      {fn.arguments.map((arg, idx) => {
        return (
          <Handle
            key={arg.name}
            id={arg.name}
            type="target"
            position={Position.Left}
            style={{
              border: "2px solid green",
              top: `${(startingHandleOffset + idx * rowHeight).toString()}px`,
            }}
          />
        );
      })}
      {
        <div className="absolute top-3 left-4 flex items-center">
          {isMethod && <CubeIcon className="h-5 w-5 mr-1" />}
          {!isMethod && <HomeIcon className="h-5 w-5 mr-1" />}
          <Badge>{templateName}</Badge>
        </div>
      }
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
      <h3 className="text-center font-bold p-2 border-b">{fn.name}</h3>
      {isMethod && (
        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md mb-2 w-full min-w-[64ch]">
          <CallInputText
            readOnly={readOnly}
            name=""
            placeHolder="Component Address"
            type={componentAddressType.prompt}
            validate={(data) => componentAddressType.validate(data)}
            value={getComponentAddress}
            onChange={(value) => {
              updateNodeComponentAddress(id, value);
            }}
            rowHeight={ROW_HEIGHT_PX}
          />
        </div>
      )}
      <form noValidate>
        {fn.arguments.map((arg) => {
          const type = new TariType(arg.arg_type);
          switch (type.getInputControlType()) {
            case InputControlType.TextBoxInput: {
              return (
                <CallInputText
                  readOnly={readOnly}
                  key={arg.name}
                  name={arg.name}
                  placeHolder={type.prompt}
                  type={type.inputType}
                  min={type.min?.toString()}
                  max={type.max?.toString()}
                  validate={(data) => type.validate(data)}
                  value={getNodeValue(arg.name)}
                  onChange={(value) => {
                    handleOnChange(arg.name, value);
                  }}
                  rowHeight={ROW_HEIGHT_PX}
                />
              );
            }
            case InputControlType.CheckBoxInput:
              return (
                <CallInputCheckbox
                  readOnly={readOnly}
                  key={arg.name}
                  name={arg.name}
                  value={getNodeValue(arg.name)}
                  onChange={(value) => {
                    handleOnChange(arg.name, value);
                  }}
                  rowHeight={ROW_HEIGHT_PX}
                />
              );
          }
        })}
      </form>
      <Separator className="my-4 h-px w-full bg-gray-300 dark:bg-gray-600" />
      <div className="flex justify-end w-full">
        <span className="font-semibold text-lg pr-2">{outputType.prompt}</span>
      </div>
      {!outputType.isVoid() && (
        <Handle
          id={CALL_NODE_RETURN}
          type="source"
          position={Position.Right}
          style={{
            border: "2px solid #608bb9",
            top: getOutputOffset(),
          }}
        />
      )}
    </>
  );
}

export default CallNode;
