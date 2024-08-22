import * as vscode from "vscode";
import { STORAGE_KEY } from "./constants";

const TEST_SESSION: vscode.AuthenticationSession = {
  id: "test-session",
  accessToken: "test-access-token",
  account: { id: "test-account-id", label: "test-account" },
  scopes: [],
};

export class AuthProvider implements vscode.AuthenticationProvider {
  // tells VS Code which sessions have been added, removed, or changed
  private _onDidChangeSessions =
    new vscode.EventEmitter<vscode.AuthenticationProviderAuthenticationSessionsChangeEvent>();
  get onDidChangeSessions() {
    return this._onDidChangeSessions.event;
  }

  constructor(private readonly context: vscode.ExtensionContext) {
    // watch for changes to the secret, which is persistent and available across windows/workspaces
    context.secrets.onDidChange(async (e) => {
      if (e.key === STORAGE_KEY) {
        const secret = await context.secrets.get(STORAGE_KEY);
        if (secret) {
          // user logged in (secret was added)
          this._onDidChangeSessions.fire({ added: [TEST_SESSION], removed: [], changed: [] });
        } else {
          // user logged out (secret was removed)
          this._onDidChangeSessions.fire({ added: [], removed: [TEST_SESSION], changed: [] });
        }
      }
    });
  }

  async createSession(scopes: string[]): Promise<vscode.AuthenticationSession> {
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Logging in...",
      },
      async () => {
        // NOTE: this is where you would implement your auth flow and take advantage of the scopes,
        // as well as implement any additional steps like MFA, URI handling, etc.

        // simulate some network latency / time to complete an auth flow
        await new Promise((resolve) => setTimeout(resolve, 3000));

        await this.context.secrets.store(STORAGE_KEY, JSON.stringify(TEST_SESSION));
        this._onDidChangeSessions.fire({ added: [TEST_SESSION], removed: [], changed: [] });

        vscode.window.showInformationMessage("Session created");
      },
    );

    return TEST_SESSION;
  }

  public async getSessions(scopes?: string[]): Promise<readonly vscode.AuthenticationSession[]> {
    const sessionStr = await this.context.secrets.get(STORAGE_KEY);
    if (sessionStr) {
      return [JSON.parse(sessionStr)];
    }
    return [];
  }

  public async removeSession(sessionId: string): Promise<void> {
    await this.context.secrets.delete(STORAGE_KEY);
    this._onDidChangeSessions.fire({ added: [], removed: [TEST_SESSION], changed: [] });
  }
}
