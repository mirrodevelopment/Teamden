package com.shed.teamden.provisioning.repository;

import com.shed.teamden.provisioning.entity.EmailVerification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface EmailVerificationRepository extends JpaRepository<EmailVerification, UUID> {
    Optional<EmailVerification> findTopByEmailOrderByCreatedAtDesc(String email);
    Optional<EmailVerification> findTopByEmailAndVerificationCodeOrderByCreatedAtDesc(String email, String verificationCode);
}
