package com.hodastar.photosreview;

import com.hodastar.photosreview.mappers.ReviewMapper;
import com.hodastar.photosreview.utils.CryptUtil;
import com.hodastar.photosreview.utils.FileUtil;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import static com.hodastar.photosreview.config.Config.LOGIN_SESSION_FILE_DIR;

@SpringBootTest
class PhotosReviewApplicationTests {

    private static final Logger log =
            LoggerFactory.getLogger(PhotosReviewApplicationTests.class);

    @Autowired
    private ReviewMapper reviewMapper;

    @Test
    void contextLoads() {
        c();
    }

    void a() {
        System.out.println(FileUtil.readDocumentFile(LOGIN_SESSION_FILE_DIR+"10000.session"));
    }
    void b() {
        System.out.println(CryptUtil.BCEcrypt("Aa123456"));
    }

    void c() {
    }
}
