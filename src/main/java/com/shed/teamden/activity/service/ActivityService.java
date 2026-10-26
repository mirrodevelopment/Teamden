package com.shed.teamden.activity.service;

import com.shed.teamden.activity.entity.ActivityEvent;
import com.shed.teamden.activity.entity.ActivityEventType;
import com.shed.teamden.activity.repository.ActivityEventRepository;
import com.shed.teamden.organization.entity.Organization;
import com.shed.teamden.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityEventRepository activityEventRepository;

    @Transactional
    public ActivityEvent recordEvent(
            Organization organization,
            User actor,
            ActivityEventType eventType,
            String entityType,
            UUID entityId,
            String title,
            String description
    ) {
        ActivityEvent event = ActivityEvent.builder()
                .organization(organization)
                .actor(actor)
                .eventType(eventType)
                .entityType(entityType)
                .entityId(entityId)
                .title(title)
                .description(description)
                .eventTimestamp(Instant.now())
                .build();

        log.debug("Recording activity event: {} for org: {}", eventType, organization.getId());
        return activityEventRepository.save(event);
    }
}
