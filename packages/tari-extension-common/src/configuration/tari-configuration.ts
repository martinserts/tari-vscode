export enum TariNetwork {
  MainNet = "MainNet",
  StageNet = "StageNet",
  NextNet = "NextNet",
  LocalNet = "LocalNet",
  Igor = "Igor",
  Esmeralda = "Esmeralda",
}

export enum TariProviderType {
  WalletDemon = "wallet-daemon",
  WalletConnect = "wallet-connect",
}

export enum TariConfigurationKey {
  WalletDaemonAddress = "walletDaemonAddress",
  WalletConnectProjectId = "walletConnectProjectId",
  DefaultProvider = "defaultProvider",
  MinTransactionFee = "minTransactionFee",
  Network = "network",
}

export interface TariConfiguration {
  [TariConfigurationKey.WalletDaemonAddress]?: string;
  [TariConfigurationKey.WalletConnectProjectId]?: string;
  [TariConfigurationKey.DefaultProvider]: TariProviderType;
  [TariConfigurationKey.MinTransactionFee]: number;
  [TariConfigurationKey.Network]: TariNetwork;
}
