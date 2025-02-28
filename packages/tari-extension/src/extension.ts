import * as vscode from "vscode";
import { TariViewProvider } from "./TariViewProvider";
import { WebViewMessages } from "tari-extension-common";

export function activate(context: vscode.ExtensionContext) {
  console.log("Extension 'tari-extension' is now active!");

  const disposable = vscode.commands.registerCommand("extension.tari", () => {
    vscode.window.showInformationMessage(`Tari!`);
  });

  context.subscriptions.push(disposable);
  const provider = new TariViewProvider<WebViewMessages>(context.extensionUri, (messenger) => {
    messenger.registerHandler("getSettings", async () => {
      return "Settings!!!";
    });
  });
  context.subscriptions.push(vscode.window.registerWebviewViewProvider("tariActivityBarView", provider));
}
