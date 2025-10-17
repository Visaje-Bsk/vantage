import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EstatusOrdenDB, estatusBadge } from '@/types/kanban';
import { Badge } from '@/components/ui/badge';

export type StatusFilterValue = EstatusOrdenDB | 'all';

interface StatusFilterProps {
  value: StatusFilterValue;
  onChange: (value: StatusFilterValue) => void;
}

export const StatusFilter: React.FC<StatusFilterProps> = ({ value, onChange }) => {
  const statusOptions: Array<{ value: StatusFilterValue; label: string; badgeColor?: string }> = [
    { value: 'all', label: 'Todos los Estados' },
    ...Object.entries(estatusBadge).map(([key, config]) => ({
      value: key as EstatusOrdenDB,
      label: config.label,
      badgeColor: config.color,
    })),
  ];

  // Obtener la etiqueta del valor actual
  const currentOption = statusOptions.find(opt => opt.value === value);
  const displayLabel = currentOption?.value === 'all' ? 'Estado' : currentOption?.label;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[200px] border-none bg-transparent hover:bg-muted/50 focus:ring-0 focus:ring-offset-0 h-auto py-1.5">
        <SelectValue placeholder="Estado">
          {currentOption?.badgeColor ? (
            <Badge variant="secondary" className={`text-xs ${currentOption.badgeColor}`}>
              {displayLabel}
            </Badge>
          ) : (
            <span className="text-sm font-medium text-muted-foreground">{displayLabel}</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center gap-2">
              {option.badgeColor ? (
                <Badge variant="secondary" className={`text-xs ${option.badgeColor}`}>
                  {option.label}
                </Badge>
              ) : (
                <span className="font-medium">{option.label}</span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
