import { getVideoUrl, getVideoInfo } from "./douyin.ts";
import { serveDir } from "https://deno.land/std@0.224.0/http/file_server.ts";

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

            const response = await fetch(fileUrl, {
                headers: {
                    "Referer": "https://www.douyin.com/",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
                }
            });

            if (!response.ok) {
                return new Response(`无法获取目标内容，状态码: ${response.status}`, { status: response.status });
            }

            const rawFilename = url.searchParams.get("title") ? decodeURIComponent(url.searchParams.get("title")!) : "download";
            // Strictest sanitization: keep only letters, numbers, and Chinese characters.
            let sanitizedFilename = rawFilename.replace(/[^\p{L}\p{N}\u4e00-\u9fa5]/gu, '');

            // Truncate to a safe length (e.g., 200 characters) to avoid issues with max path length.
            if (sanitizedFilename.length > 200) {
                sanitizedFilename = sanitizedFilename.substring(0, 200);
            }

            const ext = url.searchParams.get("ext") || "mp4";
            const disposition = url.searchParams.get("disp") || "attachment"; // 'inline' or 'attachment'

            const headers = new Headers(response.headers);
            headers.set("Access-Control-Allow-Origin", "*"); // 允许跨域请求

            if (disposition === 'attachment') {
                const encodedFilename = encodeURIComponent(sanitizedFilename);
                headers.set("Content-Disposition", `attachment; filename="${sanitizedFilename}.${ext}"; filename*=UTF-8''${encodedFilename}.${ext}`);
            }

            return new Response(response.body, {
                headers: headers,
            });
        } catch (error) {
            console.error('下载代理出错:', error);
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
    
    // Static file serving
    return serveDir(req, {
        fsRoot: "public",
        urlRoot: "",
        showDirListing: false, // Do not show directory listing
        enableCors: true,
    });
};

export { handler };