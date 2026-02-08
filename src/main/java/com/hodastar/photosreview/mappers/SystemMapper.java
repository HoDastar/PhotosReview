package com.hodastar.photosreview.mappers;

import com.hodastar.photosreview.config.SqliteInitiate;
import com.hodastar.photosreview.entities.EntityReviewConfig;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class SystemMapper {
    private final JdbcTemplate jdbcTemplate;

    public  SystemMapper(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * 获取网站名称
     * @return 网站名称
     */
    public String getWebsiteName() {
        String name = jdbcTemplate.queryForObject(
            "SELECT value FROM review_config WHERE id = 0",
            String.class
        );
        return name;
    }
}
