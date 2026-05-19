package com.example.smartgarage.dto.booking;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailableBookingSlotResponse {
    private Long branchId;
    private LocalDate date;
    private int slotDurationMinutes;
    private int slotIntervalMinutes;
    private int branchCapacity;
    private List<SlotItem> slots;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SlotItem {
        private java.time.LocalDateTime start;
        private java.time.LocalDateTime end;
        private int remainingCapacity;
    }
}
