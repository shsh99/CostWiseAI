package com.costwise.api.dto.audit;

import java.util.List;

public record AuditLogListResponse(
        List<AuditLogEntryResponse> items,
        String nextCursor) {}
