package com.example.smartgarage;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SmartgarageApplication {

	public static void main(String[] args) {
		SpringApplication.run(SmartgarageApplication.class, args);
	}

}
