package com.hodastar.photosreview.config;

import com.hodastar.photosreview.mappers.SystemMapper;
import org.apache.juli.logging.Log;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class Config {
    private final SystemMapper systemMapper;
    public static final String HMAC_SECRET = "7e136a5948bb60160587decd486224fa45627565cddbde7306d7708b990da74a";
    public static final String HMAC_SECRET_SIGN = "f0f097a70fd1ef9df3303c66d5f7ee8f5b64b1fba6a92c346cb4f88a36b76028";
    public static final String SALT = "b680b32490540916ac08883ba2c6f94f091e8103cff1c1ac52fae15cc8b1369e";

    public String WEBSITE_NAME;
    public String WEBSITE_ICON;
    public String WEBSITE_URL;

    private static final Logger log =
            LoggerFactory.getLogger(Config.class);

    public Config(SystemMapper systemMapper) {
        this.systemMapper = systemMapper;
    }

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().permitAll()
                );
        return http.build();
    }


    @Bean
    CommandLineRunner loadWebsiteConfig() {
        return args -> {
            try {
                // 在应用启动后安全地从 mapper 读取
                this.WEBSITE_NAME = systemMapper.getWebsiteName();
                this.WEBSITE_ICON = systemMapper.getWebsiteIcon();
                this.WEBSITE_URL = systemMapper.getWebsiteUrl();
            } catch (Exception e) {
                // 读取失败时记录并使用默认值，避免整个应用启动失败
                log.error("Failed to load website config: {}", e.getMessage());
                if (this.WEBSITE_NAME == null) this.WEBSITE_NAME = "PhotosReview";
                if (this.WEBSITE_ICON == null) this.WEBSITE_ICON = "/static/icon.png";
                if (this.WEBSITE_URL == null) this.WEBSITE_URL = "/";
            }
        };
    }
}
