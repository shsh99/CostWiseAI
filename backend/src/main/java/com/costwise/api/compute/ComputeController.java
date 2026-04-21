package com.costwise.api.compute;

import com.costwise.api.dto.ComputeRequest;
import com.costwise.api.dto.ComputeResponse;
import com.costwise.service.ComputeFacade;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ComputeController {

    private final ComputeFacade computeFacade;

    public ComputeController(ComputeFacade computeFacade) {
        this.computeFacade = computeFacade;
    }

    @PostMapping("/compute")
    public ComputeResponse compute(@Valid @RequestBody ComputeRequest request) {
        return computeFacade.compute(request);
    }
}
