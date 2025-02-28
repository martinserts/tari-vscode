import * as vscode from "vscode";
import * as fs from "fs";
import { AllowedActions, Messenger } from "tari-extension-common";

export class TariViewProvider<Actions extends AllowedActions> implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private setupMessenger: (messenger: Messenger<Actions>) => void,
  ) {}

  public async resolveWebviewView(webviewView: vscode.WebviewView): Promise<void> {
    this.view = webviewView;
    const webView = webviewView.webview;

    webView.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };
    webviewView.webview.html = await this.getHtmlForWebview(webView);

    const messenger = new Messenger<Actions>({
      sendMessage: (msg) => webView.postMessage(msg),
      onMessage: (callback) => {
        webView.onDidReceiveMessage(callback);
      },
    });
    this.setupMessenger(messenger);
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const distPath = vscode.Uri.joinPath(this.extensionUri, "dist", "webview");
    const webviewPath = vscode.Uri.joinPath(distPath, "index.html");
    const html = fs.readFileSync(webviewPath.fsPath, "utf8");
    return prepareWebviewHtml(html, webview.cspSource, distPath, webview);
  }
}

function prepareWebviewHtml(html: string, cspSource: string, distPath: vscode.Uri, webview: vscode.Webview): string {
  const nonce = getNonce();
  let updatedHtml = html;

  //const csp = `default-src 'none'; font-src ${cspSource}; style-src ${cspSource}; script-src 'nonce-${nonce}';`;
  // TODO: make this CSP more restrictive
  const csp = `default-src *`;
  const cspMetaTag = `<meta http-equiv="Content-Security-Policy" content="${csp}">`;
  updatedHtml = updatedHtml.replace(/<head>/i, (match) => `${match}\n${cspMetaTag}`);

  const replaceAssetLinks = (htmlContent: string, tag: "script" | "link", attribute: "src" | "href") => {
    const tagRegex = new RegExp(`<${tag}(.*?) ${attribute}="([^"]+)"(.*?)>`, "g");
    return htmlContent.replace(tagRegex, (_match, preAttr, url, postAttr) => {
      const assetFullPath = vscode.Uri.joinPath(distPath, url.substring(1));
      const webviewUri = webview.asWebviewUri(assetFullPath);
      return `<${tag}${preAttr} ${attribute}="${webviewUri.toString()}"${postAttr}>`;
    });
  };

  updatedHtml = replaceAssetLinks(updatedHtml, "script", "src");
  updatedHtml = replaceAssetLinks(updatedHtml, "link", "href");
  updatedHtml = updatedHtml.replace(/<script(.*?)>/g, `<script nonce="${nonce}"$1>`);

  return updatedHtml;
}

function getNonce() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
