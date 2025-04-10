import { useTranslation } from "react-i18next";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  format, 
  addDays, 
  subDays, 
  startOfDay, 
  endOfDay, 
  parseISO, 
  differenceInMinutes,
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  getDaysInMonth,
  getDay,
  isToday,
  isWithinInterval,
  getDate,
  startOfWeek,
  endOfWeek 
} from "date-fns";
import { de } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { CalendarHeader } from "@/components/calendar/calendar-header";
import { ReservationModal } from "@/components/calendar/reservation-modal-fixed";
import { ConfirmationModal } from "@/components/calendar/confirmation-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Vehicle, Reservation } from "@shared/schema";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Car } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export default function Calendar() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'day' | 'month'>('month'); // Tagesansicht oder Monatsansicht
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Reset selected day when view mode changes to ensure calendar functions correctly
  useEffect(() => {
    if (viewMode === 'month') {
      setSelectedDay(null);
    }
  }, [viewMode]);
  
  // Date range for fetching - depends on view mode
  const dateRange = useMemo(() => {
    if (viewMode === 'day') {
      return {
        start: startOfDay(selectedDay || currentDate),
        end: endOfDay(selectedDay || currentDate)
      };
    } else { // 'month' mode
      return {
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
      };
    }
  }, [currentDate, viewMode, selectedDay]);
  
  const startDate = dateRange.start;
  const endDate = dateRange.end;
  
  // Format the displayed date with German locale
  const formattedDate = useMemo(() => {
    if (viewMode === 'day') {
      // Format for day: "Mittwoch, 10. Mai 2023"
      return format(selectedDay || currentDate, "EEEE, d. MMMM yyyy", { locale: de });
    } else { // 'month' mode
      return format(currentDate, "MMMM yyyy", { locale: de });
    }
  }, [currentDate, viewMode, selectedDay]);

  // Fetch vehicles
  const { data: vehicles, isLoading: loadingVehicles } = useQuery({
    queryKey: ['/api/vehicles'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Set the first vehicle as selected when vehicles are loaded
  useEffect(() => {
    if (vehicles && Array.isArray(vehicles) && vehicles.length > 0 && !selectedVehicleId) {
      setSelectedVehicleId((vehicles as Vehicle[])[0].id);
    }
  }, [vehicles, selectedVehicleId]);

  // Fetch reservations for the current date
  const { 
    data: reservations,
    isLoading: loadingReservations,
    isError: reservationsError
  } = useQuery({
    queryKey: ['/api/reservations', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const res = await fetch(
        `/api/reservations?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
      );
      if (!res.ok) throw new Error('Failed to fetch reservations');
      return res.json();
    }
  });

  // Delete reservation mutation
  const deleteReservation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/reservations/${id}`);
      return true;
    },
    onSuccess: () => {
      toast({
        title: t('success.deleted'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
      setIsConfirmationModalOpen(false);
      setIsReservationModalOpen(false); // Wichtig: Schließe auch das Reservierungsmodal
    },
    onError: (error) => {
      toast({
        title: String(error),
        variant: "destructive",
      });
    }
  });

  // Navigation functions - vary by view mode
  const goToPrevious = () => {
    if (viewMode === 'day') {
      const newDate = subDays(currentDate, 1);
      setCurrentDate(newDate);
      setSelectedDay(newDate);
    } else { // month mode
      setCurrentDate(subMonths(currentDate, 1));
    }
  };
  
  const goToNext = () => {
    if (viewMode === 'day') {
      const newDate = addDays(currentDate, 1);
      setCurrentDate(newDate);
      setSelectedDay(newDate);
    } else { // month mode
      setCurrentDate(addMonths(currentDate, 1));
    }
  };
  
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    // Wenn wir im Tagesansicht-Modus sind, setzen wir auch den selectedDay
    if (viewMode === 'day') {
      setSelectedDay(today);
    }
  };

  // Handlers
  const handleNewReservation = () => {
    setSelectedReservation(null);
    setIsReservationModalOpen(true);
  };

  const handleEditReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsReservationModalOpen(true);
  };

  // Funktion zum Öffnen des Löschdialogs
  const handleDeleteReservation = (reservation: Reservation) => {
    // Setze die ausgewählte Reservierung für die Löschung
    setSelectedReservation(reservation);
    // Öffne den Bestätigungsdialog
    setIsConfirmationModalOpen(true);
  };

  // Funktion, die bei Bestätigung der Löschung aufgerufen wird
  const confirmDelete = () => {
    if (selectedReservation) {
      // Reservierung löschen
      deleteReservation.mutate(selectedReservation.id);
      // Keine weiteren Aktionen nötig, da onSuccess-Handler in deleteReservation die Dialoge schließt
    }
  };

  // Funktion zum Schließen des Reservierungsmodals
  const closeReservationModal = () => {
    setIsReservationModalOpen(false);
    setSelectedReservation(null);
  };

  // Funktion zum Schließen des Bestätigungsdialogs
  const closeConfirmationModal = () => {
    setIsConfirmationModalOpen(false);
  };

  // Loading state
  if (loadingVehicles || !vehicles) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40 mt-4 md:mt-0" />
        </div>
        <Skeleton className="h-[600px] w-full rounded-lg" />
      </div>
    );
  }

  return (
    <>
      {/* Calendar Controls */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between">
        <div className="flex items-center mb-4 md:mb-0">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => goToPrevious()} 
            aria-label={t('calendar.previous')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-heading font-semibold mx-2">
            {formattedDate}
          </h2>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => goToNext()} 
            aria-label={t('calendar.next')}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={goToToday}
          >
            {t('calendar.today')}
          </Button>
          <div className="flex border rounded-md overflow-hidden">
            <Button 
              variant={viewMode === 'day' ? "default" : "ghost"}
              size="sm"
              className={viewMode === 'day' ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
              onClick={() => setViewMode('day')}
            >
              <CalendarIcon className="h-4 w-4 mr-1" />
              {t('calendar.day')}
            </Button>
            <Button 
              variant={viewMode === 'month' ? "default" : "ghost"}
              size="sm"
              className={viewMode === 'month' ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
              onClick={() => setViewMode('month')}
            >
              <CalendarIcon className="h-4 w-4 mr-1" />
              {t('calendar.month')}
            </Button>
          </div>
          <Button 
            variant="default" 
            onClick={handleNewReservation}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-1" />
            {t('calendar.newReservation')}
          </Button>
        </div>
      </div>

      {/* Calendar Display */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {loadingReservations ? (
          <Skeleton className="h-[600px] w-full rounded-lg" />
        ) : (
          <>
            {viewMode === 'month' ? (
              <div className="p-4">
                {/* Month Calendar View */}
                <div className="grid grid-cols-7 text-sm font-medium text-center mb-2">
                  {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
                    <div key={day} className="py-2">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {(() => {
                    // Generate calendar days
                    const daysInMonth = getDaysInMonth(currentDate);
                    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                    const startDay = getDay(firstDayOfMonth) || 7; // Get day of week (0-6, convert Sunday from 0 to 7)
                    
                    // Create array for all days in the calendar view
                    const days = [];
                    
                    // Add empty cells for days before the first day of month
                    for (let i = 1; i < startDay; i++) {
                      days.push(
                        <div 
                          key={`empty-${i}`} 
                          className="h-24 bg-gray-50 p-1 text-gray-400"
                        />
                      );
                    }
                    
                    // Add cells for each day in month
                    for (let day = 1; day <= daysInMonth; day++) {
                      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                      const isCurrentDay = isToday(date);
                      
                      // Check if this day has reservations
                      const dayReservations = Array.isArray(reservations) 
                        ? reservations.filter(r => {
                            const startTime = new Date(r.startTime);
                            const endTime = new Date(r.endTime);
                            return isWithinInterval(date, { start: startOfDay(startTime), end: endOfDay(endTime) });
                          })
                        : [];
                      
                      days.push(
                        <div 
                          key={day}
                          className={`h-24 border p-1 cursor-pointer transition-colors hover:bg-gray-50 ${
                            isCurrentDay ? 'bg-blue-50 border-blue-300' : ''
                          }`}
                          onClick={() => {
                            const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                            setSelectedDay(selectedDate);
                            setCurrentDate(selectedDate);
                            setViewMode('day');
                          }}
                        >
                          <div className="flex justify-between">
                            <span className={`${isCurrentDay ? 'font-bold text-blue-700' : ''}`}>
                              {day}
                            </span>
                            {dayReservations.length > 0 && (
                              <span className="inline-flex items-center justify-center w-5 h-5 text-xs bg-primary text-white rounded-full">
                                {dayReservations.length}
                              </span>
                            )}
                          </div>
                          
                          {/* Show max 2 reservation previews */}
                          <div className="mt-1 space-y-1 overflow-hidden" style={{ maxHeight: "3.5rem" }}>
                            {dayReservations.slice(0, 2).map(reservation => {
                              // Get the vehicle and its color
                              const vehicle = (vehicles as Vehicle[]).find(v => v.id === reservation.vehicleId);
                              const vIndex = vehicle ? (vehicles as Vehicle[]).indexOf(vehicle) : 0;
                              // Use vehicle's color if available, otherwise fallback to index-based color
                              const defaultColorHues = [210, 160, 340, 20, 270, 60, 310];
                              const colorHue = vehicle?.colorHue || defaultColorHues[vIndex % defaultColorHues.length];
                              
                              return (
                                <div 
                                  key={reservation.id}
                                  className="text-xs text-white p-1 rounded truncate"
                                  style={{ backgroundColor: `hsl(${colorHue}, 65%, 35%)` }}
                                >
                                  {format(new Date(reservation.startTime), 'HH:mm')}: {reservation.userName}
                                </div>
                              );
                            })}
                            {dayReservations.length > 2 && (
                              <div className="text-xs text-gray-600 text-center">
                                +{dayReservations.length - 2} weitere
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    
                    // Add empty cells for days after the last day of month to complete grid
                    const totalDays = days.length;
                    const remainingCells = 42 - totalDays; // 6 rows × 7 days = 42 cells
                    
                    // Only add remaining cells if we need to show a 6th row
                    if (totalDays > 35) {
                      for (let i = 1; i <= remainingCells; i++) {
                        days.push(
                          <div 
                            key={`empty-end-${i}`} 
                            className="h-24 bg-gray-50 p-1 text-gray-400"
                          />
                        );
                      }
                    }
                    
                    return days;
                  })()}
                </div>
              </div>
            ) : (
              // Day View
              <>
                <CalendarHeader vehicles={vehicles as Vehicle[]} />
                <div className="relative">
                  {/* Time Labels Column */}
                  <div className="time-labels absolute left-0 top-0 bottom-0 w-20 bg-white z-10">
                    {Array.from({ length: 24 }, (_, i) => i).map(hour => (
                      <div key={hour} className="time-slot border-b py-1 px-2 text-xs text-neutral-medium" style={{ height: '6rem' }}>
                        <div className="relative -top-3">{`${hour}:00`}</div>
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="ml-20 grid" style={{ 
                    gridTemplateColumns: `repeat(${Array.isArray(vehicles) ? vehicles.length : 1}, 1fr)`,
                    height: `${24 * 6}rem` 
                  }}>
                    {/* Create grid cells for each vehicle */}
                    {Array.isArray(vehicles) && vehicles.map((vehicle, vIndex) => (
                      <div key={vehicle.id} className="relative">
                        {Array.from({ length: 24 }, (_, i) => i).map(hour => (
                          <div 
                            key={`${vehicle.id}-${hour}`} 
                            className="time-slot border-b border-r cursor-pointer transition-colors hover:bg-gray-50"
                            style={{ height: '6rem' }}
                            onClick={() => {
                              // Erstelle eine neue Reservierung mit dem ausgewählten Datum und der angeklickten Stunde
                              // Wichtig: Wir müssen eine neue Datumsinstanz erstellen, um nicht das currentDate zu verändern
                              // Wir nutzen den selectedDay, wenn er existiert, ansonsten das currentDate
                              const baseDate = selectedDay || currentDate;
                              const selectedDate = new Date(
                                baseDate.getFullYear(),
                                baseDate.getMonth(),
                                baseDate.getDate(),
                                hour, // Die ausgewählte Stunde
                                0,    // Minuten auf 0 setzen
                                0     // Sekunden auf 0 setzen
                              );
                              
                              // Setze alle erforderlichen Zustandsvariablen
                              setSelectedVehicleId(vehicle.id);
                              setSelectedReservation(null);
                              
                              // Jetzt erst öffnen wir das Modal mit dem neu eingestellten Datum
                              setTimeout(() => {
                                setIsReservationModalOpen(true);
                              }, 0);
                              
                              // Setze nur das currentDate (wird an ReservationModal übergeben)
                              setCurrentDate(selectedDate);
                            }}
                          />
                        ))}
                        
                        {/* Render reservations for this vehicle */}
                        {Array.isArray(reservations) && 
                          reservations
                            .filter(r => r.vehicleId === vehicle.id)
                            .map(reservation => {
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
                              const startFromZero = startHour * 60 + startMinutes;
                              const top = (startFromZero / 60) * 6; // 6rem per hour
                              
                              // Calculate height (6rem per hour)
                              const height = (durationMinutes / 60) * 6; // 6rem per hour
                              
                              // Use vehicle's color if available, otherwise fallback to index-based color
                              const defaultColorHues = [210, 160, 340, 20, 270, 60, 310];
                              const colorHue = vehicle.colorHue || defaultColorHues[vIndex % defaultColorHues.length];

                              // Reservierungen werden jetzt im vollen 24-Stunden-Bereich angezeigt
                          
                              return (
                                <div
                                  key={reservation.id}
                                  className="reservation absolute text-white rounded z-10 shadow-md cursor-pointer"
                                  style={{
                                    top: `${top}rem`,
                                    height: `${height}rem`,
                                    left: '4px',
                                    right: '4px',
                                    backgroundColor: `hsl(${colorHue}, 65%, 35%)`
                                  }}
                                  onClick={() => handleEditReservation(reservation)}
                                >
                                  <div className="p-2 overflow-hidden">
                                    <div className="font-bold text-sm truncate">{reservation.userName}</div>
                                    <div className="text-xs truncate">{reservation.reason}</div>
                                    <div className="text-xs mt-1">
                                      {format(new Date(reservation.startTime), 'HH:mm')} - {format(new Date(reservation.endTime), 'HH:mm')}
                                    </div>

                                  </div>
                                </div>
                              );
                            })
                        }
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {isReservationModalOpen && (
        <ReservationModal 
          isOpen={isReservationModalOpen} 
          onClose={closeReservationModal} 
          reservation={selectedReservation} 
          vehicles={vehicles as Vehicle[]}
          currentDate={currentDate}
          onDelete={handleDeleteReservation}
        />
      )}

      {isConfirmationModalOpen && (
        <ConfirmationModal 
          isOpen={isConfirmationModalOpen} 
          onClose={closeConfirmationModal} 
          onConfirm={confirmDelete}
          isPending={deleteReservation.isPending}
        />
      )}
    </>
  );
}
