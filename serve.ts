import { getVideoUrl, getVideoInfo } from "./douyin.ts";
import { serveDir } from "https://deno.land/std@0.224.0/http/file_server.ts";

const handler = async (req: Request) => {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // API requests
    if (pathname.startsWith("/api/")) {
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