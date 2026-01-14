package com.example.smartgarage.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**") // Cho phép mọi API
                .allowedOrigins("*")  // Trong thực tế sẽ điền domain của App/Web
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS");
    }
}
