import * as vscode from "vscode";
import { getHtmlForWebview } from "../webview";
import { Messenger, TariFlowMessages } from "tari-extension-common";
import { getTheme } from "../theme";

class TariFlowDocument implements vscode.CustomDocument {
  private constructor(
    public uri: vscode.Uri,
    public documentData: string,
  ) {}

  public static async create(uri: vscode.Uri, backupId: string | undefined): Promise<TariFlowDocument> {
    const dataFile = backupId ? vscode.Uri.parse(backupId) : uri;
    const documentData = await TariFlowDocument.readFile(dataFile);
    return new TariFlowDocument(uri, documentData);
  }

  private static async readFile(uri: vscode.Uri): Promise<string> {
    if (uri.scheme === "untitled") {
      return "{}";
    }
    const data = await vscode.workspace.fs.readFile(uri);
    return new TextDecoder().decode(data);
  }

  public async revert() {
    this.documentData = await TariFlowDocument.readFile(this.uri);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public dispose() {}
}

export class TariFlowEditorProvider implements vscode.CustomEditorProvider<TariFlowDocument> {
  private static newFileId = 1;
  private static readonly viewType = "tari.flow-document";
  private readonly webviews = new WebviewCollection();

  private readonly onDidChangeCustomDocumentEventEmitter = new vscode.EventEmitter<
    vscode.CustomDocumentContentChangeEvent<TariFlowDocument>
  >();
  public readonly onDidChangeCustomDocument = this.onDidChangeCustomDocumentEventEmitter.event;

  constructor(private readonly context: vscode.ExtensionContext) {}

  public register(): vscode.Disposable {
    vscode.commands.registerCommand("tari.flow-document.new", () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        vscode.window.showErrorMessage("Creating new Tari Flow files currently requires opening a workspace");
        return;
      }

      const uri = vscode.Uri.joinPath(workspaceFolders[0].uri, `new-${TariFlowEditorProvider.newFileId++}.tari`).with({
        scheme: "untitled",
      });

      vscode.commands.executeCommand("vscode.openWith", uri, TariFlowEditorProvider.viewType);
    });

    return vscode.window.registerCustomEditorProvider(TariFlowEditorProvider.viewType, this, {
      webviewOptions: {
        retainContextWhenHidden: true,
      },
      supportsMultipleEditorsPerDocument: false,
    });
  }

  public async openCustomDocument(uri: vscode.Uri, openContext: { backupId?: string }): Promise<TariFlowDocument> {
    const document: TariFlowDocument = await TariFlowDocument.create(uri, openContext.backupId);
    return document;
  }

  private static async initDocument(document: TariFlowDocument, messenger: Messenger<TariFlowMessages>) {
    const editable = !!vscode.workspace.fs.isWritableFileSystem(document.uri.scheme);
    await messenger.send("init", {
      theme: getTheme(vscode.window.activeColorTheme),
      data: document.documentData,
      editable,
    });
  }

  public async resolveCustomEditor(document: TariFlowDocument, webviewPanel: vscode.WebviewPanel): Promise<void> {
    const webView = webviewPanel.webview;
    const messenger = new Messenger<TariFlowMessages>({
      sendMessage: (msg) => webView.postMessage(msg),
      onMessage: (callback) => {
        this.context.subscriptions.push(webView.onDidReceiveMessage(callback));
      },
    });
    messenger.registerHandler("ready", async () => {
      await TariFlowEditorProvider.initDocument(document, messenger);
      return undefined;
    });
    messenger.registerHandler("documentChanged", () => {
      this.onDidChangeCustomDocumentEventEmitter.fire({
        document,
      });
      return Promise.resolve(undefined);
    });
    this.webviews.add(document.uri, webviewPanel, messenger);

    webView.options = {
      enableScripts: true,
    };
    webView.html = getHtmlForWebview(webviewPanel.webview, this.context.extensionUri, "query-builder-webview");
  }

  public saveCustomDocument(document: TariFlowDocument, cancellation: vscode.CancellationToken): Thenable<void> {
    return this.saveCustomDocumentAs(document, document.uri, cancellation);
  }

  public async saveCustomDocumentAs(
    document: TariFlowDocument,
    destination: vscode.Uri,
    cancellation: vscode.CancellationToken,
  ): Promise<void> {
    const entries = [...this.webviews.get(document.uri)];
    if (!entries.length) {
      return;
    }

    const { messenger } = entries[0];
    const data = await messenger.send("getData", undefined);
    if (cancellation.isCancellationRequested) {
      return;
    }

    const encodedData = new TextEncoder().encode(data);
    await vscode.workspace.fs.writeFile(destination, encodedData);
  }

  public async revertCustomDocument(document: TariFlowDocument, cancellation: vscode.CancellationToken): Promise<void> {
    await document.revert();
    if (cancellation.isCancellationRequested) {
      return;
    }

    const entries = [...this.webviews.get(document.uri)];
    if (!entries.length) {
      return;
    }

    const { messenger } = entries[0];
    await TariFlowEditorProvider.initDocument(document, messenger);
  }

  public async backupCustomDocument(
    document: TariFlowDocument,
    context: vscode.CustomDocumentBackupContext,
    cancellation: vscode.CancellationToken,
  ): Promise<vscode.CustomDocumentBackup> {
    const destination = context.destination;

    await this.saveCustomDocumentAs(document, destination, cancellation);

    return {
      id: destination.toString(),
      delete: async () => {
        try {
          await vscode.workspace.fs.delete(destination);
        } catch {
          // noop
        }
      },
    };
  }

  public async updateColorScheme(colorTheme: vscode.ColorTheme) {
    const theme = getTheme(colorTheme);
    await Promise.all(
      [...this.webviews.webviews].map(({ messenger }) => {
        messenger.send("setTheme", theme);
      }),
    );
  }
}

interface WebViewEntry {
  readonly resource: string;
  readonly webviewPanel: vscode.WebviewPanel;
  readonly messenger: Messenger<TariFlowMessages>;
}

class WebviewCollection {
  public readonly webviews = new Set<WebViewEntry>();

  public *get(uri: vscode.Uri): Iterable<WebViewEntry> {
    const key = uri.toString();
    for (const entry of this.webviews) {
      if (entry.resource === key) {
        yield entry;
      }
    }
  }

  public add(uri: vscode.Uri, webviewPanel: vscode.WebviewPanel, messenger: Messenger<TariFlowMessages>) {
    const entry = { resource: uri.toString(), webviewPanel, messenger };
    this.webviews.add(entry);

    webviewPanel.onDidDispose(() => {
      this.webviews.delete(entry);
    });
  }
}
