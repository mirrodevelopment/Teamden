package com.shed.teamden.dashboard.service;

import com.shed.teamden.dashboard.dto.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class DashboardService {

    private final List<PriorityTaskDto> nowTasks = new CopyOnWriteArrayList<>();
    private final List<PriorityTaskDto> nextTasks = new CopyOnWriteArrayList<>();
    private final List<PriorityTaskDto> laterTasks = new CopyOnWriteArrayList<>();

    public DashboardService() {
        initDefaultData();
    }

    private void initDefaultData() {
        // NOW Tasks
        nowTasks.add(PriorityTaskDto.builder()
                .id("task-01")
                .column("NOW")
                .indexNum("01")
                .title("Review mobile app screens")
                .tag("Client Application")
                .dueDateLabel("Today")
                .dotColor("red")
                .completed(false)
                .build());

        nowTasks.add(PriorityTaskDto.builder()
                .id("task-02")
                .column("NOW")
                .indexNum("02")
                .title("Update homepage content")
                .tag("Website Redesign")
                .dueDateLabel("Today")
                .dotColor("red")
                .completed(false)
                .build());

        // NEXT Tasks
        nextTasks.add(PriorityTaskDto.builder()
                .id("task-03")
                .column("NEXT")
                .indexNum("03")
                .title("Prepare client presentation")
                .tag("Acme Co.")
                .dueDateLabel("Tomorrow")
                .dotColor("orange")
                .completed(false)
                .build());

        nextTasks.add(PriorityTaskDto.builder()
                .id("task-04")
                .column("NEXT")
                .indexNum("04")
                .title("Refine brand colour palette")
                .tag("Brand Development")
                .dueDateLabel("Fri, 27 Oct")
                .dotColor("blue")
                .completed(false)
                .build());

        // LATER Tasks
        laterTasks.add(PriorityTaskDto.builder()
                .id("task-05")
                .column("LATER")
                .indexNum("05")
                .title("Set up analytics tracking")
                .tag("Website Redesign")
                .dueDateLabel("Fri, 27 Oct")
                .dotColor("blue")
                .completed(false)
                .build());

        laterTasks.add(PriorityTaskDto.builder()
                .id("task-06")
                .column("LATER")
                .indexNum("06")
                .title("Write project summary")
                .tag("Acme Co.")
                .dueDateLabel("Mon, 30 Oct")
                .dotColor("gray")
                .completed(false)
                .build());
    }

    public DashboardDataDto getDashboardData() {
        LocalDate today = LocalDate.now();
        String dayOfWeek = today.getDayOfWeek().name();
        String month = today.getMonth().name().substring(0, 3);
        String year = String.valueOf(today.getYear());
        String dayNum = String.format("%02d", today.getDayOfMonth());
        String formattedDate = today.format(DateTimeFormatter.ofPattern("EEE, dd MMM yyyy")).toUpperCase();

        HeroPriorityDto hero = HeroPriorityDto.builder()
                .prefix("01 / NEXT PRIORITY")
                .title("Finalise the website service card")
                .projectTag("Website Redesign")
                .teamTag("Design Team")
                .priorityLabel("High")
                .description("Update the content, refine the visuals and get approval from the client.")
                .attachments(List.of("Design File", "Client Brief", "References", "+2"))
                .dueDayNum(dayNum)
                .dueMonthYear(month + " " + year)
                .ctaText("Continue task →")
                .build();

        List<ActivityItemDto> activities = List.of(
                ActivityItemDto.builder()
                        .id("act-1")
                        .time("09:42")
                        .dayLabel("TODAY")
                        .dotColor("purple")
                        .badgeType("COMMENT")
                        .author("Sonia")
                        .actionText("commented on")
                        .targetTitle("Design review notes")
                        .subMeta("Website Redesign / Design Team")
                        .quotePreview("The new visual direction looks great. Let's make a few minor adjustments to the icon spacing.")
                        .build(),
                ActivityItemDto.builder()
                        .id("act-2")
                        .time("08:15")
                        .dayLabel("TODAY")
                        .dotColor("green")
                        .badgeType("COMPLETED")
                        .author("Marcus")
                        .actionText("completed")
                        .targetTitle("Set up staging environment")
                        .subMeta("Client Application / Engineering")
                        .quotePreview("Task marked complete")
                        .build(),
                ActivityItemDto.builder()
                        .id("act-3")
                        .time("07:30")
                        .dayLabel("TODAY")
                        .dotColor("amber")
                        .badgeType("DOCUMENT")
                        .author("Product brief")
                        .actionText("was updated")
                        .targetTitle("")
                        .subMeta("Product / Workspace")
                        .quotePreview("Version 1.2 · 3 pages")
                        .build(),
                ActivityItemDto.builder()
                        .id("act-4")
                        .time("06:12")
                        .dayLabel("TODAY")
                        .dotColor("blue")
                        .badgeType("ASSIGNED")
                        .author("You")
                        .actionText("assigned a task to")
                        .targetTitle("Priya")
                        .subMeta("Website Redesign / Design Team")
                        .quotePreview("Client feedback session · Tomorrow, 2:00 PM")
                        .build()
        );

        List<ScheduleItemDto> schedule = List.of(
                ScheduleItemDto.builder()
                        .id("sch-1")
                        .time("09:00")
                        .title("Team standup")
                        .subMeta("Engineering · 30 min")
                        .dotColor("green")
                        .build(),
                ScheduleItemDto.builder()
                        .id("sch-2")
                        .time("10:00")
                        .title("Design review")
                        .subMeta("Website Redesign · 1 hr")
                        .dotColor("purple")
                        .build(),
                ScheduleItemDto.builder()
                        .id("sch-3")
                        .time("12:00")
                        .title("Lunch break")
                        .subMeta("")
                        .dotColor("gray")
                        .build(),
                ScheduleItemDto.builder()
                        .id("sch-4")
                        .time("14:00")
                        .title("Client feedback session")
                        .subMeta("Acme Co. · 1 hr")
                        .dotColor("blue")
                        .build(),
                ScheduleItemDto.builder()
                        .id("sch-5")
                        .time("16:00")
                        .title("Focus time")
                        .subMeta("No meetings")
                        .dotColor("gray")
                        .build()
        );

        List<AttentionAlertDto> attention = List.of(
                AttentionAlertDto.builder()
                        .id("att-1")
                        .count("02")
                        .title("Blocked tasks")
                        .subtitle("Require your input")
                        .bgType("peach")
                        .url("#blocked-tasks")
                        .build(),
                AttentionAlertDto.builder()
                        .id("att-2")
                        .count("03")
                        .title("Tasks waiting for others")
                        .subtitle("No update in 2+ days")
                        .bgType("neutral")
                        .url("#waiting-tasks")
                        .build(),
                AttentionAlertDto.builder()
                        .id("att-3")
                        .count("01")
                        .title("Unread mention")
                        .subtitle("In Website Redesign")
                        .bgType("neutral")
                        .url("#mentions")
                        .build()
        );

        return DashboardDataDto.builder()
                .workspaceBreadcrumb("YOUR WORKSPACE / 01")
                .currentDateLabel(formattedDate)
                .dayNumber(dayNum)
                .dayOfWeek(dayOfWeek)
                .month(month)
                .year(year)
                .heroPriority(hero)
                .nowTasks(new ArrayList<>(nowTasks))
                .nextTasks(new ArrayList<>(nextTasks))
                .laterTasks(new ArrayList<>(laterTasks))
                .activities(activities)
                .schedule(schedule)
                .attentionItems(attention)
                .build();
    }

    public PriorityTaskDto toggleTask(String taskId) {
        for (List<PriorityTaskDto> list : List.of(nowTasks, nextTasks, laterTasks)) {
            for (PriorityTaskDto task : list) {
                if (task.getId().equals(taskId)) {
                    task.setCompleted(!task.isCompleted());
                    return task;
                }
            }
        }
        return null;
    }

    public PriorityTaskDto addTask(String column, String title, String tag) {
        String col = (column != null ? column.toUpperCase() : "NOW");
        List<PriorityTaskDto> targetList;
        String dot;
        String due;

        if ("NEXT".equals(col)) {
            targetList = nextTasks;
            dot = "orange";
            due = "Tomorrow";
        } else if ("LATER".equals(col)) {
            targetList = laterTasks;
            dot = "blue";
            due = "Next week";
        } else {
            targetList = nowTasks;
            dot = "red";
            due = "Today";
        }

        int nextIndex = nowTasks.size() + nextTasks.size() + laterTasks.size() + 1;
        PriorityTaskDto newTask = PriorityTaskDto.builder()
                .id("task-" + UUID.randomUUID().toString().substring(0, 8))
                .column(col)
                .indexNum(String.format("%02d", nextIndex))
                .title(title != null && !title.isBlank() ? title.trim() : "New priority task")
                .tag(tag != null && !tag.isBlank() ? tag.trim() : "General")
                .dueDateLabel(due)
                .dotColor(dot)
                .completed(false)
                .build();

        targetList.add(newTask);
        return newTask;
    }
}
