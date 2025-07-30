import { getVideoUrl, getVideoInfo } from "./douyin.ts";

const handler = async (req: Request) => {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // API requests
    if (pathname === "/api/download") {
        try {
            const fileUrl = url.searchParams.get("url");
            if (!fileUrl) {
                return new Response("缺少目标URL", { status: 400 });
            }

            // 1. 获取原始响应
            const response = await fetch(fileUrl, {
                headers: {
                    Referer: "https://www.douyin.com/",
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
                },
            });

            if (!response.ok) {
                return new Response(`无法获取目标内容，状态码: ${response.status}`, {
                    status: response.status,
                });
            }

            // 2. 准备新的响应头
            // 从原始响应复制基础头部信息（如 Content-Type, Content-Length）
            const headers = new Headers(response.headers);

            // 设置我们自定义的头部
            headers.set("Access-Control-Allow-Origin", "*"); // 允许跨域
            headers.set("Cache-Control", "public, max-age=86400"); // 建议添加缓存头

            const rawFilename = url.searchParams.get("title")
                ? decodeURIComponent(url.searchParams.get("title")!)
                : "download";
            const sanitizedFilename = rawFilename
                .replace(/[^\p{L}\p{N}\u4e00-\u9fa5.-_]/gu, "")
                .substring(0, 200);
            const ext = url.searchParams.get("ext") || "mp4";
            const disposition = url.searchParams.get("disp") || "attachment";

            // 设置 Content-Disposition
            const encodedFilename = encodeURIComponent(sanitizedFilename);
            headers.set(
                "Content-Disposition",
                `${disposition}; filename="${encodedFilename}.${ext}"`
            );

            // 3. 【核心修改】直接返回一个新的响应
            //    - 主体 (body): 使用原始响应的 response.body (它本身就是 ReadableStream)
            //    - 头部 (headers): 使用我们刚刚构造的新的 headers 对象
            //    - 状态 (status): 使用原始响应的状态
            return new Response(response.body, {
                headers: headers,
                status: response.status,
                statusText: response.statusText,
            });
        } catch (error: any) {
            console.error("下载代理出错:", error);
            return new Response(`服务器内部错误: ${error.message}`, { status: 500 });
        }
    } else if (pathname.startsWith("/api/")) {
        if (url.searchParams.has("url")) {
            const inputUrl = url.searchParams.get("url")!;
            console.log("inputUrl:", inputUrl);
            if (url.searchParams.has("data")) {
                const videoInfo = await getVideoInfo(inputUrl);
                return new Response(JSON.stringify(videoInfo), {
                    headers: { "Content-Type": "application/json" },
                });
            }
            const videoUrl = await getVideoUrl(inputUrl);
            return new Response(videoUrl);
        } else {
            return new Response("请提供url参数", { status: 400 });
        }
    }

    // Static file serving is handled by Vercel.
    // If no API route is matched, return a 404.
    return new Response("API endpoint not found.", {
        status: 404,
        headers: { "Content-Type": "text/plain" },
    });
};

export { handler };
