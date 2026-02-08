package com.hodastar.photosreview;

import com.hodastar.photosreview.utils.CryptUtil;
import com.hodastar.photosreview.utils.Utilities;
import org.apache.juli.logging.Log;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Map;

@SpringBootTest
class PhotosReviewApplicationTests {

    private static final Logger log =
            LoggerFactory.getLogger(PhotosReviewApplicationTests.class);

    @Test
    void contextLoads() {
/*
        log.info(CryptUtil.BCEcrypt("123456"));
        log.info(CryptUtil.checkBCEcrypt("123456", "$2a$10$lAecc.DqEAYsrnCa7RojTuyd23agS0DqsCTcoPaNuEpkVSE4YweQa").toString());
 */
        String a = """
                {
                "wss": "ws://localhost:8080/ws",
                "api": "http://localhost:8080/api",
                "a": {
                    "b": 1,
                    "c": 2
                }
                }
                """;
        Map<String, Object> b = Utilities.jsonStringToMap(a);
        log.info(b.get("wss").toString());
        log.info(b.get("api").toString());
        log.info(b.get("a").toString());

    }

}
