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

            const stream = new ReadableStream({
                async start(controller) {
                    const reader = response.body!.getReader();
                    try {
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) {
                                break;
                            }
                            controller.enqueue(value);
                        }
                    } catch (error) {
                        console.error("Stream pump error:", error);
                        controller.error(error);
                    } finally {
                        controller.close();
                    }
                },
            });

            return new Response(stream, {
                headers: headers,
                status: response.status,
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
    
    // Static file serving is handled by Vercel.
    // If no API route is matched, return a 404.
    return new Response("API endpoint not found.", {
        status: 404,
        headers: { "Content-Type": "text/plain" },
    });
};

export { handler };
