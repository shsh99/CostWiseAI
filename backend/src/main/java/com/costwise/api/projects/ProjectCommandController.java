package com.costwise.api.projects;

import com.costwise.api.dto.persistence.CreateProjectRequest;
import com.costwise.api.dto.persistence.ProjectSummaryResponse;
import com.costwise.api.dto.persistence.UpdateProjectRequest;
import com.costwise.persistence.PersistenceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/projects")
public class ProjectCommandController {

    private final PersistenceService persistenceService;

    public ProjectCommandController(PersistenceService persistenceService) {
        this.persistenceService = persistenceService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PLANNER')")
    public ResponseEntity<ProjectSummaryResponse> createProject(@Valid @RequestBody CreateProjectRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(persistenceService.createProject(request));
    }

    @PutMapping("/{projectId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PLANNER')")
    public ProjectSummaryResponse updateProject(
            @PathVariable String projectId, @Valid @RequestBody UpdateProjectRequest request) {
        return persistenceService.updateProject(projectId, request);
    }
}
