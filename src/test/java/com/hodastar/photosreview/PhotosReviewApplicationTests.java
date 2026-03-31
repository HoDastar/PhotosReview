package com.hodastar.photosreview;

import com.hodastar.photosreview.utils.CryptUtil;
import com.hodastar.photosreview.utils.Utilities;
import org.apache.juli.logging.Log;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.test.context.SpringBootTest;
import static com.hodastar.photosreview.config.Config.LOGIN_SESSION_FILE_DIR;

import java.util.Map;

@SpringBootTest
class PhotosReviewApplicationTests {

    private static final Logger log =
            LoggerFactory.getLogger(PhotosReviewApplicationTests.class);

    @Test
    void contextLoads() {
        b();
    }

    void a() {
        System.out.println(Utilities.readDocumentFile(LOGIN_SESSION_FILE_DIR+"10000.session"));
    }
    void b() {
        System.out.println(CryptUtil.BCEcrypt("Aa123456"));
    }
}
