package com.costwise.user;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository {

    List<UserRecord> listUsers();

    UserRecord createUser(NewUser user);

    UserRecord updateUser(UserUpdate user);

    void updatePasswordHash(String userId, String passwordHash);

    void deleteUser(String userId);

    Optional<UserRecord> findUser(String userId);

    Optional<AuthUserRecord> findAuthUserByEmail(String email);

    boolean existsByEmail(String email, String skipUserId);

    record NewUser(
            String email,
            String displayName,
            String role,
            String division,
            String status,
            boolean mfaEnabled,
            String passwordHash) {}

    record UserUpdate(
            String id,
            String email,
            String displayName,
            String role,
            String division,
            String status,
            boolean mfaEnabled) {}

    record UserRecord(
            String id,
            String email,
            String displayName,
            String role,
            String division,
            String status,
            boolean mfaEnabled,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {}

    record AuthUserRecord(
            String id,
            String email,
            String displayName,
            String role,
            String division,
            String status,
            boolean mfaEnabled,
            String passwordHash) {}
}
