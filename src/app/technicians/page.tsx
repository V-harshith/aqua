'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
interface Technician {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  is_available: boolean;
}
export default function TechniciansPage() {
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    loadTechnicians();
  }, []);
  const loadTechnicians = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/technicians');
      const result = await response.json();
      if (result.success) {
        setTechnicians(result.technicians || []);
      } else {
        showError({ title: 'Failed to load technicians' });
      }
    } catch (error) {
      showError({ title: 'Failed to load technicians' });
    } finally {
      setIsLoading(false);
    }
  };
  const updateAvailability = async (technicianId: string, availability: boolean) => {
    try {
      const response = await fetch('/api/technicians', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technicianId, availability })
      });
      const result = await response.json();
      if (result.success) {
        showSuccess({ title: 'Availability updated' });
        loadTechnicians();
      } else {
        showError({ title: 'Failed to update' });
      }
    } catch (error) {
      showError({ title: 'Failed to update' });
    }
  };
  if (isLoading) {
    return <div className="p-6"><div className="animate-pulse">Loading...</div></div>;
  }
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Technician Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {technicians.map((technician) => (
          <Card key={technician.id} className="p-4">
            <h3 className="font-semibold">{technician.full_name}</h3>
            <p className="text-sm text-gray-600">{technician.email}</p>
            <p className="text-sm text-gray-600">{technician.phone}</p>
            <div className="mt-4">
              <span className={`px-2 py-1 rounded text-xs ${
                technician.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {technician.is_available ? 'Available' : 'Busy'}
              </span>
            </div>
            <Button
              size="sm"
              className="mt-3 w-full"
              onClick={() => updateAvailability(technician.id, !technician.is_available)}
            >
              Toggle Status
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
} 