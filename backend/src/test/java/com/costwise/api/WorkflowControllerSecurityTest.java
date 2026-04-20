package com.costwise.api;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class WorkflowControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void auditLogsRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/audit-logs")).andExpect(status().isUnauthorized());
    }

    @Test
    void auditLogsRequireExecutiveRole() throws Exception {
        mockMvc.perform(get("/api/audit-logs").header("X-Auth-User", "재무검토자").header("X-Auth-Role", "FINANCE_REVIEWER"))
                .andExpect(status().isForbidden());
    }

    @Test
    void auditLogsAreAvailableToExecutive() throws Exception {
        mockMvc.perform(get("/api/audit-logs").header("X-Auth-User", "CFO").header("X-Auth-Role", "EXECUTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].actor").exists());
    }

    @Test
    void reviewEndpointRequiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/projects/13/review")
                        .contentType(APPLICATION_JSON)
                        .content("{\"action\":\"SUBMIT\",\"comment\":\"검토 요청\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void invalidRoleActionCombinationReturnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/projects/13/review")
                        .header("X-Auth-User", "기획 담당자")
                        .header("X-Auth-Role", "PLANNER")
                        .contentType(APPLICATION_JSON)
                        .content("{\"action\":\"APPROVE\",\"comment\":\"잘못된 승인 시도\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("cannot perform action")));
    }
}
