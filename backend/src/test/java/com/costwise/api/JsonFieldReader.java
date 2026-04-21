package com.costwise.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

final class JsonFieldReader {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private JsonFieldReader() {}

    static String read(String json, String fieldName) throws Exception {
        JsonNode root = OBJECT_MAPPER.readTree(json);
        JsonNode field = root.get(fieldName);
        if (field == null || field.isNull()) {
            throw new IllegalArgumentException("Missing field: " + fieldName);
        }
        return field.asText();
    }
}
