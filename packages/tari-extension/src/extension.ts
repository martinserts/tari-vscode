import * as vscode from "vscode";
import { TariViewProvider } from "./TariViewProvider";
import { TariConfigurationKey, TariProviderType, WebViewMessages } from "tari-extension-common";
import { TariConfiguration } from "tari-extension-common";
import { LongOperation } from "./LongOperation";
import { ReadOnlyJsonDocumentProvider } from "./ReadOnlyJsonDocumentProvider";

const CONFIGURATION_ROOT = "tari";

export function activate(context: vscode.ExtensionContext) {
  console.log("Extension 'tari-extension' is now active!");

  let longOperation: LongOperation | undefined;

  const readonlyDocumentProvider = new ReadOnlyJsonDocumentProvider();
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider("readonly", readonlyDocumentProvider),
  );
  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((doc) => {
      if (doc.uri.scheme === "readonly") {
        readonlyDocumentProvider.deleteDocument(doc.uri);
      }
    }),
  );
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && editor.document.uri.scheme === "readonly") {
        readonlyDocumentProvider.updateDecorations(editor);
      }
    }),
  );

  const tariViewProvider = new TariViewProvider<WebViewMessages>(context, context.extensionUri, (messenger) => {
    messenger.registerHandler("showError", ({ message, detail }) => {
      const modal = !!detail;
      vscode.window.showErrorMessage(message, { modal, detail });
      return Promise.resolve(undefined);
    });
    messenger.registerHandler("getConfiguration", () => {
      return Promise.resolve(fetchConfiguration());
    });
    messenger.registerHandler("setWalletDaemonAddress", async (walletDaemonAddress) => {
      await getRootConfiguration().update(
        TariConfigurationKey.WalletDaemonAddress,
        walletDaemonAddress,
        vscode.ConfigurationTarget.Global,
      );
      return undefined;
    });
    messenger.registerHandler("setWalletConnectProjectId", async (walletConnectProjectId) => {
      await getRootConfiguration().update(
        TariConfigurationKey.WalletConnectProjectId,
        walletConnectProjectId,
        vscode.ConfigurationTarget.Global,
      );
      return undefined;
    });
    messenger.registerHandler("setDefaultProvider", async (defaultProvider) => {
      await getRootConfiguration().update(
        TariConfigurationKey.DefaultProvider,
        defaultProvider,
        vscode.ConfigurationTarget.Global,
      );
      return undefined;
    });
    messenger.registerHandler("showLongOperation", async ({ title, cancellable }) => {
      longOperation = new LongOperation(title, cancellable);
      const cancelled = await longOperation.start();
      longOperation = undefined;
      return { cancelled };
    });
    messenger.registerHandler("updateLongOperation", ({ increment, message }) => {
      longOperation?.update(increment, message);
      return Promise.resolve(undefined);
    });
    messenger.registerHandler("endLongOperation", () => {
      longOperation?.end();
      return Promise.resolve(undefined);
    });
    messenger.registerHandler("showJsonOutline", async ({ id, json, outlineItems, selected }) => {
      console.log("!!! showJsonOutline", selected);
      const uri = readonlyDocumentProvider.createDocument({ id, json, outlineItems });
      if (uri) {
        const document = await vscode.workspace.openTextDocument(uri);
        await vscode.languages.setTextDocumentLanguage(document, "json");
        await vscode.window.showTextDocument(document, { preview: false });
      }
      if (selected) {
        const documentUri = ReadOnlyJsonDocumentProvider.getUriById(id);
        const editor = vscode.window.visibleTextEditors.find((e) => e.document.uri.path === documentUri.path);
        if (editor) {
          const startPos = editor.document.positionAt(selected.offset);
          const endPos = editor.document.positionAt(selected.offset + selected.length);
          editor.selection = new vscode.Selection(startPos, endPos);

          editor.revealRange(new vscode.Range(startPos, endPos), vscode.TextEditorRevealType.InCenter);
        }
      }
      return undefined;
    });
  });
  context.subscriptions.push(vscode.window.registerWebviewViewProvider("tariActivityBarView", tariViewProvider));

  // Notify the webview of any configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration(CONFIGURATION_ROOT)) {
        tariViewProvider.send("configurationChanged", fetchConfiguration()).catch(console.error);
      }
    }),
  );
}

function fetchConfiguration(): TariConfiguration {
  const settings = getRootConfiguration();
  return {
    walletDaemonAddress: settings.get<string>(TariConfigurationKey.WalletDaemonAddress),
    walletConnectProjectId: settings.get<string>(TariConfigurationKey.WalletConnectProjectId),
    defaultProvider: (settings.get<string>(TariConfigurationKey.DefaultProvider) ??
      TariProviderType.WalletDemon) as TariProviderType,
  };
}

function getRootConfiguration(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration(CONFIGURATION_ROOT);
}
