import { getVideoUrl, getVideoInfo } from "./douyin.ts";
import { serveDir } from "https://deno.land/std@0.224.0/http/file_server.ts";

// **关键第一步**: 强制 Vercel 使用 Edge Runtime
export const config = {
    runtime: 'edge',
};

// 您的 handler 函数
const handler = async (req: Request) => {
    const isTrafficLimited = (Deno.env.get("TRAFFIC_LIMIT") ?? "yes").toLowerCase() === "yes";
    const url = new URL(req.url);
    const pathname = url.pathname;

    if (pathname === "/api/download") {
        if (isTrafficLimited) {
            return new Response("因流量限制，该下载功能已禁用。", { status: 403 });
        }
        try {
            const fileUrl = url.searchParams.get("url");
            if (!fileUrl) {
                return new Response("缺少目标URL", { status: 400 });
            }

            // **关键第二步**: 准备代理请求的头
            // 将客户端（浏览器）的 Range 请求头也传递给源服务器
            const range = req.headers.get('range') || '';
            const fetchHeaders = new Headers({
                "Referer": "https://www.douyin.com/",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
            });
            if (range) {
                fetchHeaders.set('Range', range);
            }

            // 发起代理请求
            const response = await fetch(fileUrl, { headers: fetchHeaders });

            if (!response.ok) {
                return new Response(`无法获取目标内容，状态码: ${response.status}`, { status: response.status });
            }
            
            // **关键第三步**: 准备返回给客户端的响应头
            // 直接复用源服务器的响应头，这样 Content-Range, Content-Length 等都会被正确设置
            const responseHeaders = new Headers(response.headers);

            // 设置我们自己需要的头
            responseHeaders.set("Access-Control-Allow-Origin", "*");
            // 'Accept-Ranges' 告诉浏览器我们的代理支持 Range 请求
            responseHeaders.set('Accept-Ranges', 'bytes'); 

            const rawFilename = url.searchParams.get("title") ? decodeURIComponent(url.searchParams.get("title")!) : "download";
            const sanitizedFilename = rawFilename.replace(/[^\p{L}\p{N}\u4e00-\u9fa5.-_]/gu, '').substring(0, 200);
            const ext = url.searchParams.get("ext") || "mp4";
            const disposition = url.searchParams.get("disp") || "attachment";
            
            // 只有在需要强制下载时才设置 Content-Disposition
            // 对于 <video> 播放，最好不要设置它，让浏览器自行处理
            if (disposition === 'attachment') {
                const encodedFilename = encodeURIComponent(sanitizedFilename);
                responseHeaders.set("Content-Disposition", `attachment; filename="${encodedFilename}.${ext}"`);
            }
            
            // 直接用源服务器的流和状态码创建响应
            // 如果有 Range 请求，状态码会是 206 Partial Content
            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: responseHeaders,
            });

        } catch (error: any) {
            console.error('下载代理出错:', error);
            return new Response(`服务器内部错误: ${error.message}`, { status: 500 });
        }
    }
    // --- 您的其他 API 路由逻辑保持不变 ---
    else if (pathname.startsWith("/api/")) {
        if (url.searchParams.has("url")) {
            const inputUrl = url.searchParams.get("url")!;
            console.log("inputUrl:", inputUrl);
            if (url.searchParams.has("data")) {
                const videoInfo = await getVideoInfo(inputUrl);
                
                // 根据环境变量判断是否要限制流量
                const finalVideoInfo: any = { ...videoInfo, isTrafficLimited };

                if (isTrafficLimited) {
                    // 当流量受限时，不返回视频的具体链接，但保留图片链接
                    // 保留 desc 和 author 等元数据
                    // delete finalVideoInfo.video;
                    // delete finalVideoInfo.img;
                }

                return new Response(JSON.stringify(finalVideoInfo), {
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

// 同时支持 Deno Deploy (命名导出) 和 Vercel (默认导出)
export { handler };
export default handler;
