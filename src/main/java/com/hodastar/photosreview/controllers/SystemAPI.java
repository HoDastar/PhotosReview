package com.hodastar.photosreview.controllers;

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

    public SystemAPI(SystemMapper systemMapper) {
        this.systemMapper = systemMapper;
    }

    @RequestMapping("/get_website_info")
    public Respond<Map<String, Object>> getWebsiteInfo() {
        Map<String, Object> data = new HashMap<>();
        data.put("website_name", systemMapper.getWebsiteName());
        return new Respond<>(true, "true", data);
    }
}
