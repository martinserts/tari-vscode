import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { QueryBuilder, useStore } from "tari-extension-query-builder";
import { Messenger, TariFlowMessages, Theme } from "tari-extension-common";

import "tari-extension-query-builder/dist/tari-extension-query-builder.css";
import "./root.css";

interface AppProps {
  messenger: Messenger<TariFlowMessages> | undefined;
}

function App({ messenger }: AppProps) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [editable, setEditable] = useState(true);

  const changeCounter = useStore((store) => store.changeCounter);
  const saveStateToString = useStore((store) => store.saveStateToString);
  const loadStateFromString = useStore((store) => store.loadStateFromString);

  const [changeCounterDebounced] = useDebounce(changeCounter, 100);

  useEffect(() => {
    if (!messenger) {
      return;
    }
    messenger.registerHandler("init", (params) => {
      const { theme, editable, data } = params;
      setTheme(theme);
      setEditable(editable);
      loadStateFromString(data);
      return Promise.resolve(undefined);
    });
    messenger.registerHandler("setTheme", (newTheme) => {
      setTheme(newTheme);
      return Promise.resolve(undefined);
    });
    messenger.registerHandler("getData", () => {
      return Promise.resolve(saveStateToString());
    });

    void messenger.send("ready", undefined);
  }, [messenger, saveStateToString, loadStateFromString]);

  useEffect(() => {
    if (!messenger || !changeCounterDebounced) {
      return;
    }
    void messenger.send("documentChanged", undefined);
  }, [messenger, changeCounterDebounced]);

  return (
    <>
      <QueryBuilder theme={theme} readOnly={!editable} />
    </>
  );
}

export default App;
