# @kurenai-studio/openpaas

OpenPaaS publishing for Cocos `openpaas` builds.

The sudv2 builder plugin already creates the game, fetches the package context, signs with `sud-package-sign-tool`, and uploads. This package ships that plugin and checks the PinK token before kurenai starts the build.

kurenai installs it on demand. `kurenai publish --platform openpaas` fetches it into `~/.kurenai/addons` and installs the plugin into `packages/platforms/sudv2`. Override the spec with `KURENAI_OPENPAAS_PACKAGE`.

## Credentials

Token order matches the plugin: the publish option, then `OPENPAAS_ACCESS_TOKEN`, then `SUD_ACCESS_TOKEN`.

Upload environment: the option, then `OPENPAAS_UPLOAD_ENV`, then `SUD_UPLOAD_ENV`, otherwise `prod`.

| Environment | Base URL |
|---|---|
| dev | `https://dev-agent-api.s00.tech` |
| fat | `https://fat-agent-api.s00.tech` |
| prod | `https://cn-000-agent-api.s01.tech` |

`OPENPAAS_UPLOAD_BASE_URL` replaces that table.

`kurenai-openpaas credentials` prints the environment and base URL. It does not print the token.

Review and launch stay on the OpenPaaS API (`submit_review`, `launch`). The plugin's publish hook is empty.
