package com.shed.teamden.project.entity;

import com.shed.teamden.organization.entity.Organization;
import com.shed.teamden.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "project_documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectDocument {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "doc_number", nullable = false, length = 50)
    private String docNumber;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "category", nullable = false, length = 50)
    @Builder.Default
    private String category = "Meeting Notes";

    @Column(name = "category_key", nullable = false, length = 30)
    @Builder.Default
    private String categoryKey = "Notes";

    @Column(name = "file_type", nullable = false, length = 30)
    @Builder.Default
    private String fileType = "DOC";

    @Column(name = "file_size", length = 50)
    private String fileSize;

    @Column(name = "file_url", length = 500)
    private String fileUrl;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private User author;

    @Column(name = "is_pinned", nullable = false)
    @Builder.Default
    private boolean isPinned = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.category == null) {
            this.category = "Meeting Notes";
        }
        if (this.categoryKey == null) {
            this.categoryKey = "Notes";
        }
        if (this.fileType == null) {
            this.fileType = "DOC";
        }
    }
}
