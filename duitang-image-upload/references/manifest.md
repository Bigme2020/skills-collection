# Manifest 与结果

## 输入

路径相对 manifest 文件所在目录解析。每个 `id` 必须唯一。

```json
{
  "schemaVersion": 1,
  "files": [
    { "id": "header-logo", "path": "./assets/logo.png" },
    { "id": "intro-video", "path": "./assets/intro.mp4", "kind": "video" }
  ]
}
```

CLI 根据文件字节检测 MIME 和类型。`kind` 只在异常文件需要校正时使用，可选值为 `image`、`video`、`audio`，并且必须与检测结果一致。加密上传返回 `UNSUPPORTED_ENCRYPTED_UPLOAD`。

Manifest 只接受本地相对路径，不接受下载 URL、上传参数或 `targetEnvironment`。

## 结果

```json
{
  "schemaVersion": 1,
  "status": "partial_failure",
  "items": [
    {
      "id": "header-logo",
      "path": "./assets/logo.png",
      "sha256": "...",
      "status": "success",
      "mimeType": "image/png",
      "kind": "image",
      "width": 720,
      "height": 160,
      "url": "https://..."
    },
    {
      "id": "intro-video",
      "path": "./assets/intro.mp4",
      "status": "failed",
      "error": {
        "code": "UPLOAD_HTTP_403",
        "message": "Upload request returned HTTP 403."
      }
    }
  ]
}
```

Item 状态包括 `validated`、`success`、`cached`、`pending_confirm` 和 `failed`。顶层状态包括 `success`、`partial_failure` 和 `failure`。

缓存键由文件 SHA-256 和实际上传目标组成。实际目标包含 host、bucket、oss name 和上传类型。结果与缓存只保存稳定 URL 和非敏感恢复信息。
