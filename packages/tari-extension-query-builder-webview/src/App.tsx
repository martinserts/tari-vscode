import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { QueryBuilder, TemplateReader, useStore } from "tari-extension-query-builder";
import { Messenger, TariFlowMessages, TariFlowNodeDetails, Theme } from "tari-extension-common";

import "tari-extension-query-builder/dist/tari-extension-query-builder.css";
import "./root.css";
import { TemplateDef } from "@tari-project/typescript-bindings";

const DROP_NODE_OFFSET_X = 200;
const DROP_NODE_OFFSET_Y = 50;

interface AppProps {
  messenger: Messenger<TariFlowMessages> | undefined;
}

function App({ messenger }: AppProps) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [editable, setEditable] = useState(true);

  const changeCounter = useStore((store) => store.changeCounter);
  const saveStateToString = useStore((store) => store.saveStateToString);
  const loadStateFromString = useStore((store) => store.loadStateFromString);
  const addCallNodes = useStore((store) => store.addCallNodes);
  const centerX = useStore((store) => store.centerX);
  const centerY = useStore((store) => store.centerY);

  const addNodesToCenter = useCallback(
    (details: TariFlowNodeDetails) => {
      const reader = new TemplateReader(details.template as TemplateDef, details.templateAddress);
      addCallNodes(
        reader.getCallNodes([details.functionName]),
        centerX - DROP_NODE_OFFSET_X,
        centerY - DROP_NODE_OFFSET_Y,
      );
    },
    [centerX, centerY, addCallNodes],
  );

  const [changeCounterDebounced] = useDebounce(changeCounter, 100);

  useEffect(() => {
    if (!messenger) {
      return;
    }
    messenger.registerHandler("init", (params) => {
      try {
        const { theme, editable, data } = params;
        setTheme(theme);
        setEditable(editable);
        loadStateFromString(data);
        return Promise.resolve(undefined);
      } catch (e: unknown) {
        return Promise.reject(Error(String(e)));
      }
    });
    messenger.registerHandler("setTheme", (newTheme) => {
      setTheme(newTheme);
      return Promise.resolve(undefined);
    });
    messenger.registerHandler("getData", () => {
      return Promise.resolve(saveStateToString());
    });
    messenger.registerHandler("addNode", (details) => {
      addNodesToCenter(details);
      return Promise.resolve(undefined);
    });

    messenger.send("ready", undefined).catch(console.log);
  }, [messenger, saveStateToString, loadStateFromString, addNodesToCenter]);

  useEffect(() => {
    if (!messenger || !changeCounterDebounced) {
      return;
    }
    messenger.send("documentChanged", undefined).catch(console.log);
  }, [messenger, changeCounterDebounced]);

  return (
    <>
      <QueryBuilder theme={theme} readOnly={!editable} />
    </>
  );
}

export default App;
