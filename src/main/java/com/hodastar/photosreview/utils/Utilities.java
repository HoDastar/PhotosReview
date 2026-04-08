package com.hodastar.photosreview.utils;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.*;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

public class Utilities {
    // 将 JSON 字符串转换为 Map<String, Object>
    // 若输入为 null/空或解析失败，返回一个空的 HashMap 而不是 null，避免调用方 NPE
    public static Map<String, Object> jsonStringToMap(String json) {
        if (json == null) {
            return new HashMap<>();
        }
        json = json.trim();
        if (json.isEmpty()) {
            return new HashMap<>();
        }
        try {
            Gson gson = new Gson();
            Type type = new TypeToken<Map<String, Object>>(){}.getType();
            Map<String, Object> map = gson.fromJson(json, type);
            return map == null ? new HashMap<>() : map;
        } catch (Exception e) {
            // 解析失败，返回空 Map；如果需要可在此处记录日志
            return new HashMap<>();
        }
    }

    public static String nowTimeString() {
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        return now.format(fmt);
    }

    // 根据每页数量和页码计算 SQL 查询的 OFFSET 和 LIMIT
    public static int[] calculateOffsetLimit(int page, int pageSize) {
        int offset = (page - 1) * pageSize;
        return new int[]{offset, pageSize};
    }
    // 从列表中获取指定页码的数据，页码从 1 开始；如果页码超出范围或列表为空，返回一个空列表
    public static <T> List<T> getListPage(List<T> list, int pageSize, int pageNum) {
        if (list == null || list.isEmpty()) {
            return new ArrayList<>();
        }

        int start = (pageNum - 1) * pageSize;
        if (start >= list.size() || start <= 0) {
            return new ArrayList<>(); // 超出范围
        }

        int end = Math.min(start + pageSize, list.size());
        return list.subList(start, end);
    }

    // 生成uuid
    public static String generateUUID() {
        return java.util.UUID.randomUUID().toString();
    }
}
