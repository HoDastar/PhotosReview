package com.hodastar.photosreview.utils;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.lang.reflect.Type;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

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

    // 生成uuid
    public static String generateUUID() {
        return java.util.UUID.randomUUID().toString();
    }

    // gain the extension of a filename string (eg. "example.jpg" -> "jpg")
    public static String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex == -1 || lastDotIndex == filename.length() - 1) {
            return ""; // 没有扩展名或扩展名为空
        }
        return filename.substring(lastDotIndex + 1);
    }
}
