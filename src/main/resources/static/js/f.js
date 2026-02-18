(async () => {
    // 获取origin
    const baseUrl = window.location.origin;
    // 获取网页config
    const config = await getApi(baseUrl + "/api/system/get_website_info");
    if (config.result === false) {
        console.log("获取网站信息失败，使用默认配置");
        config.data = {
            "website_name": "Photo Review System",
            "website_icon": "data/icon/default_icon.png",
            "website_url": baseUrl
        };
    }
    // 添加进local
    localStorage.setItem("website_info", JSON.stringify(config.data));
})()