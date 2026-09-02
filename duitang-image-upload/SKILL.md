---
name: duitang-image-upload
description: Upload local images, videos, or audio files to Duitang CDN. Use for stable Duitang URLs, ordered batch upload, cache reuse, or resuming an unfinished confirmation.
---

# 堆糖文件上传

使用 skill 自带的公司通用 CLI。它接收已经落盘的本地文件，stdout 只输出稳定堆糖 CDN URL，不下载来源文件，也不修改业务代码。

## 执行

```bash
node <skill-dir>/scripts/duitang-upload.mjs /absolute/path/a.png /absolute/path/b.mp4
```

可传一个或多个绝对或相对文件路径；目录和 URL 不可作为输入，glob 由 shell 展开。默认并发数是 4，默认缓存目录是 `~/.duitang-upload-cli/cache`；仅在任务需要隔离时使用 `--concurrency` 或 `--cache-dir` 覆盖。

## 认证

默认后台是 `operate.duitang.com`。CLI 自动查找本机 Chrome、Edge、Arc 或 Chromium 中对该域名有效的 Cookie，不要求项目配置文件，也不修改项目 `.gitignore`。

需要覆盖 host 或 Cookie，或者自动发现失败时，读 [authentication.md](references/authentication.md)。Cookie 只发送给 token 和 confirm 接口，不发送给签名 PUT URL；任何输出、缓存和日志都不得包含 Cookie、token 或签名 URL。

## 完成

- 从 stdout 逐行读取 CDN URL；顺序与输入参数一致，同一文件重复传入会重复输出。
- stderr 只承载失败文件和错误；任一文件失败或等待 confirm 时进程非零退出，其他文件继续处理。
- 再次上传同一文件会复用成功缓存；`pending_confirm` 只重试 confirm，不重复 PUT。
- 只有获准上传的本地文件才能作为参数。未获准真实上传时不要执行 CLI。
