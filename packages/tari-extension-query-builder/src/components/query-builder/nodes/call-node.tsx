import { Handle, Position, NodeProps } from "@xyflow/react";
import CallInputText from "../input/call-input-text";
import { InputControlType, TariType } from "@/query-builder/tari-type";
import CallInputCheckbox from "../input/call-input-checkbox";
import { type CallNode } from "@/store/types";
import useStore from "@/store/store";
import { useCallback } from "react";
import { SafeParseReturnType } from "zod";
import { Separator } from "@radix-ui/react-separator";
import { ArrowDownIcon, CubeIcon, HomeIcon, TrashIcon } from "@radix-ui/react-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const HANDLE_STARTING_OFFSET = 68;
const COMPONENT_ADDRESS_HEIGHT = 64;
const ROW_PADDING = 4;
const ROW_HEIGHT = 36;
const ROW_HEIGHT_PX = `${ROW_HEIGHT.toString()}px`;

function CallNode({ id, data }: NodeProps<CallNode>) {
  const { fn, templateName, isMethod } = data;

  const getNodeDataById = useStore((store) => store.getNodeDataById);
  const updateNodeArgValue = useStore((store) => store.updateNodeArgValue);
  const getComponentAddress = useStore((store) => store.getNodeDataById(id)?.componentAddress);
  const updateNodeComponentAddress = useStore((store) => store.updateNodeComponentAddress);
  const removeNode = useStore((store) => store.removeNode);

  const getNodeValue = useCallback(
    (name: string) => {
      const data = getNodeDataById(id);
      if (!data?.values) {
        return undefined;
      }
      return data.values[name];
    },
    [id, getNodeDataById],
  );

  const handleOnChange = (argName: string, value: SafeParseReturnType<unknown, unknown>) => {
    updateNodeArgValue(id, argName, value);
  };

  const outputType = new TariType(fn.output);
  const componentAddressType = new TariType({ Other: { name: "Component" } });

  const rowHeight = ROW_HEIGHT + ROW_PADDING;
  const startingHandleOffset = HANDLE_STARTING_OFFSET + (isMethod ? COMPONENT_ADDRESS_HEIGHT : 0);

  return (
    <>
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
        /*
        <div className="absolute top-3 left-2">
          {
            isMethod && (<CodeIcon />)
          }
          {
            !isMethod && (<CubeIcon />)
          }
          <Badge>{templateName}</Badge>
        </div>
        */
        <div className="absolute top-3 left-2 flex items-center">
          {isMethod && <CubeIcon className="h-5 w-5 mr-1" />}
          {!isMethod && <HomeIcon className="h-5 w-5 mr-1" />}
          <Badge>{templateName}</Badge>
        </div>
      }
      <div className="absolute top-1 right-2">
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
        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md mb-2 w-full">
          <CallInputText
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
      <div className="flex items-center justify-center">
        <ArrowDownIcon className="mr-2 h-5 w-5 text-gray-500" />
        <span className="font-semibold text-lg pr-8">{outputType.prompt}</span>
      </div>
      {!outputType.isVoid() && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{
            border: "2px solid #608bb9",
          }}
        />
      )}
    </>
  );
}

export default CallNode;
