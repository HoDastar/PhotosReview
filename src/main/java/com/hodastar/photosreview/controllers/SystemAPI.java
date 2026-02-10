package com.hodastar.photosreview.controllers;

import com.hodastar.photosreview.config.Config;
import com.hodastar.photosreview.mappers.SystemMapper;
import com.hodastar.photosreview.utils.Respond;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/system")
public class SystemAPI {

    private final SystemMapper systemMapper;
    private final Config config;

    public SystemAPI(SystemMapper systemMapper, Config config) {
        this.systemMapper = systemMapper;
        this.config = config;
    }

    @RequestMapping("/get_website_info")
    public Respond<Map<String, Object>> getWebsiteInfo() {
        Map<String, Object> data = new HashMap<>();
        data.put("website_name", config.WEBSITE_NAME);
        data.put("website_icon", config.WEBSITE_ICON);
        data.put("website_url", config.WEBSITE_URL);
        return new Respond<>(true, "true", data);
    }
}
