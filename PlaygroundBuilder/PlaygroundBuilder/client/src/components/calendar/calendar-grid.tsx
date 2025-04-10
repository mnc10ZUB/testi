import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { Vehicle, Reservation } from "@shared/schema";

interface CalendarGridProps {
  vehicles: Vehicle[];
  reservations: Reservation[];
  onEditReservation: (reservation: Reservation) => void;
  onDeleteReservation: (reservation: Reservation) => void;
}

// Generate time slots from 8:00 to 18:00
const TIME_SLOTS = Array.from({ length: 11 }, (_, i) => 8 + i);

export function CalendarGrid({ 
  vehicles, 
  reservations, 
  onEditReservation,
  onDeleteReservation
}: CalendarGridProps) {
  const { t } = useTranslation();
  
  // Group reservations by vehicle
  const reservationsByVehicle = useMemo(() => {
    const grouped: Record<number, Reservation[]> = {};
    
    vehicles.forEach(vehicle => {
      grouped[vehicle.id] = reservations.filter(
        reservation => reservation.vehicleId === vehicle.id
      );
    });
    
    return grouped;
  }, [vehicles, reservations]);
  
  // Calculate reservation positioning
  const getReservationStyle = (reservation: Reservation) => {
    // Convert times to Date objects if they're strings
    const startTime = typeof reservation.startTime === 'string' 
      ? new Date(reservation.startTime) 
      : reservation.startTime;
    
    const endTime = typeof reservation.endTime === 'string' 
      ? new Date(reservation.endTime) 
      : reservation.endTime;
    
    // Calculate position based on time
    const startHour = startTime.getHours();
    const startMinutes = startTime.getMinutes();
    const durationMinutes = differenceInMinutes(endTime, startTime);
    
    // Calculate top position (6rem per hour)
    const startFromEight = (startHour - 8) * 60 + startMinutes;
    const top = (startFromEight / 60) * 6; // 6rem per hour
    
    // Calculate height (6rem per hour)
    const height = (durationMinutes / 60) * 6; // 6rem per hour
    
    return {
      top: `${top}rem`,
      height: `${height}rem`,
    };
  };
  
  // Handle right-click for context menu
  const handleContextMenu = (
    e: React.MouseEvent<HTMLDivElement>, 
    reservation: Reservation
  ) => {
    e.preventDefault();
    onDeleteReservation(reservation);
  };

  return (
    <div className="relative">
      {/* Time Labels Column */}
      <div className="time-labels absolute left-0 top-0 bottom-0 w-20 bg-white z-10">
        {TIME_SLOTS.map(hour => (
          <div key={hour} className="time-slot border-b py-1 px-2 text-xs text-neutral-medium">
            <div className="relative -top-3">{`${hour}:00`}</div>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="ml-20 grid" style={{ gridTemplateColumns: `repeat(${vehicles.length}, 1fr)` }}>
        {/* Create grid cells */}
        {vehicles.map(vehicle => (
          <div key={vehicle.id} className="relative" style={{ height: `${TIME_SLOTS.length * 6}rem` }}>
            {TIME_SLOTS.map(hour => (
              <div 
                key={`${vehicle.id}-${hour}`} 
                className="time-slot border-b border-r"
                style={{ height: '6rem' }}
              />
            ))}
            
            {/* Render reservations for this vehicle */}
            {reservationsByVehicle[vehicle.id]?.map(reservation => (
              <div
                key={reservation.id}
                className="reservation absolute text-white rounded z-10 shadow-md cursor-pointer"
                style={{
                  ...getReservationStyle(reservation),
                  left: '4px',
                  right: '4px',
                  backgroundColor: 'hsl(var(--primary))'
                }}
                onClick={() => onEditReservation(reservation)}
                onContextMenu={(e) => handleContextMenu(e, reservation)}
              >
                <div className="p-2">
                  <div className="font-bold text-sm">{reservation.userName}</div>
                  <div className="text-xs">{reservation.reason}</div>
                  <div className="text-xs mt-1">
                    {format(new Date(reservation.startTime), 'HH:mm')} - {format(new Date(reservation.endTime), 'HH:mm')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
