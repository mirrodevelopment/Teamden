package com.shed.teamden.team.controller;

import com.shed.teamden.team.dto.CreateTeamRequestDto;
import com.shed.teamden.team.dto.TeamDto;
import com.shed.teamden.team.dto.TeamOptionsDto;
import com.shed.teamden.team.service.TeamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    @GetMapping
    public ResponseEntity<List<TeamDto>> getTeams() {
        return ResponseEntity.ok(teamService.getTeams());
    }

    @GetMapping("/options")
    public ResponseEntity<TeamOptionsDto> getTeamOptions() {
        return ResponseEntity.ok(teamService.getTeamOptions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TeamDto> getTeamDetail(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(teamService.getTeamDetail(id));
    }

    @PostMapping
    public ResponseEntity<TeamDto> createTeam(@Valid @RequestBody CreateTeamRequestDto req) {
        TeamDto created = teamService.createTeam(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
