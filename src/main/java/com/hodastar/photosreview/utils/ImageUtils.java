package com.hodastar.photosreview.utils;

import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.Metadata;
import com.drew.metadata.exif.ExifIFD0Directory;
import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.*;
import java.awt.geom.AffineTransform;
import java.awt.image.AffineTransformOp;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.util.Iterator;

public class ImageUtils {
    private static int convertToWebpTaskCount = 0;
    private static int convertToThumbnailTaskCount = 0;

    public static void createThumbnail(String sourceStr, String targetStr, String filename, int width, int height) throws Exception {
        if (convertToThumbnailTaskCount >= 8) {
            throw new RuntimeException("当前转换任务过多，请稍后再试");
        }
        convertToThumbnailTaskCount += 1;

        try {
            File sourceD = new File(sourceStr);
            File targetD = new File(targetStr);
            if (!sourceD.exists()) {
                throw new IOException("源文件不存在: " + sourceD.getAbsolutePath());
            }
            if (!targetD.exists()) {
                targetD.mkdirs();
            }
            File source = new File(sourceD, filename);
            File target = new File(targetD, filename);
            BufferedImage srcImg = applyExifOrientation(ImageIO.read(source), source);

            scaleAndWriteJpg(srcImg, target, width, height);
        } finally {
            convertToThumbnailTaskCount -= 1;
        }
    }

    public static void convertToWebp(String sourceStr,
                                     String targetStr,
                                     String filename) throws IOException {
        if (convertToWebpTaskCount >= 8) {
            throw new RuntimeException("当前转换任务过多，请稍后再试");
        }
        convertToWebpTaskCount += 1;

        File sourceFile = new File(sourceStr, filename);

        if (!sourceFile.exists()) {
            convertToWebpTaskCount -= 1;
            throw new IOException("源文件不存在: " + sourceFile.getAbsolutePath());
        }

        File targetDir = new File(targetStr);

        if (!targetDir.exists()) {
            targetDir.mkdirs();
        }

        File targetFile = new File(targetDir, filename + ".webp");

        BufferedImage image = ImageIO.read(sourceFile);

        if (image == null) {
            convertToWebpTaskCount -= 1;
            throw new IOException("无法读取图片文件");
        }

        image = applyExifOrientation(image, sourceFile);

        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("webp");

        if (!writers.hasNext()) {
            convertToWebpTaskCount -= 1;
            throw new RuntimeException("未找到 WebP Writer，请检查 imageio-webp 依赖");
        }

        ImageWriter writer = writers.next();

        ImageWriteParam param = writer.getDefaultWriteParam();

        if (param.canWriteCompressed()) {
            param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);

            String[] types = param.getCompressionTypes();
            if (types != null && types.length > 0) {
                param.setCompressionType(types[0]);
            }

            param.setCompressionQuality(0.5f);
        }

        try (ImageOutputStream ios = ImageIO.createImageOutputStream(targetFile)) {

            writer.setOutput(ios);

            writer.write(
                    null,
                    new IIOImage(image, null, null),
                    param
            );

        } finally {
            writer.dispose();
            convertToWebpTaskCount -= 1;
        }
    }
    private static void scaleAndWriteJpg(BufferedImage srcImg, File target, int width, int height) throws IOException {
        int srcWidth = srcImg.getWidth();
        int srcHeight = srcImg.getHeight();

        double scale = Math.min(
                (double) width / srcWidth,
                (double) height / srcHeight
        );

        int newW = (int) (srcWidth * scale);
        int newH = (int) (srcHeight * scale);

        Image scaledImg = srcImg.getScaledInstance(newW, newH, Image.SCALE_SMOOTH);

        BufferedImage output = new BufferedImage(newW, newH, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = output.createGraphics();

        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.drawImage(scaledImg, 0, 0, null);
        g.dispose();

        ImageIO.write(output, "jpg", target);
    }

    private static BufferedImage applyExifOrientation(BufferedImage image, File imageFile) {
        try {
            Metadata metadata = ImageMetadataReader.readMetadata(imageFile);
            ExifIFD0Directory directory = metadata.getFirstDirectoryOfType(ExifIFD0Directory.class);
            int orientation = directory == null ? 1 : directory.getInt(ExifIFD0Directory.TAG_ORIENTATION);
            return transformByOrientation(image, orientation);
        } catch (Exception e) {
            return image;
        }
    }
    private static BufferedImage transformByOrientation(BufferedImage src, int orientation) {
        int width = src.getWidth();
        int height = src.getHeight();

        AffineTransform tx = new AffineTransform();
        int destWidth = width;
        int destHeight = height;

        switch (orientation) {
            case 2 -> tx.scale(-1.0, 1.0);
            case 3 -> tx.quadrantRotate(2, width / 2.0, height / 2.0);
            case 4 -> tx.scale(1.0, -1.0);
            case 5 -> {
                tx.quadrantRotate(1);
                tx.scale(1.0, -1.0);
                destWidth = height;
                destHeight = width;
            }
            case 6 -> {
                tx.translate(height, 0);
                tx.quadrantRotate(1);
                destWidth = height;
                destHeight = width;
            }
            case 7 -> {
                tx.scale(-1.0, 1.0);
                tx.translate(-height, 0);
                tx.translate(0, width);
                tx.quadrantRotate(3);
                destWidth = height;
                destHeight = width;
            }
            case 8 -> {
                tx.translate(0, width);
                tx.quadrantRotate(3);
                destWidth = height;
                destHeight = width;
            }
            default -> {
                return src;
            }
        }

        if (orientation == 2) {
            tx.translate(-width, 0);
        } else if (orientation == 4) {
            tx.translate(0, -height);
        }

        BufferedImage dst = new BufferedImage(destWidth, destHeight, BufferedImage.TYPE_INT_RGB);
        AffineTransformOp op = new AffineTransformOp(tx, AffineTransformOp.TYPE_BILINEAR);
        op.filter(src, dst);
        return dst;
    }
}
