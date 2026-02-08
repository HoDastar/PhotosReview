package com.hodastar.photosreview.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class Config {
    public static final String HMAC_SECRET = "7e136a5948bb60160587decd486224fa45627565cddbde7306d7708b990da74a";
    public static final String HMAC_SECRET_SIGN = "f0f097a70fd1ef9df3303c66d5f7ee8f5b64b1fba6a92c346cb4f88a36b76028";
    public static final String SALT = "b680b32490540916ac08883ba2c6f94f091e8103cff1c1ac52fae15cc8b1369e";

    public String WEBSITE_NAME;

    @Bean
    public CommandLineRunner WebConfig(SqliteInitiate sqliteInitiate) {
        return args -> {

        };
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

}
