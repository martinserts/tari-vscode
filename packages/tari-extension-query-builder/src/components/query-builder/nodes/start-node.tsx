import { NodeProps } from "@xyflow/react";
import { Label } from "@/components/ui/label";
import { EnterIcon, TrashIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import useStore from "@/store/store";
import { type StartNode } from "@/store/types";
import ExitConnection from "./exit-connection";

function StartNode({ id }: NodeProps<StartNode>) {
  const removeNode = useStore((store) => store.removeNode);
  return (
    <>
      <ExitConnection />
      <div className="absolute top-3 left-2 flex items-center">
        <EnterIcon className="h-5 w-5 mr-1" />
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
      <Label className="text-4xl font-bold p-8 font-stretch-expanded">START</Label>
    </>
  );
}

export default StartNode;
