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
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

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

    // 检查文件是否为图片类型
    public static Boolean isValidImg(String extension) {
        // check file extension (only allow jpg/jpeg/png/webp)
        if (!extension.equalsIgnoreCase("jpg") && !extension.equalsIgnoreCase("jpeg") && !extension.equalsIgnoreCase("png") && !extension.equalsIgnoreCase("webp")) {
            return false;
        }
        return true;
    }

    // 存储单个 MultipartFile 到指定目录，若目录不存在则创建
    public static void saveMultipartFile(MultipartFile file, String dirStr, String fileName) {
        File dir = new File(dirStr);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        File dest = new File(dirStr, fileName);

        try {
            file.transferTo(dest);
        } catch (Exception e) {
            e.printStackTrace();
        }

    }

    public static void saveDocumentFile(String content, String dirStr, String fileName) {
        File dir = new File(dirStr);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        File dest = new File(dirStr, fileName);

        try {
            Files.write(dest.toPath(), content.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static String readDocumentFile(String dirStr) {
        Path path = new File(dirStr).toPath();

        try {
            return Files.readString(path, StandardCharsets.UTF_8);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public static void renameDir(String oldDir, String newDir) throws IOException {
        if (Objects.equals(oldDir, newDir)) {
            return;
        }
        Path oldPath = Paths.get(oldDir);
        Path newPath = Paths.get(newDir);
        Files.move(oldPath, newPath, StandardCopyOption.REPLACE_EXISTING);
    }

    public static Boolean deleteFile(String dirStr, String fileName) throws IOException {
        Path dir = Paths.get(dirStr + fileName);
        return Files.deleteIfExists(dir);
    }
}
