---
name: duitang-image-upload
description: Upload local images, videos, or audio files to Duitang CDN with a manifest-driven CLI. Use for stable Duitang URLs, batch upload, validation, cache reuse, or resuming an unfinished confirmation.
---

# 堆糖文件上传

使用 skill 自带的公司通用 CLI。它只接收已经落盘的本地文件，只输出稳定堆糖 CDN URL，不下载来源文件，也不修改业务代码。

## 执行

先读 [manifest.md](references/manifest.md)，然后运行：

```bash
node <skill-dir>/scripts/duitang-upload.mjs \
  --manifest /absolute/path/assets.json \
  --out /absolute/path/result.json
```

普通命令默认上传。只检查 manifest、文件、认证和缓存时增加 `--validate`。默认并发数是 4，默认缓存目录是 `~/.duitang-upload-cli/cache`；仅在任务需要隔离时使用 `--concurrency` 或 `--cache-dir` 覆盖。

## 认证

默认后台是 `operate.duitang.com`。CLI 自动查找本机 Chrome、Edge、Arc 或 Chromium 中对该域名有效的 Cookie，不要求项目配置文件，也不修改项目 `.gitignore`。

需要覆盖 host 或 Cookie，或者自动发现失败时，读 [authentication.md](references/authentication.md)。Cookie 只发送给 token 和 confirm 接口，不发送给签名 PUT URL；任何输出、缓存和日志都不得包含 Cookie、token 或签名 URL。

## 完成

- 读取 result JSON，而不是从终端文本猜测 URL。
- `failed` 或 `pending_confirm` 会让进程非零退出，但其他文件继续处理。
- 再次运行同一 manifest 会复用成功缓存；`pending_confirm` 只重试 confirm，不重复 PUT。
- 只有获准上传的本地文件才能进入 manifest。真实上传目标未获批准时只运行 `--validate`。
