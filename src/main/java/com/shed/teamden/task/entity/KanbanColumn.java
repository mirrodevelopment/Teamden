package com.shed.teamden.task.entity;

public enum KanbanColumn {
    NOW,
    NEXT,
    LATER;

    public static KanbanColumn fromString(String value) {
        if (value == null) {
            return NOW;
        }
        try {
            return KanbanColumn.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return NOW;
        }
    }
}
