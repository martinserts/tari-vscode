import "./root.css";
import QueryBuilder from "./components/query-builder/query-builder";
import { useEffect, useRef } from "react";
import tariSwapPoolFunctions from "./stories/data/tari-swap-pool.json";
import walletFunctions from "./stories/data/wallet-functions.json";
import { TemplateDef } from "@tari-project/typescript-bindings";
import useStore from "./store/store";
import { TemplateReader } from "./query-builder/template-reader";

function App() {
  const added = useRef<boolean>(false);
  const addCallNodes = useStore((store) => store.addCallNodes);

  useEffect(() => {
    if (!added.current) {
      const tariSwapPoolReader = new TemplateReader(
        tariSwapPoolFunctions as TemplateDef,
        "d7032a35cac0a7c4c8dafa4dc0bd76c54b3ceb842540d16c77450f5b6fc5111f",
      );
      const walletReader = new TemplateReader(
        walletFunctions as TemplateDef,
        "0000000000000000000000000000000000000000000000000000000000000000",
      );
      addCallNodes([
        ...tariSwapPoolReader.getCallNodes(["add_liquidity", "swap", "remove_liquidity", "new"]),
        ...walletReader.getCallNodes(["create"]),
      ]);
      added.current = true;
    }
  }, [addCallNodes]);
  return (
    <>
      <QueryBuilder theme="dark" />
    </>
  );
}

export default App;
