
# sud package 签名工具

## 使用方法

### 接口设计

- **命令行接口**:

生成并签名游戏包

```text
sud-package-sign-tool
    --input <INPUT_DIR>
    --output <OUTPUT_PKG>
    [--type <TYPE>]
    [--compress <METHOD>]
    [--encrypt]
    [--cipher <CIPHER>]
    [--global-key <HEX>]
    [--private-key <PRIVATE_KEY_FILE>]
    --public-key-hash <HASH>
    [--game-id <GAME_ID>]
    [--app-version <VERSION>]
```

查看游戏包相关字段

```text
sud-package-sign-tool
    --inspect <PACKAGE_FILE>
```

验证单文件或全包

```text
sud-package-sign-tool
    --verify <PACKAGE_FILE>
    --verify-path <INTERNAL_PATH>

sud-package-sign-tool
    --verify <PACKAGE_FILE>
    --verify-all

sud-package-sign-tool
    --verify <PACKAGE_FILE>
    --verify-all
    --verify-public-key <KEY_OR_FILE>
```

签名 JSON 字符串

```text
sud-package-sign-tool
    --sign-payload <JSON>
    --sign-private-key <KEY_OR_FILE>
```

验签 JSON 字符串

```text
sud-package-sign-tool
    --verify-payload <JSON>
    --verify-public-key <KEY_OR_FILE>
    --verify-signature <SIG_OR_FILE>
```

模拟篡改包内文件内容

```text
sud-package-sign-tool
    --tamper <PACKAGE_FILE>
    --tamper-path <INTERNAL_PATH>
    --tamper-input <REPLACEMENT_FILE>
```

生成 Ed25519 私钥

```text
sud-package-sign-tool
    --gen-key <PRIVATE_KEY_FILE>
    [--gen-key-format <hex|base64|raw>]
```

查看工具版本

```text
sud-package-sign-tool
    --version
```

解密并导出单个文件

```text
sud-package-sign-tool
    --decrypt <PACKAGE_FILE>
    --decrypt-path <INTERNAL_PATH>
    --decrypt-output <OUTPUT_FILE>
```

解密并导出整个包

```text
sud-package-sign-tool
    --decrypt <PACKAGE_FILE>
    --decrypt-all
    --decrypt-output-dir <OUTPUT_DIR>
```

### 参数说明

- `--input <INPUT_DIR>`: 游戏包目录，必须包含 `manifest.json` 与资源文件。
- `--output <OUTPUT_PKG>`: 输出包路径，通常以 `.sudpkg` 结尾。
- `--type <TYPE>`: 包类型，`0` 未知，`1` 完整包，`2` 首包，`3` 分包，`4` 插件包。
- `--compress <METHOD>`: 压缩算法，支持 `store` / `deflate` / `zstd` / `brotli`。
- `--encrypt`: 开启加密，必须同时提供 `--global-key`。
- `--cipher <CIPHER>`: 加密算法，支持 `aes-128-ctr` / `chacha20`。
- `--global-key <HEX>`: 全局密钥 hex 字符串，AES-128 需要 16 字节，ChaCha20 需要 32 字节。
- `--private-key <PRIVATE_KEY_FILE>`: Ed25519 私钥文件，支持 raw / hex / base64 / pkcs8（PEM/DER）。
- `--public-key-hash <HASH>`: 公钥 SHA256 值（raw 32 字节公钥的 hash，hex/base64），打包必填，用于校验私钥对应公钥。
- `--game-id <GAME_ID>`: 手动指定 gameId。`type=3` 必填。
- `--app-version <VERSION>`: 手动指定版本号。`type=3` 必填。
- `--inspect <PACKAGE_FILE>`: 打印 EOCD/CD/Signing Block 解析信息。
- `--verify <PACKAGE_FILE>`: 校验包签名，需配合 `--verify-path` 或 `--verify-all`。
- `--verify-path <INTERNAL_PATH>`: 包内文件路径，例如 `scripts/main.js`。
- `--verify-public-key <KEY_OR_FILE>`: 用于 `--verify` 和 `--verify-payload` 的 Ed25519 公钥。
  - 最终解析结果必须是 **32 字节原始公钥**。
  - 支持直接传入 `base64` 字符串。
  - 支持直接传入 `hex` 字符串。
  - 支持传入文件路径。
  - 如果传入的是文件，工具会依次按 `hex`、`base64`、原始二进制解析文件内容。
  - 不支持直接传入 PEM / X.509 公钥内容，例如 `-----BEGIN PUBLIC KEY-----`。
  - 如果公钥来自 `public_x509.pem`，需要先提取其中的 32 字节原始公钥，再作为 `--verify-public-key` 的值传入。
  - 可使用以下命令从 PEM 提取 `base64` 格式公钥：

    ```bash
    openssl pkey -pubin -in public_x509.pem -outform DER | tail -c 32 | openssl base64 -A
    ```

  - 将上面命令输出的 `base64` 字符串作为 `--verify-public-key` 的值即可。
- `--verify-all`: 校验包内全部文件。
- `--tamper <PACKAGE_FILE>`: 原地篡改包内文件内容（仅 Store + 非加密）。
- `--tamper-path <INTERNAL_PATH>`: 包内文件路径。
- `--tamper-input <REPLACEMENT_FILE>`: 新内容文件路径。
- `--decrypt <PACKAGE_FILE>`: 解密单个文件并导出。
- `--decrypt-path <INTERNAL_PATH>`: 包内文件路径。
- `--decrypt-output <OUTPUT_FILE>`: 解密后输出文件路径。
- `--decrypt-all`: 解密包内全部文件。
- `--decrypt-output-dir <OUTPUT_DIR>`: 解密后输出目录（配合 `--decrypt-all`）。
- `--sign-payload <JSON>`: 对 JSON 字符串签名并输出结果。
- `--sign-private-key <KEY_OR_FILE>`: 签名私钥（hex/base64/raw/pkcs8 或文件路径）。
- `--verify-payload <JSON>`: 对 JSON 字符串进行验签。
- `--verify-signature <SIG_OR_FILE>`: 签名结果（hex/base64 或文件路径）。
- `--gen-key <PRIVATE_KEY_FILE>`: 生成 Ed25519 私钥文件。
- `--gen-key-format <FORMAT>`: 私钥格式，`hex` / `base64` / `raw`。

### 异常处理

- **退出码规范**:
  - `0`: 成功
  - `1`: 命令行参数错误
  - `2`: I/O 错误
  - `3`: 加密/签名/校验错误
- **输入验证**:
  - 输入目录不存在或不可读时，直接报错并退出。
  - 输出路径所在目录不可写时，直接报错并退出。
  - 公钥 Hash 与私钥不匹配: 报错 “public key hash mismatch”。
  - **返回**: 退出码 **1**，错误前缀 `Invalid arguments:`。
- **Manifest 校验**:
  - `manifest.json` 为空或不存在: 报错 “manifest.json is empty / not found”。
  - `manifest.json` 不是 JSON Object: 报错 “manifest.json must be a JSON object”。
  - 缺少 `gameId` 或 `version`: 报错 “manifest.json missing gameId/version”。
  - `gameId` / `version` 为空或包含空白字符: 报错 “gameId/version is empty or contains whitespace”。
  - `type=3` 分包: 必须通过 `--game-id` 与 `--app-version` 提供。
  - `type=4` 插件包: 读取 `package.json`，使用 `name` 作为 gameId，`version` 作为版本号。
  - **返回**:
    - 结构错误/JSON 解析失败: 退出码 **2**，错误前缀 `Format error:`。
    - 字段缺失/空值/空白: 退出码 **1**，错误前缀 `Invalid arguments:`。
- **文件 I/O 错误**:
  - 读取文件失败、写入失败、权限不足、路径非法等，直接报错并退出。
  - 退出码统一为 **2**。
- **签名失败**:
  - 私钥格式不正确或长度不对: 报错并退出。
  - 签名过程异常: 报错并退出。
  - 退出码统一为 **3**。
- **加密失败**:
  - `--encrypt` 但缺少 `--global-key`: 报错并退出。
  - 密钥长度不匹配算法: 报错并退出。
  - 加解密过程异常: 报错并退出。
  - 退出码统一为 **3**。
- **验证失败**:
  - Signing Block 缺失或顺序错误: 报错并退出。
  - 指定公钥与包内 SUD2 公钥不一致: 报错并退出。
  - 签名校验失败: 报错并退出。
  - Merkle Root 不一致: 报错并退出。
  - Payload 验签失败: 报错并退出。
  - 退出码统一为 **3**（Verification failed）。
