package com.costwise.api;

import com.costwise.api.dto.persistence.AnalysisUpdateResponse;
import com.costwise.api.dto.persistence.AnalysisUpsertRequest;
import com.costwise.api.dto.persistence.CreateProjectRequest;
import com.costwise.api.dto.persistence.CreateScenarioRequest;
import com.costwise.api.dto.persistence.ProjectDetailResponse;
import com.costwise.api.dto.persistence.ProjectSummaryResponse;
import com.costwise.api.dto.persistence.ScenarioResponse;
import com.costwise.api.dto.persistence.UpdateProjectRequest;
import com.costwise.api.dto.persistence.UpdateScenarioRequest;
import com.costwise.service.PersistenceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/persistence")
@PreAuthorize("hasAnyRole('PLANNER', 'FINANCE_REVIEWER', 'EXECUTIVE')")
public class PersistenceController {

    private final PersistenceService persistenceService;

    public PersistenceController(PersistenceService persistenceService) {
        this.persistenceService = persistenceService;
    }

    @PostMapping("/projects")
    public ResponseEntity<ProjectSummaryResponse> createProject(@Valid @RequestBody CreateProjectRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(persistenceService.createProject(request));
    }

    @PutMapping("/projects/{projectId}")
    public ProjectSummaryResponse updateProject(
            @PathVariable String projectId, @Valid @RequestBody UpdateProjectRequest request) {
        return persistenceService.updateProject(projectId, request);
    }

    @DeleteMapping("/projects/{projectId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProject(@PathVariable String projectId) {
        persistenceService.deleteProject(projectId);
    }

    @GetMapping("/projects/{projectId}")
    public ProjectDetailResponse projectDetail(@PathVariable String projectId) {
        return persistenceService.getProjectDetail(projectId);
    }

    @PostMapping("/projects/{projectId}/scenarios")
    public ResponseEntity<ScenarioResponse> createScenario(
            @PathVariable String projectId, @Valid @RequestBody CreateScenarioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(persistenceService.createScenario(projectId, request));
    }

    @PutMapping("/projects/{projectId}/scenarios/{scenarioId}")
    public ScenarioResponse updateScenario(
            @PathVariable String projectId,
            @PathVariable String scenarioId,
            @Valid @RequestBody UpdateScenarioRequest request) {
        return persistenceService.updateScenario(projectId, scenarioId, request);
    }

    @DeleteMapping("/projects/{projectId}/scenarios/{scenarioId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteScenario(@PathVariable String projectId, @PathVariable String scenarioId) {
        persistenceService.deleteScenario(projectId, scenarioId);
    }

    @PutMapping("/projects/{projectId}/scenarios/{scenarioId}/analysis")
    public AnalysisUpdateResponse upsertAnalysis(
            @PathVariable String projectId,
            @PathVariable String scenarioId,
            @Valid @RequestBody AnalysisUpsertRequest request) {
        return persistenceService.upsertAnalysis(projectId, scenarioId, request);
    }
}
