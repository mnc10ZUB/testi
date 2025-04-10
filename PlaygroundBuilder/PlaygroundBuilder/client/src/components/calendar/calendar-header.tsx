import { useTranslation } from "react-i18next";
import { Vehicle } from "@shared/schema";

interface CalendarHeaderProps {
  vehicles: Vehicle[];
}

export function CalendarHeader({ vehicles }: CalendarHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="calendar-header flex border-b">
      <div className="w-20 py-3 px-2 text-center font-medium text-neutral-medium border-r">
        {t('calendar.time')}
      </div>
      
      {vehicles.map(vehicle => {
        // Default color for fallback - konsistent mit der Farbe in der Kalenderansicht
        const defaultColorHues = [210, 160, 340, 20, 270, 60, 310];
        const vIndex = vehicles.indexOf(vehicle);
        const colorHue = vehicle.colorHue || defaultColorHues[vIndex % defaultColorHues.length];
        
        return (
          <div key={vehicle.id} className="flex-1 py-3 px-2 text-center font-medium border-r">
            <div className="flex items-center justify-center gap-2">
              <div 
                className="h-4 w-4 rounded-full border" 
                style={{ backgroundColor: `hsl(${colorHue}, 65%, 35%)` }}
              />
              <div className="text-primary font-bold">{vehicle.name}</div>
            </div>
            <div className="text-xs text-neutral-medium">{vehicle.licensePlate}</div>
          </div>
        );
      })}
    </div>
  );
}
