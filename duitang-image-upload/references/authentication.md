# 认证覆盖

默认行为是从本机浏览器 Cookie 数据库中寻找对 `operate.duitang.com` 有效的 `dt_auth` Cookie。CLI 支持 macOS 上的 Chrome、Edge、Arc 和 Chromium，并通过系统钥匙串解密浏览器 Cookie。请求只携带 `dt_auth`，不会把其他 Cookie 带到上传接口。

## 自动发现失败时

先读取 CLI 的错误码，不把所有认证失败解释为“用户未登录”。

| 错误码 | 证据与下一步 |
| --- | --- |
| `AUTH_BROWSER_ACCESS_DENIED` | 浏览器目录或文件返回 `EPERM`/`EACCES`。请用户在 macOS 中允许当前运行 CLI 的终端/应用读取对应浏览器数据；权限实际生效后再重试。 |
| `AUTH_BROWSER_READ_FAILED` | 浏览器目录或文件读取发生其他错误。按输出路径和错误类型检查，不先要求重新登录。 |
| `AUTH_COOKIE_DATABASE_READ_FAILED` | Cookie 数据库读取或解析失败。检查读取权限、数据库锁及 sqlite3 可用性；这不能证明 Cookie 不存在。 |
| `AUTH_KEYCHAIN_UNAVAILABLE` | 钥匙串条目不可用、被锁、访问被拒或超时。请用户检查系统钥匙串授权提示；不能据此判断登录状态。 |
| `AUTH_COOKIE_DECRYPT_FAILED` | 找到了加密的有效期内 Cookie，但解密失败。检查浏览器加密格式兼容性，或使用用户主动提供的本地认证配置。 |
| `AUTH_BROWSER_PROFILE_NOT_FOUND` | 可读取的已支持浏览器位置中未发现 Cookie 数据库。确认用户使用的浏览器与个人配置位置。 |
| `AUTH_COOKIE_NOT_FOUND` | 没有可用凭据。自动发现路径已完成读取时，再检查目标域名、浏览器配置与有效期；显式配置路径则检查配置是否包含有效 `dt_auth`。 |

权限说明：聊天中的“允许”只是操作授权，不能替代 macOS 的实际权限授予。不要用 `sudo`、修改 Cookie 数据库权限、重置 TCC 或绕过系统隐私限制解决问题。只做只读诊断，输出阶段、错误码、配置位置和是否存在有效条目，不输出 Cookie 值、解密结果或钥匙串密码。

CLI 会继续检查其他支持的浏览器配置；找到可用凭据则正常上传。若没有可用凭据且存在读取失败，优先报告读取失败，而不是未找到 Cookie。相同条件下失败后，等待权限、配置或浏览器状态明确改变再重试。

完成条件：同一 CLI 在实际权限环境下成功读取凭据并返回稳定 CDN URL。仅文档修改、用户口头授权或诊断测试通过，不算真实上传完成。若系统权限仍受限，明确报告阻塞，保留待上传文件；也可请用户手动上传并提供稳定 CDN URL，不要求把 Cookie 发到聊天里。

## 显式认证覆盖

自动发现不可用时，可使用环境变量：

```bash
export DUITANG_UPLOAD_COOKIE='dt_auth=...'
export DUITANG_UPLOAD_HOST='operate.duitang.com'
```

也可以显式传入配置：

```bash
node <skill-dir>/scripts/duitang-upload.mjs \
  /absolute/path/image.png \
  --config /absolute/path/upload-config.json
```

```json
{
  "host": "operate.duitang.com",
  "cookie": "dt_auth=...",
  "bucket": "dt-img",
  "ossName": "jd"
}
```

显式配置优先于环境变量，环境变量优先于自动发现。配置是调用方主动提供的覆盖入口，CLI 不会在项目中自动查找、创建或修改认证文件。
