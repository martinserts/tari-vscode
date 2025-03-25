import "./root.css";
import QueryBuilder from "./components/query-builder/query-builder";
import { useEffect, useRef } from "react";
import tariSwapPoolFunctions from "./stories/data/tari-swap-pool.json";
import { TemplateDef } from "@tari-project/typescript-bindings";
import useStore from "./store/store";
import { TemplateReader } from "./query-builder/template-reader";
import { NodeType } from "./store/types";

function App() {
  const added = useRef<boolean>(false);
  const addNodeAt = useStore((store) => store.addNodeAt);

  useEffect(() => {
    if (!added.current) {
      const tariSwapPoolReader = new TemplateReader(
        tariSwapPoolFunctions as TemplateDef,
        "d7032a35cac0a7c4c8dafa4dc0bd76c54b3ceb842540d16c77450f5b6fc5111f",
      );
      const [data] = tariSwapPoolReader.getCallNodes(["add_liquidity"]);
      addNodeAt({ type: NodeType.CallNode, data });
      added.current = true;
    }
  }, [addNodeAt]);
  return (
    <>
      <QueryBuilder theme="dark" />
    </>
  );
}

export default App;
