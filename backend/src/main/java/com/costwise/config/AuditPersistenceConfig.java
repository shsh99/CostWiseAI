package com.costwise.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(AuditPersistenceProperties.class)
public class AuditPersistenceConfig {}
