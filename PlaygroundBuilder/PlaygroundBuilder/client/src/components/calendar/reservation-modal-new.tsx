import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  Vehicle, 
  Reservation,
  reservationValidationSchema,
  type ReservationValidation 
} from "@shared/schema";
import { format, addHours, isAfter, parseISO } from "date-fns";
import { z } from "zod";

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  vehicles: Vehicle[];
  currentDate: Date;
  onDelete?: (reservation: Reservation) => void;
}

export function ReservationModal({ 
  isOpen, 
  onClose, 
  reservation, 
  vehicles,
  currentDate,
  onDelete
}: ReservationModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const isEditing = !!reservation;

  // Extended schema with validation
  const formSchema = reservationValidationSchema.extend({
    startTime: z.string().refine(val => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, { message: t('error.invalidDate') }),
    endTime: z.string().refine(val => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, { message: t('error.invalidDate') }),
  }).refine(data => {
    // Korrekte Datumsvergleichung ohne Zeitzonenprobleme
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    return isAfter(end, start);
  }, {
    message: t('error.endBeforeStart'),
    path: ['endTime']
  });
  
  // Hilfsfunktion für lokale Zeitformatierung, berücksichtigt Sommerzeit
  const formatLocalTime = (date: Date) => {
    // Manuelles Formatieren der lokalen Zeit unter Berücksichtigung der Sommerzeit
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  
  // Berechne Standardwerte für das Formular
  const getDefaultValues = () => {
    // Wenn eine existierende Reservierung bearbeitet wird
    if (reservation) {
      // Konvertiere das Datumsformat korrekt für datetime-local Input
      const startTime = new Date(reservation.startTime);
      const endTime = new Date(reservation.endTime);
      
      // Nutze die Formatierungsfunktion für lokale Zeit
      const formattedStartTime = formatLocalTime(startTime);
      const formattedEndTime = formatLocalTime(endTime);
      
      return {
        userName: reservation.userName,
        reason: reservation.reason,
        notes: reservation.notes || '',
        vehicleId: reservation.vehicleId,
        startTime: formattedStartTime,
        endTime: formattedEndTime
      };
    }
    
    // Für neue Reservierungen
    let initialDate;
    
    // Wenn ein Datum durch Klick in der Kalenderansicht ausgewählt wurde
    if (currentDate) {
      initialDate = new Date(currentDate);
    } else {
      // Aktuelles Datum und Uhrzeit
      initialDate = new Date();
      // Runde auf die nächsten 15 Minuten
      initialDate.setMinutes(Math.ceil(initialDate.getMinutes() / 15) * 15);
      initialDate.setSeconds(0);
      initialDate.setMilliseconds(0);
    }
    
    // Endzeit 1 Stunde später
    const endDate = new Date(initialDate);
    endDate.setHours(initialDate.getHours() + 1);
    
    // Format: YYYY-MM-DDThh:mm
    // Wir nutzen die bereits definierte Formatierungsfunktion
    
    const formattedStartTime = formatLocalTime(initialDate);
    const formattedEndTime = formatLocalTime(endDate);
    
    return {
      userName: '',
      reason: '',
      notes: '',
      vehicleId: vehicles.length > 0 ? vehicles[0].id : 0,
      startTime: formattedStartTime,
      endTime: formattedEndTime
    };
  };
  
  // Form setup
  const form = useForm<ReservationValidation>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues() as any // Type cast to avoid type errors
  });
  
  // Create mutation
  const createReservation = useMutation({
    mutationFn: async (data: ReservationValidation) => {
      const response = await apiRequest('POST', '/api/reservations', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('success.created'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: error.message || t('error.overlap'),
        variant: "destructive",
      });
    }
  });
  
  // Update mutation
  const updateReservation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ReservationValidation }) => {
      const response = await apiRequest('PUT', `/api/reservations/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('success.updated'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: error.message || t('error.overlap'),
        variant: "destructive",
      });
    }
  });
  
  // Form submission
  const onSubmit = (data: ReservationValidation) => {
    if (isEditing && reservation) {
      updateReservation.mutate({ id: reservation.id, data });
    } else {
      createReservation.mutate(data);
    }
  };

  // Wenn sich defaultValues ändern (z.B. durch Datumswechsel), 
  // aktualisiere das Formular
  useEffect(() => {
    if (!isEditing) {
      const values = getDefaultValues();
      Object.entries(values).forEach(([key, value]) => {
        form.setValue(key as any, value);
      });
    }
  }, [currentDate, isEditing, form]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('reservation.edit') : t('reservation.title')}
          </DialogTitle>
          <DialogDescription>
            {t('reservation.description')}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('reservation.name')} <span className="text-destructive">{t('reservation.required')}</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('reservation.namePlaceholder')} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('reservation.reason')} <span className="text-destructive">{t('reservation.required')}</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('reservation.reasonPlaceholder')} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="vehicleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('reservation.vehicle')} <span className="text-destructive">{t('reservation.required')}</span>
                  </FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(Number(value))}
                    defaultValue={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('reservation.selectVehicle')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vehicles.map(vehicle => {
                        // Zuordnung der Fahrzeugfarben konsistent mit Kalender
                        const defaultColorHues = [210, 160, 340, 20, 270, 60, 310];
                        const vIndex = vehicles.indexOf(vehicle);
                        const colorHue = vehicle.colorHue || defaultColorHues[vIndex % defaultColorHues.length];
                        
                        return (
                          <SelectItem key={vehicle.id} value={String(vehicle.id)}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="h-3 w-3 rounded-full" 
                                style={{ backgroundColor: `hsl(${colorHue}, 65%, 35%)` }}
                              />
                              {vehicle.name} ({vehicle.licensePlate})
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('reservation.startTime')} <span className="text-destructive">{t('reservation.required')}</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="datetime-local" 
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        value={field.value as string}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('reservation.endTime')} <span className="text-destructive">{t('reservation.required')}</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="datetime-local" 
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        value={field.value as string}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('reservation.notes')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('reservation.notesPlaceholder')} 
                      className="resize-none" 
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      value={field.value as string}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-6 flex justify-between w-full">
              <div>
                {isEditing && reservation && onDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      if (reservation && onDelete) {
                        onDelete(reservation);
                      }
                    }}
                  >
                    {t('reservation.delete')}
                  </Button>
                )}
              </div>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                >
                  {t('reservation.cancel')}
                </Button>
                <Button 
                  type="submit"
                  disabled={createReservation.isPending || updateReservation.isPending}
                >
                  {t('reservation.save')}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}