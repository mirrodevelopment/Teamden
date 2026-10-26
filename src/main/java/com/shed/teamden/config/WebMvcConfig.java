package com.shed.teamden.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String devUsePath = Paths.get("dev use").toAbsolutePath().toUri().toString();
        String location = devUsePath.endsWith("/") ? devUsePath : devUsePath + "/";
        registry.addResourceHandler("/dev use/**", "/dev%20use/**", "/dev-use/**", "/devuse/**")
                .addResourceLocations(location);
    }
}
