package com.shed.teamden.task.entity;

public enum TaskStatus {
    TODO,
    IN_PROGRESS,
    IN_REVIEW,
    BLOCKED,
    COMPLETED,
    CANCELLED;

    public boolean isOpen() {
        return this == TODO || this == IN_PROGRESS || this == IN_REVIEW || this == BLOCKED;
    }

    public boolean isCompleted() {
        return this == COMPLETED;
    }
}
