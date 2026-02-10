package com.hodastar.photosreview.mappers;

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

    /**
     * 获取网站图标路径
     * @return 网站图标路径
     */
    public String getWebsiteIcon() {
        String icon = jdbcTemplate.queryForObject(
                "SELECT value FROM review_config WHERE id = 1",
                String.class
        );
        return icon;
    }

    /**
     * 获取网站url
     * @return 网站url
     */
    public String getWebsiteUrl() {
        String url = jdbcTemplate.queryForObject(
                "SELECT value FROM review_config WHERE id = 2",
                String.class
        );
        return url;
    }
}
