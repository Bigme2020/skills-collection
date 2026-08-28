# 认证覆盖

默认行为是从本机浏览器 Cookie 数据库中寻找对 `operate.duitang.com` 有效的 `dt_auth` Cookie。CLI 支持 macOS 上的 Chrome、Edge、Arc 和 Chromium，并通过系统钥匙串解密浏览器 Cookie。请求只携带 `dt_auth`，不会把其他 Cookie 带到上传接口。

自动发现不可用时，可使用环境变量：

```bash
export DUITANG_UPLOAD_COOKIE='dt_auth=...'
export DUITANG_UPLOAD_HOST='operate.duitang.com'
```

也可以显式传入配置：

```bash
node <skill-dir>/scripts/duitang-upload.mjs \
  --manifest assets.json \
  --out result.json \
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
