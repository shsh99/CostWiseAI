package com.costwise.api.support;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

public final class JsonFieldReader {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private JsonFieldReader() {}

    public static String read(String json, String fieldName) throws Exception {
        JsonNode root = OBJECT_MAPPER.readTree(json);
        JsonNode field = root.get(fieldName);
        if (field == null || field.isNull()) {
            throw new IllegalArgumentException("Missing field: " + fieldName);
        }
        return field.asText();
    }
}
