#!/usr/bin/env node
/**
 * kurenai-openpaas credentials
 * kurenai-openpaas plugin info
 * kurenai-openpaas plugin install <cocosCliRoot>
 *
 * credentials prints whether a token is present, plus the upload environment and base URL.
 * It never prints the token.
 */
import { assertCredentials, installPlugin, pluginInfo } from "../lib/index.js";

const [command, action, arg] = process.argv.slice(2);

function print(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

try {
  if (command === "credentials") {
    const creds = assertCredentials();
    print({ ok: true, hasToken: true, uploadEnv: creds.uploadEnv, baseUrl: creds.baseUrl });
  } else if (command === "plugin" && action === "info") {
    const info = pluginInfo();
    print({ ok: true, ...info });
  } else if (command === "plugin" && action === "install" && arg) {
    print({ ok: true, ...installPlugin(arg) });
  } else {
    print({
      ok: false,
      error: "usage: kurenai-openpaas credentials | plugin info | plugin install <cocosCliRoot>",
    });
    process.exitCode = 1;
  }
} catch (error) {
  print({ ok: false, error: error instanceof Error ? error.message : String(error) });
  process.exitCode = 1;
}
