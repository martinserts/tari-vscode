import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { Message, Messenger, WebViewMessages } from "tari-extension-common";

const vscode = acquireVsCodeApi();
const messenger = new Messenger<WebViewMessages>({
  sendMessage: (msg) => {
    vscode.postMessage(msg);
  },
  onMessage: (callback) => {
    window.addEventListener("message", (event: MessageEvent<unknown>) => {
      if ("data" in event) {
        callback(event.data as Message<WebViewMessages>);
      }
    });
  },
});

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}
createRoot(rootElement).render(
  <StrictMode>
    <App messenger={messenger} />
  </StrictMode>,
);
