package com.example.smartgarage.service;

import com.example.smartgarage.entity.User;
import com.example.smartgarage.enums.MembershipTier;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class MembershipService {
    public static final int POINTS_PER_COMPLETED_BOOKING = 2;
    private static final BigDecimal ZERO_DISCOUNT = BigDecimal.ZERO;
    private static final BigDecimal BRONZE_DISCOUNT = new BigDecimal("0.10");
    private static final BigDecimal SILVER_DISCOUNT = new BigDecimal("0.15");
    private static final BigDecimal GOLD_DISCOUNT = new BigDecimal("0.20");

    public MembershipTier resolveTier(int points) {
        if (points >= 30) {
            return MembershipTier.GOLD;
        }
        if (points >= 20) {
            return MembershipTier.SILVER;
        }
        if (points >= 10) {
            return MembershipTier.BRONZE;
        }
        return MembershipTier.REGULAR;
    }

    public BigDecimal resolveDiscountRate(MembershipTier tier) {
        if (tier == null) {
            return ZERO_DISCOUNT;
        }

        return switch (tier) {
            case BRONZE -> BRONZE_DISCOUNT;
            case SILVER -> SILVER_DISCOUNT;
            case GOLD -> GOLD_DISCOUNT;
            case REGULAR -> ZERO_DISCOUNT;
        };
    }

    public void rewardPoints(User user, int earnedPoints) {
        int currentPoints = user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() : 0;
        int updatedPoints = currentPoints + Math.max(earnedPoints, 0);
        user.setLoyaltyPoints(updatedPoints);
        user.setMembershipTier(resolveTier(updatedPoints));
    }
}
