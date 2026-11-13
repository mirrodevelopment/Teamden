package com.shed.teamden.dailyupdate.repository;

import com.shed.teamden.dailyupdate.entity.DailyUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DailyUpdateRepository extends JpaRepository<DailyUpdate, UUID> {

    @Query("SELECT d FROM DailyUpdate d " +
           "JOIN FETCH d.user u " +
           "WHERE d.organization.id = :orgId " +
           "AND d.user.id = :userId " +
           "AND d.updateDate = :updateDate")
    Optional<DailyUpdate> findByOrganizationIdAndUserIdAndUpdateDate(
            @Param("orgId") UUID orgId,
            @Param("userId") UUID userId,
            @Param("updateDate") LocalDate updateDate);

    @Query("SELECT d FROM DailyUpdate d " +
           "JOIN FETCH d.user u " +
           "WHERE d.organization.id = :orgId " +
           "AND d.updateDate = :updateDate " +
           "ORDER BY d.createdAt DESC")
    List<DailyUpdate> findByOrganizationIdAndUpdateDateOrderByCreatedAtDesc(
            @Param("orgId") UUID orgId,
            @Param("updateDate") LocalDate updateDate);
}
