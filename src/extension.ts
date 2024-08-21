import * as vscode from "vscode";
import { AuthProvider } from "./authProvider";
import { AUTH_NAME, AUTH_PROVIDER_ID } from "./constants";

export async function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "auth-provider-example" is now active!');

  const provider = new AuthProvider(context);
  context.subscriptions.push(
    vscode.authentication.registerAuthenticationProvider(AUTH_PROVIDER_ID, AUTH_NAME, provider, {
      supportsMultipleAccounts: false,
    }),
  );

  // trigger initial auth state
  await vscode.authentication.getSession(AUTH_PROVIDER_ID, [], { createIfNone: false });

  vscode.authentication.onDidChangeSessions(async (e) => {
    console.warn("onDidChangeSessions", e);
    await vscode.authentication.getSession(AUTH_PROVIDER_ID, [], { createIfNone: false });
  });
}

// This method is called when your extension is deactivated
export function deactivate() {}
