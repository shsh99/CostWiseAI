package com.costwise.user;

import com.costwise.config.AuditPersistenceProperties;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcUserRepository implements UserRepository {

    private final AuditPersistenceProperties persistenceProperties;

    public JdbcUserRepository(AuditPersistenceProperties persistenceProperties) {
        this.persistenceProperties = persistenceProperties;
    }

    @Override
    public List<UserRecord> listUsers() {
        String sql = """
                select id, email, display_name, role, division, status, mfa_enabled, created_at, updated_at
                  from users
                 order by created_at asc, email asc
                """;
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement(sql);
                ResultSet resultSet = statement.executeQuery()) {
            List<UserRecord> users = new ArrayList<>();
            while (resultSet.next()) {
                users.add(toUser(resultSet));
            }
            return users;
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to list users", exception);
        }
    }

    @Override
    public UserRecord createUser(NewUser user) {
        String sql = """
                insert into users (email, display_name, role, division, status, mfa_enabled, created_at, updated_at)
                values (?, ?, ?, ?, ?, ?, current_timestamp, current_timestamp)
                """;
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            statement.setString(1, user.email());
            statement.setString(2, user.displayName());
            statement.setString(3, user.role());
            statement.setString(4, user.division());
            statement.setString(5, user.status());
            statement.setBoolean(6, user.mfaEnabled());
            statement.executeUpdate();
            return findUser(readGeneratedUuid(statement)).orElseThrow(
                    () -> new IllegalStateException("Failed to read created user"));
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to create user", exception);
        }
    }

    @Override
    public UserRecord updateUser(UserUpdate user) {
        String sql = """
                update users
                   set email = ?,
                       display_name = ?,
                       role = ?,
                       division = ?,
                       status = ?,
                       mfa_enabled = ?,
                       updated_at = current_timestamp
                 where id = ?
                """;
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, user.email());
            statement.setString(2, user.displayName());
            statement.setString(3, user.role());
            statement.setString(4, user.division());
            statement.setString(5, user.status());
            statement.setBoolean(6, user.mfaEnabled());
            statement.setObject(7, uuid(user.id()));
            int updated = statement.executeUpdate();
            if (updated == 0) {
                throw new IllegalArgumentException("Unknown user id: " + user.id());
            }
            return findUser(user.id()).orElseThrow(() -> new IllegalStateException("Failed to read updated user"));
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to update user", exception);
        }
    }

    @Override
    public void deleteUser(String userId) {
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement("delete from users where id = ?")) {
            statement.setObject(1, uuid(userId));
            int deleted = statement.executeUpdate();
            if (deleted == 0) {
                throw new IllegalArgumentException("Unknown user id: " + userId);
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to delete user", exception);
        }
    }

    @Override
    public Optional<UserRecord> findUser(String userId) {
        String sql = """
                select id, email, display_name, role, division, status, mfa_enabled, created_at, updated_at
                  from users
                 where id = ?
                """;
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setObject(1, uuid(userId));
            try (ResultSet resultSet = statement.executeQuery()) {
                if (!resultSet.next()) {
                    return Optional.empty();
                }
                return Optional.of(toUser(resultSet));
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to find user", exception);
        }
    }

    @Override
    public boolean existsByEmail(String email, String skipUserId) {
        StringBuilder sql = new StringBuilder("select 1 from users where lower(email) = lower(?)");
        if (skipUserId != null) {
            sql.append(" and id <> ?");
        }
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement(sql.toString())) {
            statement.setString(1, email);
            if (skipUserId != null) {
                statement.setObject(2, uuid(skipUserId));
            }
            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next();
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to check user email", exception);
        }
    }

    private Connection openConnection() throws SQLException {
        AuditPersistenceProperties.ResolvedConnection connection = persistenceProperties.resolveConnection();
        return DriverManager.getConnection(connection.jdbcUrl(), connection.username(), connection.password());
    }

    private UserRecord toUser(ResultSet resultSet) throws SQLException {
        return new UserRecord(
                resultSet.getString("id"),
                resultSet.getString("email"),
                resultSet.getString("display_name"),
                resultSet.getString("role"),
                resultSet.getString("division"),
                resultSet.getString("status"),
                resultSet.getBoolean("mfa_enabled"),
                resultSet.getTimestamp("created_at").toLocalDateTime(),
                resultSet.getTimestamp("updated_at").toLocalDateTime());
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
