package com.shed.teamden.team.repository;

import com.shed.teamden.team.entity.TeamPermission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TeamPermissionRepository extends JpaRepository<TeamPermission, UUID> {

    List<TeamPermission> findByTeamId(UUID teamId);
}
