import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FormField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  required?: boolean;
  options?: { value: string | number; label: string }[];
}

interface CatalogFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  title: string;
  fields: FormField[];
  initialData?: any;
  loading?: boolean;
}

export default function CatalogFormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  fields,
  initialData,
  loading = false
}: CatalogFormModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      // Reset form for new entries
      const emptyData: Record<string, any> = {};
      fields.forEach(field => {
        if (field.type === 'boolean') {
          emptyData[field.key] = false;
        } else {
          emptyData[field.key] = '';
        }
      });
      setFormData(emptyData);
    }
  }, [initialData, fields, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const requiredFields = fields.filter(field => field.required);
    const missingFields = requiredFields.filter(field => !formData[field.key]);
    
    if (missingFields.length > 0) {
      alert(`Campos requeridos: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    onSubmit(formData);
  };

  const handleFieldChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const renderField = (field: FormField) => {
    const value = formData[field.key] || '';

    switch (field.type) {
      case 'boolean':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <div className="flex items-center space-x-2">
              <Switch
                id={field.key}
                checked={value}
                onCheckedChange={(checked) => handleFieldChange(field.key, checked)}
              />
              <span className="text-sm text-muted-foreground">
                {value ? 'Sí' : 'No'}
              </span>
            </div>
          </div>
        );

      case 'select':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Select 
              value={value?.toString() || ''} 
              onValueChange={(val) => handleFieldChange(field.key, val)}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Seleccionar ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map(option => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'number':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={field.key}
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(field.key, Number(e.target.value))}
              required={field.required}
            />
          </div>
        );

      case 'date':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={field.key}
              type="date"
              value={value}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              required={field.required}
            />
          </div>
        );

      default: // text
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={field.key}
              type="text"
              value={value}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              required={field.required}
            />
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Editar registro existente' : 'Crear nuevo registro'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {fields.map(renderField)}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}