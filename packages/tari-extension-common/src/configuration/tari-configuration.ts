export enum TariProviderType {
  WalletDemon = "wallet-daemon",
  WalletConnect = "wallet-connect",
}
  
export enum TariConfigurationKey {
  WalletDaemonAddress = "walletDaemonAddress",
  WalletConnectProjectId = "walletConnectProjectId",
  DefaultProvider = "defaultProvider",
}

export interface TariConfiguration {
  [TariConfigurationKey.WalletDaemonAddress]?: string;
  [TariConfigurationKey.WalletConnectProjectId]?: string;
  [TariConfigurationKey.DefaultProvider]: TariProviderType;
}
