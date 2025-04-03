import { ExecuteTransactionBaseRequest, TransactionProps } from "tari-extension-common";

export interface FlowToTariView {
  getTransactionProps: () => Promise<TransactionProps>;
  executeTransaction: (request: ExecuteTransactionBaseRequest) => Promise<void>;
}
