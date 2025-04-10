import { createClient } from '@supabase/supabase-js';

// Get the Supabase URL and key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for Supabase interactions
export const getVehicles = async () => {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data;
};

export const getReservations = async (startDate: Date, endDate: Date) => {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .gte('startTime', startDate.toISOString())
    .lte('endTime', endDate.toISOString());
  
  if (error) throw error;
  return data;
};

export const createReservation = async (reservation: any) => {
  const { data, error } = await supabase
    .from('reservations')
    .insert([reservation])
    .select();
  
  if (error) throw error;
  return data[0];
};

export const updateReservation = async (id: number, reservation: any) => {
  const { data, error } = await supabase
    .from('reservations')
    .update(reservation)
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data[0];
};

export const deleteReservation = async (id: number) => {
  const { error } = await supabase
    .from('reservations')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
};
