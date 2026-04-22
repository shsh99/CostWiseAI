package com.costwise.persistence;

import java.time.LocalDateTime;
import java.util.Optional;

public interface WorkflowStateRepository {

    Optional<WorkflowStateRecord> findState(String projectId);

    WorkflowStateRecord createState(String projectId, String status);

    WorkflowStateRecord updateState(String projectId, String status, String lastAction, LocalDateTime updatedAt);

    record WorkflowStateRecord(
            String projectId,
            String status,
            String lastAction,
            LocalDateTime updatedAt) {}
}
