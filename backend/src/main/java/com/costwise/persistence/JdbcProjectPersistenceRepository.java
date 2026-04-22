package com.costwise.persistence;

import com.costwise.config.AuditPersistenceProperties;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcProjectPersistenceRepository implements ProjectPersistenceRepository {

    private final AuditPersistenceProperties persistenceProperties;
    private final ObjectMapper objectMapper;

    public JdbcProjectPersistenceRepository(AuditPersistenceProperties persistenceProperties) {
        this(persistenceProperties, new ObjectMapper());
    }

    @Autowired
    public JdbcProjectPersistenceRepository(
            AuditPersistenceProperties persistenceProperties, ObjectMapper objectMapper) {
        this.persistenceProperties = persistenceProperties;
        this.objectMapper = objectMapper;
    }

    @Override
    public ProjectRecord createProject(NewProject project) {
        String sql = """
                insert into projects (code, name, business_type, status, description)
                values (?, ?, ?, ?, ?)
                """;
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            statement.setString(1, project.code());
            statement.setString(2, project.name());
            statement.setString(3, project.businessType());
            statement.setString(4, project.status());
            statement.setString(5, project.description());
            statement.executeUpdate();
            return findProject(readGeneratedUuid(statement)).orElseThrow(
                    () -> new IllegalStateException("Failed to read created project"));
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to create project", exception);
        }
    }

    @Override
    public ProjectRecord updateProject(ProjectUpdate project) {
        String sql = """
                update projects
                   set name = ?,
                       business_type = ?,
                       status = ?,
                       description = ?
                 where id = ?
                """;
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, project.name());
            statement.setString(2, project.businessType());
            statement.setString(3, project.status());
            statement.setString(4, project.description());
            statement.setObject(5, uuid(project.id()));
            int updated = statement.executeUpdate();
            if (updated == 0) {
                throw new IllegalArgumentException("Unknown project id: " + project.id());
            }
            return findProject(project.id()).orElseThrow(
                    () -> new IllegalStateException("Failed to read updated project"));
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to update project", exception);
        }
    }

    @Override
    public void deleteProject(String projectId) {
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement("delete from projects where id = ?")) {
            statement.setObject(1, uuid(projectId));
            int deleted = statement.executeUpdate();
            if (deleted == 0) {
                throw new IllegalArgumentException("Unknown project id: " + projectId);
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to delete project", exception);
        }
    }

    @Override
    public Optional<ProjectRecord> findProject(String projectId) {
        String sql = """
                select id, code, name, business_type, status, description, created_at
                  from projects
                 where id = ?
                """;
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setObject(1, uuid(projectId));
            try (ResultSet resultSet = statement.executeQuery()) {
                if (!resultSet.next()) {
                    return Optional.empty();
                }
                return Optional.of(toProject(resultSet));
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to find project", exception);
        }
    }

    @Override
    public boolean existsProjectCode(String code) {
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement("select 1 from projects where code = ?")) {
            statement.setString(1, code);
            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next();
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to check project code", exception);
        }
    }

    @Override
    public ScenarioRecord createScenario(String projectId, NewScenario scenario) {
        String sql = """
                insert into scenarios (project_id, name, description, is_baseline, is_active)
                values (?, ?, ?, ?, ?)
                """;
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            statement.setObject(1, uuid(projectId));
            statement.setString(2, scenario.name());
            statement.setString(3, scenario.description());
            statement.setBoolean(4, scenario.isBaseline());
            statement.setBoolean(5, scenario.isActive());
            statement.executeUpdate();
            return findScenario(projectId, readGeneratedUuid(statement)).orElseThrow(
                    () -> new IllegalStateException("Failed to read created scenario"));
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to create scenario", exception);
        }
    }

    @Override
    public ScenarioRecord updateScenario(String projectId, ScenarioUpdate scenario) {
        String sql = """
                update scenarios
                   set name = ?,
                       description = ?,
                       is_baseline = ?,
                       is_active = ?
                 where project_id = ?
                   and id = ?
                """;
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, scenario.name());
            statement.setString(2, scenario.description());
            statement.setBoolean(3, scenario.isBaseline());
            statement.setBoolean(4, scenario.isActive());
            statement.setObject(5, uuid(projectId));
            statement.setObject(6, uuid(scenario.id()));
            int updated = statement.executeUpdate();
            if (updated == 0) {
                throw new IllegalArgumentException("Unknown scenario id: " + scenario.id());
            }
            return findScenario(projectId, scenario.id()).orElseThrow(
                    () -> new IllegalStateException("Failed to read updated scenario"));
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to update scenario", exception);
        }
    }

    @Override
    public void deleteScenario(String projectId, String scenarioId) {
        String sql = "delete from scenarios where project_id = ? and id = ?";
        try (Connection connection = openConnection()) {
            connection.setAutoCommit(false);
            try (PreparedStatement statement = connection.prepareStatement(sql)) {
                deleteScenarioAnalysis(connection, projectId, scenarioId);
                statement.setObject(1, uuid(projectId));
                statement.setObject(2, uuid(scenarioId));
                int deleted = statement.executeUpdate();
                if (deleted == 0) {
                    throw new IllegalArgumentException("Unknown scenario id: " + scenarioId);
                }
                connection.commit();
            } catch (SQLException | RuntimeException exception) {
                connection.rollback();
                throw exception;
            } finally {
                connection.setAutoCommit(true);
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to delete scenario", exception);
        }
    }

    @Override
    public Optional<ScenarioRecord> findScenario(String projectId, String scenarioId) {
        String sql = """
                select id, name, description, is_baseline, is_active, created_at
                  from scenarios
                 where project_id = ?
                   and id = ?
                """;
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setObject(1, uuid(projectId));
            statement.setObject(2, uuid(scenarioId));
            try (ResultSet resultSet = statement.executeQuery()) {
                if (!resultSet.next()) {
                    return Optional.empty();
                }
                return Optional.of(toScenario(resultSet));
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to find scenario", exception);
        }
    }

    @Override
    public List<ScenarioRecord> listScenarios(String projectId) {
        String sql = """
                select id, name, description, is_baseline, is_active, created_at
                  from scenarios
                 where project_id = ?
                 order by created_at asc, name asc
                """;
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setObject(1, uuid(projectId));
            try (ResultSet resultSet = statement.executeQuery()) {
                List<ScenarioRecord> scenarios = new ArrayList<>();
                while (resultSet.next()) {
                    scenarios.add(toScenario(resultSet));
                }
                return scenarios;
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to list scenarios", exception);
        }
    }

    @Override
    public boolean existsScenarioName(String projectId, String normalizedName, String skipScenarioId) {
        StringBuilder sql = new StringBuilder("""
                select 1
                  from scenarios
                 where project_id = ?
                   and lower(name) = ?
                """);
        if (skipScenarioId != null) {
            sql.append(" and id <> ?");
        }
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement(sql.toString())) {
            statement.setObject(1, uuid(projectId));
            statement.setString(2, normalizedName);
            if (skipScenarioId != null) {
                statement.setObject(3, uuid(skipScenarioId));
            }
            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next();
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to check scenario name", exception);
        }
    }

    @Override
    public void upsertAnalysis(
            String projectId, String scenarioId, AnalysisRecord analysis, ApprovalLogRecord approvalLog) {
        try (Connection connection = openConnection()) {
            connection.setAutoCommit(false);
            try {
                deleteScenarioAnalysis(connection, projectId, scenarioId);
                for (AllocationRuleRecord allocation : analysis.allocationRules()) {
                    String departmentId = upsertDepartment(connection, allocation.departmentCode());
                    String costPoolId = insertCostPool(connection, projectId, scenarioId, allocation);
                    insertAllocationRule(connection, projectId, scenarioId, departmentId, costPoolId, allocation);
                }
                for (CashFlowRecord cashFlow : analysis.cashFlows()) {
                    insertCashFlow(connection, projectId, scenarioId, cashFlow);
                }
                if (analysis.valuation() != null) {
                    insertValuation(connection, projectId, scenarioId, analysis.valuation());
                }
                insertApprovalLog(connection, projectId, scenarioId, approvalLog);
                connection.commit();
            } catch (SQLException | RuntimeException exception) {
                connection.rollback();
                throw exception;
            } finally {
                connection.setAutoCommit(true);
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to upsert analysis", exception);
        }
    }

    @Override
    public AnalysisRecord findAnalysis(String projectId, String scenarioId) {
        return new AnalysisRecord(
                listAllocationRules(projectId, scenarioId),
                listCashFlows(projectId, scenarioId),
                findValuation(projectId, scenarioId).orElse(null));
    }

    @Override
    public List<ApprovalLogRecord> listApprovalLogs(String projectId) {
        String sql = """
                select actor_role, actor_name, action, comment, created_at
                  from approval_logs
                 where project_id = ?
                 order by created_at asc, id asc
                """;
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setObject(1, uuid(projectId));
            try (ResultSet resultSet = statement.executeQuery()) {
                List<ApprovalLogRecord> logs = new ArrayList<>();
                while (resultSet.next()) {
                    logs.add(new ApprovalLogRecord(
                            resultSet.getString("actor_role"),
                            resultSet.getString("actor_name"),
                            resultSet.getString("action"),
                            resultSet.getString("comment"),
                            resultSet.getTimestamp("created_at").toLocalDateTime()));
                }
                return logs;
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to list approval logs", exception);
        }
    }

    private Connection openConnection() throws SQLException {
        AuditPersistenceProperties.ResolvedConnection connection = persistenceProperties.resolveConnection();
        return DriverManager.getConnection(connection.jdbcUrl(), connection.username(), connection.password());
    }

    private ProjectRecord toProject(ResultSet resultSet) throws SQLException {
        return new ProjectRecord(
                resultSet.getString("id"),
                resultSet.getString("code"),
                resultSet.getString("name"),
                resultSet.getString("business_type"),
                resultSet.getString("status"),
                resultSet.getString("description"),
                resultSet.getTimestamp("created_at").toLocalDateTime());
    }

    private ScenarioRecord toScenario(ResultSet resultSet) throws SQLException {
        return new ScenarioRecord(
                resultSet.getString("id"),
                resultSet.getString("name"),
                resultSet.getString("description"),
                resultSet.getBoolean("is_baseline"),
                resultSet.getBoolean("is_active"),
                resultSet.getTimestamp("created_at").toLocalDateTime());
    }

    private void deleteScenarioAnalysis(Connection connection, String projectId, String scenarioId) throws SQLException {
        deleteByScenario(connection, "allocation_rules", projectId, scenarioId);
        deleteByScenario(connection, "cost_pools", projectId, scenarioId);
        deleteByScenario(connection, "cash_flows", projectId, scenarioId);
        deleteByScenario(connection, "valuation_results", projectId, scenarioId);
    }

    private void deleteByScenario(Connection connection, String table, String projectId, String scenarioId)
            throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(
                "delete from " + table + " where project_id = ? and scenario_id = ?")) {
            statement.setObject(1, uuid(projectId));
            statement.setObject(2, uuid(scenarioId));
            statement.executeUpdate();
        }
    }

    private String upsertDepartment(Connection connection, String departmentCode) throws SQLException {
        String insert = """
                insert into departments (code, name)
                select ?, ?
                 where not exists (select 1 from departments where code = ?)
                """;
        try (PreparedStatement statement = connection.prepareStatement(insert)) {
            statement.setString(1, departmentCode);
            statement.setString(2, departmentCode);
            statement.setString(3, departmentCode);
            statement.executeUpdate();
        }
        try (PreparedStatement statement = connection.prepareStatement("select id from departments where code = ?")) {
            statement.setString(1, departmentCode);
            try (ResultSet resultSet = statement.executeQuery()) {
                if (!resultSet.next()) {
                    throw new IllegalStateException("Failed to resolve department: " + departmentCode);
                }
                return resultSet.getString("id");
            }
        }
    }

    private String insertCostPool(
            Connection connection, String projectId, String scenarioId, AllocationRuleRecord allocation)
            throws SQLException {
        String sql = """
                insert into cost_pools (project_id, scenario_id, name, category, amount)
                values (?, ?, ?, ?, ?)
                """;
        try (PreparedStatement statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            statement.setObject(1, uuid(projectId));
            statement.setObject(2, uuid(scenarioId));
            statement.setString(3, allocation.costPoolName());
            statement.setString(4, allocation.costPoolCategory());
            statement.setBigDecimal(5, allocation.costPoolAmount());
            statement.executeUpdate();
            return readGeneratedUuid(statement);
        }
    }

    private void insertAllocationRule(
            Connection connection,
            String projectId,
            String scenarioId,
            String departmentId,
            String costPoolId,
            AllocationRuleRecord allocation)
            throws SQLException {
        String sql = """
                insert into allocation_rules (
                    project_id, scenario_id, cost_pool_id, department_id, basis, allocation_rate, allocated_amount
                ) values (?, ?, ?, ?, ?, ?, ?)
                """;
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setObject(1, uuid(projectId));
            statement.setObject(2, uuid(scenarioId));
            statement.setObject(3, uuid(costPoolId));
            statement.setObject(4, uuid(departmentId));
            statement.setString(5, allocation.basis());
            statement.setBigDecimal(6, allocation.allocationRate());
            statement.setBigDecimal(7, allocation.allocatedAmount());
            statement.executeUpdate();
        }
    }

    private void insertCashFlow(Connection connection, String projectId, String scenarioId, CashFlowRecord cashFlow)
            throws SQLException {
        String sql = """
                insert into cash_flows (
                    project_id, scenario_id, period_no, period_label, year_label,
                    operating_cash_flow, investment_cash_flow, financing_cash_flow, net_cash_flow, discount_rate
                ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setObject(1, uuid(projectId));
            statement.setObject(2, uuid(scenarioId));
            statement.setInt(3, cashFlow.periodNo());
            statement.setString(4, cashFlow.periodLabel());
            statement.setString(5, cashFlow.yearLabel());
            statement.setBigDecimal(6, cashFlow.operatingCashFlow());
            statement.setBigDecimal(7, cashFlow.investmentCashFlow());
            statement.setBigDecimal(8, cashFlow.financingCashFlow());
            statement.setBigDecimal(9, cashFlow.netCashFlow());
            statement.setBigDecimal(10, cashFlow.discountRate());
            statement.executeUpdate();
        }
    }

    private void insertValuation(
            Connection connection, String projectId, String scenarioId, ValuationRecord valuation)
            throws SQLException {
        String sql = """
                insert into valuation_results (
                    project_id, scenario_id, discount_rate, npv, irr, payback_period, decision, assumptions
                ) values (?, ?, ?, ?, ?, ?, ?, ?)
                """;
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setObject(1, uuid(projectId));
            statement.setObject(2, uuid(scenarioId));
            statement.setBigDecimal(3, valuation.discountRate());
            statement.setBigDecimal(4, valuation.npv());
            statement.setBigDecimal(5, valuation.irr());
            statement.setBigDecimal(6, valuation.paybackPeriod());
            statement.setString(7, valuation.decision());
            statement.setString(8, toJson(valuation.assumptions()));
            statement.executeUpdate();
        }
    }

    private void insertApprovalLog(
            Connection connection, String projectId, String scenarioId, ApprovalLogRecord approvalLog)
            throws SQLException {
        String sql = """
                insert into approval_logs (project_id, scenario_id, actor_role, actor_name, action, comment, created_at)
                values (?, ?, ?, ?, ?, ?, ?)
                """;
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setObject(1, uuid(projectId));
            statement.setObject(2, uuid(scenarioId));
            statement.setString(3, approvalLog.actorRole());
            statement.setString(4, approvalLog.actorName());
            statement.setString(5, approvalLog.action());
            statement.setString(6, approvalLog.comment());
            statement.setTimestamp(7, Timestamp.valueOf(approvalLog.createdAt()));
            statement.executeUpdate();
        }
    }

    private List<AllocationRuleRecord> listAllocationRules(String projectId, String scenarioId) {
        String sql = """
                select d.code as department_code,
                       ar.basis,
                       ar.allocation_rate,
                       ar.allocated_amount,
                       cp.name as cost_pool_name,
                       cp.category as cost_pool_category,
                       cp.amount as cost_pool_amount
                  from allocation_rules ar
                  join departments d on d.id = ar.department_id
                  join cost_pools cp on cp.id = ar.cost_pool_id
                 where ar.project_id = ?
                   and ar.scenario_id = ?
                 order by ar.created_at asc, d.code asc, cp.name asc
                """;
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setObject(1, uuid(projectId));
            statement.setObject(2, uuid(scenarioId));
            try (ResultSet resultSet = statement.executeQuery()) {
                List<AllocationRuleRecord> allocations = new ArrayList<>();
                while (resultSet.next()) {
                    allocations.add(new AllocationRuleRecord(
                            resultSet.getString("department_code"),
                            resultSet.getString("basis"),
                            resultSet.getBigDecimal("allocation_rate"),
                            resultSet.getBigDecimal("allocated_amount"),
                            resultSet.getString("cost_pool_name"),
                            resultSet.getString("cost_pool_category"),
                            resultSet.getBigDecimal("cost_pool_amount")));
                }
                return allocations;
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to list allocation rules", exception);
        }
    }

    private List<CashFlowRecord> listCashFlows(String projectId, String scenarioId) {
        String sql = """
                select period_no,
                       period_label,
                       year_label,
                       operating_cash_flow,
                       investment_cash_flow,
                       financing_cash_flow,
                       net_cash_flow,
                       discount_rate
                  from cash_flows
                 where project_id = ?
                   and scenario_id = ?
                 order by period_no asc
                """;
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setObject(1, uuid(projectId));
            statement.setObject(2, uuid(scenarioId));
            try (ResultSet resultSet = statement.executeQuery()) {
                List<CashFlowRecord> cashFlows = new ArrayList<>();
                while (resultSet.next()) {
                    cashFlows.add(new CashFlowRecord(
                            resultSet.getInt("period_no"),
                            resultSet.getString("period_label"),
                            resultSet.getString("year_label"),
                            resultSet.getBigDecimal("operating_cash_flow"),
                            resultSet.getBigDecimal("investment_cash_flow"),
                            resultSet.getBigDecimal("financing_cash_flow"),
                            resultSet.getBigDecimal("net_cash_flow"),
                            resultSet.getBigDecimal("discount_rate")));
                }
                return cashFlows;
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to list cash flows", exception);
        }
    }

    private Optional<ValuationRecord> findValuation(String projectId, String scenarioId) {
        String sql = """
                select discount_rate, npv, irr, payback_period, decision, assumptions
                  from valuation_results
                 where project_id = ?
                   and scenario_id = ?
                """;
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setObject(1, uuid(projectId));
            statement.setObject(2, uuid(scenarioId));
            try (ResultSet resultSet = statement.executeQuery()) {
                if (!resultSet.next()) {
                    return Optional.empty();
                }
                return Optional.of(new ValuationRecord(
                        resultSet.getBigDecimal("discount_rate"),
                        resultSet.getBigDecimal("npv"),
                        resultSet.getBigDecimal("irr"),
                        resultSet.getBigDecimal("payback_period"),
                        resultSet.getString("decision"),
                        fromJson(resultSet.getString("assumptions"))));
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to find valuation", exception);
        }
    }

    private String toJson(JsonNode value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize JSON payload", exception);
        }
    }

    private JsonNode fromJson(String value) {
        try {
            return objectMapper.readTree(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to deserialize JSON payload", exception);
        }
    }

    private String readGeneratedUuid(PreparedStatement statement) throws SQLException {
        try (ResultSet keys = statement.getGeneratedKeys()) {
            if (!keys.next()) {
                throw new IllegalStateException("Failed to read generated id");
            }
            return keys.getObject(1).toString();
        }
    }

    private UUID uuid(String value) {
        return UUID.fromString(value);
    }
}
