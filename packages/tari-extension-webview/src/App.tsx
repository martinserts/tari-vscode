import "flexboxgrid/css/flexboxgrid.min.css";
import { useEffect, useState } from "react";
import { useTariStore } from "./store/tari-store";
import Providers from "./Providers";
import ProviderActions from "./ProviderActions";

if (import.meta.env.DEV) {
  await import("@vscode-elements/webview-playground");
}

function App() {
  const messenger = useTariStore((state) => state.messenger);
  const provider = useTariStore((state) => state.provider);
  const configuration = useTariStore((state) => state.configuration);
  const setConfiguration = useTariStore((state) => state.setConfiguration);
  const [providersOpen, setProvidersOpen] = useState(true);

  useEffect(() => {
    if (messenger) {
      messenger
        .send("getConfiguration", undefined)
        .then((configuration) => {
          setConfiguration(configuration);
        })
        .catch((error: unknown) => {
          console.error("Failed to get configuration", error);
        });
    }
  }, [messenger, setConfiguration]);

  useEffect(() => {
    if (provider) {
      setProvidersOpen(false);
    }
  }, [provider]);

  if (configuration) {
    return (
      <>
        {import.meta.env.DEV ? <vscode-dev-toolbar></vscode-dev-toolbar> : null}

        <Providers
          configuration={configuration}
          open={providersOpen}
          onToggle={(open) => {
            setProvidersOpen(open);
          }}
        />
        {provider && <ProviderActions provider={provider} />}
      </>
    );
  } else {
    return <></>;
  }
}

export default App;
