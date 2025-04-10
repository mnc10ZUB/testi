import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage,
  FormDescription 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertVehicleSchema, type Vehicle } from "@shared/schema";
import { z } from "zod";
import { Plus, Edit, Trash } from "lucide-react";

// Extended schema with validation rules
const vehicleFormSchema = insertVehicleSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  licensePlate: z.string().min(1, "License plate is required"),
});

type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

export default function Vehicles() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

  // Form setup
  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      name: "",
      licensePlate: "",
      description: "",
      colorHue: 210, // Default blue color
      isActive: 1,
    },
  });

  // Fetch vehicles
  const { data: vehicles = [], isLoading } = useQuery<Vehicle[]>({
    queryKey: ['/api/vehicles'],
  });

  // Create vehicle mutation
  const createVehicle = useMutation({
    mutationFn: async (data: VehicleFormValues) => {
      const response = await apiRequest('POST', '/api/vehicles', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('success.created'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: String(error),
        variant: "destructive",
      });
    }
  });

  // Update vehicle mutation
  const updateVehicle = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: VehicleFormValues }) => {
      const response = await apiRequest('PUT', `/api/vehicles/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('success.updated'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      setIsDialogOpen(false);
      setEditingVehicle(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: String(error),
        variant: "destructive",
      });
    }
  });

  // Delete vehicle mutation
  const deleteVehicle = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/vehicles/${id}`);
      return true;
    },
    onSuccess: () => {
      toast({
        title: t('success.deleted'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      setIsConfirmDialogOpen(false);
      setVehicleToDelete(null);
    },
    onError: (error) => {
      toast({
        title: String(error),
        variant: "destructive",
      });
    }
  });

  // Form submission
  const onSubmit = (data: VehicleFormValues) => {
    if (editingVehicle) {
      updateVehicle.mutate({ id: editingVehicle.id, data });
    } else {
      createVehicle.mutate(data);
    }
  };

  // Handle opening form dialog for new vehicle
  const handleAddVehicle = () => {
    setEditingVehicle(null);
    form.reset({
      name: "",
      licensePlate: "",
      description: "",
      colorHue: 210, // Default blue color
      isActive: 1,
    });
    setIsDialogOpen(true);
  };

  // Handle opening form dialog for editing
  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    form.reset({
      name: vehicle.name,
      licensePlate: vehicle.licensePlate,
      description: vehicle.description || "",
      colorHue: vehicle.colorHue || 210,
      isActive: vehicle.isActive,
    });
    setIsDialogOpen(true);
  };

  // Handle deleting a vehicle
  const handleDeleteClick = (vehicle: Vehicle) => {
    setVehicleToDelete(vehicle);
    setIsConfirmDialogOpen(true);
  };

  const confirmDelete = () => {
    if (vehicleToDelete) {
      deleteVehicle.mutate(vehicleToDelete.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('vehicles.title')}</h1>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('vehicles.title')}</h1>
        <Button onClick={handleAddVehicle}>
          <Plus className="mr-2 h-4 w-4" />
          {t('vehicles.add')}
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('vehicles.name')}</TableHead>
              <TableHead>{t('vehicles.licensePlate')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('vehicles.description')}</TableHead>
              <TableHead>{t('vehicles.color')}</TableHead>
              <TableHead>{t('vehicles.status')}</TableHead>
              <TableHead className="text-right">{t('vehicles.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles && vehicles.length > 0 ? (
              vehicles.map((vehicle: Vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">{vehicle.name}</TableCell>
                  <TableCell>{vehicle.licensePlate}</TableCell>
                  <TableCell className="hidden md:table-cell">{vehicle.description}</TableCell>
                  <TableCell>
                    <div 
                      className="h-6 w-6 rounded-full border"
                      style={{ backgroundColor: `hsl(${vehicle.colorHue || 210}, 65%, 35%)` }}
                      title={`Farbton: ${vehicle.colorHue || 210}`}
                    />
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      vehicle.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {vehicle.isActive ? t('vehicles.active') : t('vehicles.inactive')}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditVehicle(vehicle)}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">{t('vehicles.edit')}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(vehicle)}
                    >
                      <Trash className="h-4 w-4" />
                      <span className="sr-only">{t('vehicles.delete')}</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  No vehicles found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Vehicle Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingVehicle ? t('vehicles.edit') : t('vehicles.add')}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('vehicles.name')} <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="licensePlate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('vehicles.licensePlate')} <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('vehicles.description')}</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="colorHue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('vehicles.color')}</FormLabel>
                    <div className="space-y-4">
                      <FormControl>
                        <Slider
                          min={0}
                          max={360}
                          step={1}
                          value={[field.value || 210]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                      <div 
                        className="h-12 w-full rounded-md border border-input"
                        style={{ backgroundColor: `hsl(${field.value || 210}, 65%, 35%)` }}
                      />
                      <FormDescription>
                        {t('vehicles.colorHelp')}
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        {t('vehicles.status')}
                      </FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value === 1}
                        onCheckedChange={(checked) => {
                          field.onChange(checked ? 1 : 0);
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  {t('reservation.cancel')}
                </Button>
                <Button 
                  type="submit"
                  disabled={createVehicle.isPending || updateVehicle.isPending}
                >
                  {t('reservation.save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('confirm.deleteTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-center py-4">
            {t('confirm.deleteMessage')}
          </p>
          <DialogFooter className="flex sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConfirmDialogOpen(false)}
            >
              {t('confirm.cancel')}
            </Button>
            <Button 
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteVehicle.isPending}
            >
              {t('confirm.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
