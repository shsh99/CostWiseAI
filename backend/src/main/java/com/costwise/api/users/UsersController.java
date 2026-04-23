package com.costwise.api.users;

import com.costwise.api.dto.user.CreateUserRequest;
import com.costwise.api.dto.user.UpdateUserRequest;
import com.costwise.api.dto.user.UserResponse;
import com.costwise.user.UserRepository;
import com.costwise.user.UserService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
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
@RequestMapping("/api/users")
@PreAuthorize("hasAnyRole('ADMIN', 'EXECUTIVE', 'AUDITOR')")
public class UsersController {

    private final UserService userService;

    public UsersController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<UserResponse> listUsers() {
        return userService.listUsers().stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> createUser(
            @Valid @RequestBody CreateUserRequest request, Authentication authentication) {
        UserRepository.UserRecord created = userService.createUser(
                new UserService.CreateUserCommand(
                        request.email(),
                        request.displayName(),
                        request.role(),
                        request.division(),
                        request.status(),
                        request.mfaEnabled()),
                authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(created));
    }

    @PutMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse updateUser(
            @PathVariable String userId,
            @Valid @RequestBody UpdateUserRequest request,
            Authentication authentication) {
        UserRepository.UserRecord updated = userService.updateUser(
                userId,
                new UserService.UpdateUserCommand(
                        request.email(),
                        request.displayName(),
                        request.role(),
                        request.division(),
                        request.status(),
                        request.mfaEnabled()),
                authentication);
        return toResponse(updated);
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable String userId, Authentication authentication) {
        userService.deleteUser(userId, authentication);
    }

    private UserResponse toResponse(UserRepository.UserRecord user) {
        return new UserResponse(
                user.id(),
                user.email(),
                user.displayName(),
                user.role(),
                user.division(),
                user.status(),
                user.mfaEnabled(),
                user.createdAt(),
                user.updatedAt());
    }
}
