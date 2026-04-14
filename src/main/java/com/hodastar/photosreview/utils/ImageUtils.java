package com.hodastar.photosreview.utils;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;

public class ImageUtils {

    public static void createThumbnail(String sourceStr, String targetStr, String filename, int width, int height) throws Exception {
        File sourceD = new File(sourceStr);
        File targetD = new File(targetStr);
        if (!sourceD.exists()) {
            return;
        }
        if (!targetD.exists()) {
            targetD.mkdirs();
        }
        File source = new File(sourceD, filename);
        File target = new File(targetD, filename);
        BufferedImage srcImg = ImageIO.read(source);

        // 按比例缩放
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

        // 抗锯齿
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.drawImage(scaledImg, 0, 0, null);
        g.dispose();

        ImageIO.write(output, "jpg", target);
    }
}
