package com.example.smartgarage.dto;

import com.example.smartgarage.entity.Part;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceResponse {
    private Long id;
    private String name;
    private BigDecimal price;

    //Danh sách linh kiện gợi ý cho dịch vụ
    private List<Part> suggestedParts;
}
