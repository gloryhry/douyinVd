document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('douyin-url');
    const parseBtn = document.getElementById('parse-btn');
    const resultArea = document.getElementById('result-area');
    const loader = document.querySelector('.loader-container');

    function extractFirstUrl(text) {
        if (!text) return null;
        const urlRegex = /(https?:\/\/[^\s"'<>`]+)/;
        const match = text.match(urlRegex);
        return match ? match[0] : null;
    }

    const handleParse = async () => {
        const inputText = urlInput.value.trim();
        const url = extractFirstUrl(inputText);

        if (!url) {
            showAlert('未在输入内容中找到有效链接！', 'danger');
            return;
        }

        resultArea.innerHTML = ''; // Clear previous results
        loader.style.display = 'flex'; // Show loader

        try {
            const response = await fetch(`/api/hello?data&url=${encodeURIComponent(url)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            renderResult(data);
        } catch (error) {
            console.error('解析失败:', error);
            showAlert('解析失败，请检查链接或稍后再试。', 'danger');
        } finally {
            loader.style.display = 'none'; // Hide loader
        }
    };

    parseBtn.addEventListener('click', handleParse);

    urlInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleParse();
        }
    });

        function sanitizeFilename(filename) {
        if (!filename) return '';
        // 仅保留中文字符、字母、数字、以及 . _ -
        const sanitized = filename.replace(/[^\p{L}\p{N}\u4e00-\u9fa5._-]/gu, '');
        // 截断为 200 个字符
        return sanitized.substring(0, 20);
    }

    function renderResult(data) {
        if (!data) {
            showAlert('未能获取到有效数据。', 'danger');
            return;
        }

        const isLimited = data.isTrafficLimited;
        let mediaHtml = '';

        if (data.type === 'video' && data.video_url) {
            const title = sanitizeFilename(data.desc || "douyin_video");
            const videoUrl = data.video_url;
            
            // This part is for displaying the original link, which should always be shown.
            const urlContainerHtml = `
                <div class="media-container">
                    <h3>视频链接<span id="copy-status"></span></h3>
                    <div class="url-display">
                        <input type="text" id="video-url-text" value="${videoUrl}" readonly class="url-input">
                        <button id="copy-url-btn" class="copy-button">复制</button>
                    </div>
                </div>
            `;
            
            mediaHtml = urlContainerHtml; // Always show the URL container.

            // Only show video player and download link if traffic is NOT limited.
            if (!isLimited) {
                const videoProxyUrl = `/api/download?url=${encodeURIComponent(data.video_url)}&title=${encodeURIComponent(title)}&ext=mp4&disp=inline`;
                const downloadUrl = `/api/download?url=${encodeURIComponent(data.video_url)}&title=${encodeURIComponent(title)}&ext=mp4&disp=attachment`;
                mediaHtml += `
                <div class="media-container">
                    <video controls src="${videoProxyUrl}" preload="metadata"></video>
                    <a href="${downloadUrl}" class="download-link" download="${title}.mp4">下载视频</a>
                </div>
            `;
            }
        } else if (data.type === 'img' && data.image_url_list && data.image_url_list.length > 0) {
            const title = sanitizeFilename(data.desc || "douyin_image");
            // 当流量受限时，仅显示图片链接列表
            if (isLimited) {
                mediaHtml = `
                <div class="media-container">
                    <h3>图片链接<span id="copy-status"></span></h3>
                    <div class="url-list-container">
                        ${data.image_url_list.map((imgUrl, index) => `
                            <div class="url-display">
                                <input type="text" id="image-url-text-${index}" value="${imgUrl}" readonly class="url-input">
                                <button class="copy-button" data-url="${imgUrl}" data-index="${index}">复制</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
                `;
            } else {
                // 非受限情况下，显示图集预览和下载链接
                mediaHtml = `
                <div class="media-container">
                    <h3>图集预览</h3>
                    <div class="image-gallery">
                        ${data.image_url_list.map(imgUrl => {
                            const imgProxyUrl = `/api/download?url=${encodeURIComponent(imgUrl)}&disp=inline`;
                            return `<a href="${imgProxyUrl}" target="_blank"><img src="${imgProxyUrl}" alt="抖音图片"></a>`;
                        }).join('')}
                    </div>
                    <div class="download-links-container">
                     ${data.image_url_list.map((imgUrl, index) => {
                        const downloadUrl = `/api/download?url=${encodeURIComponent(imgUrl)}&title=${encodeURIComponent(title)}_${index + 1}&ext=jpeg&disp=attachment`;
                        return `<a href="${downloadUrl}" download="${title}_${index + 1}.jpeg" class="download-link">下载图片 ${index + 1}</a>`;
                     }).join('')}
                    </div>
                </div>
            `;
            }
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

        // The copy function should work even when limited.
        if (data.type === 'video' && data.video_url) {
            const copyBtn = document.getElementById('copy-url-btn');
            if (copyBtn) {
                copyBtn.addEventListener('click', (e) => copyToClipboard(e.target, data.video_url, false));
            }
            copyToClipboard(copyBtn, data.video_url, true);
        } else if (data.type === 'img' && data.image_url_list && data.image_url_list.length > 0 && isLimited) {
            const copyBtns = document.querySelectorAll('.copy-button');
            copyBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const url = e.target.getAttribute('data-url');
                    copyToClipboard(e.target, url, false);
                });
            });
            // Auto-copy the first image URL
            if (copyBtns.length > 0) {
                const firstUrl = copyBtns[0].getAttribute('data-url');
                copyToClipboard(copyBtns[0], firstUrl, true);
            }
        }
    }

    function copyToClipboard(buttonElement, text, isAuto = false) {
        const copyStatus = document.getElementById('copy-status');
        
        navigator.clipboard.writeText(text).then(() => {
            if (copyStatus) {
                copyStatus.textContent = isAuto ? ' (首个链接已自动复制)' : ' (已复制)';
                copyStatus.style.color = 'green';
            }
            if (buttonElement) {
                const originalText = buttonElement.textContent;
                buttonElement.textContent = '已复制!';
                setTimeout(() => {
                    buttonElement.textContent = originalText;
                }, 2000);
            }
        }).catch(err => {
            console.error('无法复制: ', err);
            if (copyStatus) {
                copyStatus.textContent = ' (自动复制失败)';
                copyStatus.style.color = 'red';
            }
            if (!isAuto) {
                showAlert('复制链接失败，您的浏览器可能不支持或未授权。', 'warning');
            }
        });
    }

    function showAlert(message, type = 'danger') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        resultArea.innerHTML = ''; // Clear any previous content
        resultArea.appendChild(alertDiv);
    }
});