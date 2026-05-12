---
name: duitang-image-upload
description: Upload local images or Lanhu slices to Duitang CDN using the backend upload flow from dt-base uploadImage. Use when the user asks to upload images or design slices, including converting local images to online URLs and replacing local or remote design assets with Duitang CDN URLs.
---

# 堆糖图片上传

当需要把本地图片、蓝湖切图或临时设计资源上传成稳定的堆糖 CDN 地址时，使用这个 skill。

## 配置

认证信息从仓库根目录的 `.duitang-upload.local.json` 读取。该文件已加入 Git 忽略，禁止提交。

首次在一个项目中使用时，必须先检查 `.gitignore` 是否包含：

```gitignore
.duitang-upload.local.json
```

如果没有，先把这一行加入 `.gitignore`，再创建或写入 `.duitang-upload.local.json`。禁止在未被 Git 忽略的配置文件中写入 Cookie。

配置文件格式：

```json
{
  "host": "operate.duitang.com",
  "cookie": "session=...; dt_auth=..."
}
```

- `host` 是后台上传域名，用于拼接 `https://<host>/operator/upload/file/...`。
- `cookie` 只发送给后台申请 token 和 confirm 接口，禁止发送到上传文件的 `upload_url`。
- 安全要求：绝对不要在回复、日志、diff 或提交文件中输出 Cookie 明文。

## 上传命令

使用 skill 自带脚本：

```bash
node .codex/skills/duitang-image-upload/scripts/upload-backend-image.mjs <image-path>
```

可选参数：

```bash
node .codex/skills/duitang-image-upload/scripts/upload-backend-image.mjs <image-path> --type OPS --bucket dt-img --host operate.duitang.com
```

脚本对齐 `dt-material/packages/dt-base/src/js/business/uploadImage.ts` 的 `backend: true` 流程：

1. POST `/operator/upload/file/generate_token_by_custom_filename/` 申请上传 token
2. PUT 文件内容到返回的 `upload_url`
3. POST `/operator/upload/file/photo/confirm/` 确认上传完成
4. 输出包含 `url`、`endpoint`、`key`、`photo_id`、`photo_width`、`photo_height` 的 JSON

失败处理要求：
- 第 1 步失败：返回错误信息并终止，不继续上传。
- 第 2 步失败：返回错误信息并终止，不执行 confirm。
- 第 3 步失败：返回错误信息并终止，标记上传未完成。

默认 `type` 是 `OPS`，适用于设计/运营类图片资源。

## 工作流

1. 检查 `.gitignore` 是否已忽略 `.duitang-upload.local.json`；没有则先补充忽略规则。
2. 检查根目录是否存在 `.duitang-upload.local.json`；没有则创建配置模板，并要求用户在本地填入真实 Cookie。
3. 确认本地图片路径存在；若路径缺失或文件不存在，直接返回明确错误信息并终止。
4. 使用脚本上传图片。
5. 从标准输出 JSON 中读取 `url` 作为最终 CDN 地址。
6. 用该 CDN 地址替换代码里的本地临时路径或第三方设计资源地址。
