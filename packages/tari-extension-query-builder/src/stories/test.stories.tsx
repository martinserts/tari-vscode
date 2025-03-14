import QueryBuilder, { QueryBuilderHandle } from "@/components/query-builder/query-builder";
import { useEffect, useRef } from "react";
import walletFunctions from "./data/tari-swap-pool.json";
import { TemplateDefV1 } from "@tari-project/typescript-bindings";

import "../index.css";

export function SingleCall() {
  const ref = useRef<QueryBuilderHandle | null>(null);

  useEffect(() => {
    if (ref.current) {
      const wf = walletFunctions as unknown as TemplateDefV1;
      const fn = wf.functions[0];
      ref.current.addQueryNode(fn);
    }
  }, []);

  return (
    <>
      <QueryBuilder ref={ref} theme="dark" />
    </>
  );
}
