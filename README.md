# 抖音无水印视频(图文)下载服务

## 📌 功能说明

- **前端页面**：提供简洁的Web界面，用户可以直接粘贴抖音分享链接进行解析。
- **多种返回格式**：支持直接重定向到无水印资源链接，或返回包含详细信息的JSON数据。
- **图文/视频支持**：能自动识别并处理视频和图文两种类型的分享链接。
- **链接复制**：解析成功后，可以一键复制无水印资源链接。
- **在线预览与下载**：
    - 支持在线播放无水印视频和预览无水印图片。
    - 提供直接的下载按钮，方便保存媒体文件。
- **流量限制模式**：
    - 可通过环境变量 `TRAFFIC_LIMIT` 开启（默认开启）。
    - 开启后，将不提供在线预览和代理下载功能，只显示资源链接，以节约服务器流量。

### 🔧 API 请求方式
- **方法**：GET
- **地址**：`https://yourdomain?url=https://v.douyin.com/xxxx/`
- **参数说明**：
    - `url`: 抖音视频分享链接
    - `data`: 启用json数据返回，请求链接如下 https://yourdomain?data&url=https://v.douyin.com/xxxx
  

### 📤 返回结果
1. 无data参数
> 返回解析后的无水印视频直链（URL）。

2. 有data参数

返回json数据结构如下
```ts
interface DouyinVideoInfo {
// ID
aweme_id: string | null;
// 评论数
comment_count: number | null;
// 点赞数
digg_count: number | null;
// 分享数
share_count: number | null;
// 收藏数
collect_count: number | null;
// 作者昵称
nickname: string | null;
// 作者签名
signature: string | null;
// 标题
desc: string | null;
// 创建时间
create_time: string | null;
// 视频链接
video_url: string | null;
// 类型
type: string | null;
// 图片链接列表
image_url_list: string[] | null;
}
```

---

## 🚀 部署方式

本项目支持多种部署方式，方便快速上线使用。

### 1. Deno Deploy 部署
- 进入 [Deno Deploy](https://dash.deno.com/) 控制台。
- 创建新项目，选择可执行文件为 [main.ts](./main.ts)。
- 部署后即可通过 HTTPS 访问服务。

### 2. Cloudflare Workers 部署
- 安装 [`denoflare`](https://github.com/skymethod/denoflare) CLI 工具。
- 在项目根目录配置 `.denoflare` 文件。
- 执行部署命令：
  ```bash
  denoflare push cfworker.ts
  ```
- 部署后到worker设置开启访问即可
- 参考文档：[Cloudflare Workers 教程](https://docs.deno.com/examples/cloudflare_workers_tutorial/)
- 如果怕麻烦或者出现其他错误，可以直接使用 [cfbuild.js](./cfbuild.js) 文件，这个是编译后的文件，可以直接部署cf worker

### 3. vercel 部署
- fork 本项目后，进入vercel dashboard导入项目
- 在环境变量中，可以添加 `TRAFFIC_LIMIT` 变量，设置为 `no` 可关闭流量限制模式（默认开启）。
- 直接点击deploy即可部署
- 部署后直接访问 https://yourdomain.vercel.app/ 即可使用前端页面。
- API 访问链接为 https://yourdomain.vercel.app/api/hello?url=https://v.douyin.com/xxxx/

### 4. docker 部署
- clone 本项目到服务器
- 构建docker镜像 `docker build -t my-deno-app .`
- 运行容器 `docker run -p 8000:8000 my-deno-app`

## 📈 Stars 趋势

[![Star History Chart](https://api.star-history.com/svg?repos=pwh-pwh/douyinVd&type=Date)](https://star-history.com/#pwh-pwh/douyinVd&Date)

