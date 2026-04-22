package com.costwise.persistence;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ProjectPersistenceRepository {

    ProjectRecord createProject(NewProject project);

    ProjectRecord updateProject(ProjectUpdate project);

    void deleteProject(String projectId);

    Optional<ProjectRecord> findProject(String projectId);

    boolean existsProjectCode(String code);

    ScenarioRecord createScenario(String projectId, NewScenario scenario);

    ScenarioRecord updateScenario(String projectId, ScenarioUpdate scenario);

    void deleteScenario(String projectId, String scenarioId);

    Optional<ScenarioRecord> findScenario(String projectId, String scenarioId);

    List<ScenarioRecord> listScenarios(String projectId);

    boolean existsScenarioName(String projectId, String normalizedName, String skipScenarioId);

    record NewProject(String code, String name, String businessType, String status, String description) {}

    record ProjectUpdate(
            String id,
            String name,
            String businessType,
            String status,
            String description) {}

    record ProjectRecord(
            String id,
            String code,
            String name,
            String businessType,
            String status,
            String description,
            LocalDateTime createdAt) {}

    record NewScenario(String name, String description, boolean isBaseline, boolean isActive) {}

    record ScenarioUpdate(
            String id,
            String name,
            String description,
            boolean isBaseline,
            boolean isActive) {}

    record ScenarioRecord(
            String id,
            String name,
            String description,
            boolean isBaseline,
            boolean isActive,
            LocalDateTime createdAt) {}
}
