package com.hodastar.photosreview.controllers;

import com.hodastar.photosreview.mappers.SystemMapper;
import com.hodastar.photosreview.utils.Respond;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/test")
public class TestAPI {
    private final SystemMapper systemMapper;

    public TestAPI(SystemMapper systemMapper) {
        this.systemMapper = systemMapper;
    }

    @GetMapping("/test1")
    public Respond<String> test1() {
        return new Respond<>(true, "测试成功", "Hello, World!");
    }

    @GetMapping("/test2")
    public Respond<List<String>> test2() {
        List<String> list = new ArrayList<>();
        for (int i = 0; i < 1000; i++) {
            list.add("Hello, World! " + i);
        }
        return new Respond<>(true, "测试成功", list);
    }

    @GetMapping("/test3")
    public Respond<String> test3() {
        return new Respond<>(true, "测试成功", systemMapper.getWebsiteName());
    }
}
