import { TariProvider } from "@tari-project/tarijs";
import { VscodeDivider } from "@vscode-elements/react-elements";
import AccountActions from "./actions/AccountActions";
import ListSubstatesActions from "./actions/ListSubstatesActions";

interface ProviderActionsProps {
  provider: TariProvider;
}

function ProviderActions({ provider }: ProviderActionsProps) {
  return (
    <>
      <VscodeDivider />
      <AccountActions provider={provider}></AccountActions>
      <ListSubstatesActions provider={provider}></ListSubstatesActions>
    </>
  );
}

export default ProviderActions;
