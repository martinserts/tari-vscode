import { TariProvider } from "@tari-project/tarijs";
import { VscodeDivider } from "@vscode-elements/react-elements";
import AccountActions from "./actions/AccountActions";

interface ProviderActionsProps {
  provider: TariProvider;
}

function ProviderActions({ provider }: ProviderActionsProps) {
  return (
    <>
      <VscodeDivider></VscodeDivider>
      <AccountActions provider={provider}></AccountActions>
    </>
  )
};

export default ProviderActions;
