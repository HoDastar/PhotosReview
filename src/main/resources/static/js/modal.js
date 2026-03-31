function openModal(title, text) {
    const modal = document.getElementById('modal');
    const overlay = document.getElementById('modalOverlay');
    const confirmBtn = document.getElementById('confirmBtn');
    const closeBtn = document.getElementById('closeBtn');
    return new Promise((resolve) => {
        // 获取html元素
        const header = modal.querySelector('.modal-header h3');
        const body = modal.querySelector('.modal-body p');
        if (header) header.textContent = title;
        if (body) body.textContent = text;

        modal.classList.add('active');
        overlay.classList.add('active');

        const closeModal = () => {
            modal.classList.remove('active');
            overlay.classList.remove('active');

            // 清除事件监听，防止多次触发
            confirmBtn.removeEventListener('click', onConfirm);
            closeBtn.removeEventListener('click', onClose);
        };

        const onConfirm = () => {
            closeModal();
            resolve(true); // 表示用户点击了确定
        };

        const onClose = () => {
            closeModal();
            resolve(false); // 表示用户点击了关闭
        };
        confirmBtn.addEventListener('click', onConfirm);
        closeBtn.addEventListener('click', onClose);
    })
}

// 气泡弹窗
function showBubble(text, bgcolor = '#fff', fcolor = '#333') {
    const container = document.getElementById('bubbleContainer');
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;
    bubble.style.backgroundColor = bgcolor;
    bubble.style.color = fcolor;
    container.appendChild(bubble);

    // 动画结束后移除
    bubble.addEventListener('animationend', () => {
        if (bubble.style.opacity === '0' || getComputedStyle(bubble).opacity === '0') {
            bubble.remove();
        }
    });
}