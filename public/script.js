document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('douyin-url');
    const parseBtn = document.getElementById('parse-btn');
    const resultArea = document.getElementById('result-area');

    parseBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        if (!url) {
            alert('请输入抖音链接！');
            return;
        }

        resultArea.innerHTML = '<p>正在解析中，请稍候...</p>';

        try {
            const response = await fetch(`/api/hello?data&url=${encodeURIComponent(url)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            renderResult(data);
        } catch (error) {
            console.error('解析失败:', error);
            resultArea.innerHTML = `<p style="color: red;">解析失败，请检查链接或稍后再试。</p>`;
        }
    });

    function renderResult(data) {
        if (!data) {
            resultArea.innerHTML = `<p style="color: red;">未能获取到有效数据。</p>`;
            return;
        }

        let mediaHtml = '';
        if (data.type === 'video' && data.video_url) {
            mediaHtml = `
                <div class="media-container">
                    <video controls src="${data.video_url}" preload="metadata"></video>
                    <a href="${data.video_url}" download class="download-link">下载视频</a>
                </div>
            `;
        } else if (data.type === 'img' && data.image_url_list && data.image_url_list.length > 0) {
            mediaHtml = `
                <div class="media-container">
                    <h3>图集预览</h3>
                    <div class="image-gallery">
                        ${data.image_url_list.map(imgUrl => `<a href="${imgUrl}" target="_blank"><img src="${imgUrl}" alt="抖音图片"></a>`).join('')}
                    </div>
                     ${data.image_url_list.map((imgUrl, index) => `<a href="${imgUrl}" download="image_${index + 1}.jpeg" class="download-link">下载图片 ${index + 1}</a>`).join(' ')}
                </div>
            `;
        }

        const infoHtml = `
            <div class="info-grid">
                <div class="info-item"><h3>作者</h3><p>${data.nickname || 'N/A'}</p></div>
                <div class="info-item"><h3>标题</h3><p>${data.desc || 'N/A'}</p></div>
                <div class="info-item"><h3>点赞数</h3><p>${data.digg_count || 0}</p></div>
                <div class="info-item"><h3>评论数</h3><p>${data.comment_count || 0}</p></div>
                <div class="info-item"><h3>收藏数</h3><p>${data.collect_count || 0}</p></div>
                <div class="info-item"><h3>分享数</h3><p>${data.share_count || 0}</p></div>
            </div>
        `;

        resultArea.innerHTML = infoHtml + mediaHtml;
    }
});