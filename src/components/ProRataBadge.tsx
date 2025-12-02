import React from 'react';
import { Badge, Tooltip } from '@chakra-ui/react';
import { TimeIcon } from '@chakra-ui/icons';

interface ProRataBadgeProps {
  /**
   * Hiển thị tooltip với thông tin chi tiết
   */
  tooltipText?: string;
  /**
   * Kích thước của badge
   */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Badge hiển thị khi hóa đơn được tính theo Pro-rata
 * 
 * Sử dụng:
 * ```tsx
 * {bill.is_prorated && (
 *   <ProRataBadge tooltipText="Tính theo tỷ lệ: Chuyển vào 15/12/2024" />
 * )}
 * ```
 */
export const ProRataBadge: React.FC<ProRataBadgeProps> = ({
  tooltipText = "Hóa đơn được tính theo tỷ lệ số ngày ở thực tế (Pro-rata)",
  size = 'sm',
}) => {
  return (
    <Tooltip label={tooltipText} hasArrow placement="top">
      <Badge
        colorScheme="blue"
        variant="solid"
        fontSize={size === 'sm' ? '0.7em' : size === 'md' ? '0.8em' : '0.9em'}
        display="flex"
        alignItems="center"
        gap="1"
        px="2"
        py="0.5"
      >
        <TimeIcon boxSize="3" />
        Pro-rata
      </Badge>
    </Tooltip>
  );
};

export default ProRataBadge;
