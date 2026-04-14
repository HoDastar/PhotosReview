package com.hodastar.photosreview.utils;

import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Objects;

public class FileUtil {

    // gain the extension of a filename string (e.g. "example.jpg" -> "jpg")
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

    // 保存文本内容到指定目录和文件名，若目录不存在则创建；如果保存失败会打印异常堆栈但不抛出异常
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

    // 读取文件内容为字符串，若文件不存在或读取失败会打印异常堆栈并返回 null
    public static String readDocumentFile(String dirStr) {
        Path path = new File(dirStr).toPath();

        try {
            return Files.readString(path, StandardCharsets.UTF_8);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    // 重命名目录，如果新旧目录相同则不执行任何操作；如果重命名失败会抛出 IOException
    public static void renameDir(String oldDir, String newDir) throws IOException {
        if (Objects.equals(oldDir, newDir)) {
            return;
        }
        Path oldPath = Paths.get(oldDir);
        Path newPath = Paths.get(newDir);
        Files.move(oldPath, newPath, StandardCopyOption.REPLACE_EXISTING);
    }

    // 删除文件；如果删除失败会抛出 IOException
    public static void deleteFile(String dirStr, String fileName) throws IOException {
        Path dir = Paths.get(dirStr + fileName);
        Files.deleteIfExists(dir);
    }
}
