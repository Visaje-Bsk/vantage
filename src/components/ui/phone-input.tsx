import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface CountryCode {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: "CO", name: "Colombia", flag: "🇨🇴", dialCode: "+57" },
  { code: "US", name: "Estados Unidos", flag: "🇺🇸", dialCode: "+1" },
  { code: "MX", name: "México", flag: "🇲🇽", dialCode: "+52" },
  { code: "ES", name: "España", flag: "🇪🇸", dialCode: "+34" },
  { code: "AR", name: "Argentina", flag: "🇦🇷", dialCode: "+54" },
  { code: "CL", name: "Chile", flag: "🇨🇱", dialCode: "+56" },
  { code: "PE", name: "Perú", flag: "🇵🇪", dialCode: "+51" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨", dialCode: "+593" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪", dialCode: "+58" },
  { code: "BR", name: "Brasil", flag: "🇧🇷", dialCode: "+55" },
];

export interface PhoneInputProps {
  value?: string; // Formato completo: "+57 3202422311"
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: string;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value = "", onChange, onBlur, placeholder = "320 242 2311", className, disabled, error }, ref) => {
    // Separar el código de país y el número
    const parsePhoneNumber = (fullNumber: string): { dialCode: string; number: string } => {
      if (!fullNumber) return { dialCode: "+57", number: "" };

      const match = fullNumber.match(/^(\+\d{1,4})\s?(.*)$/);
      if (match) {
        return { dialCode: match[1], number: match[2].replace(/\s/g, "") };
      }
      return { dialCode: "+57", number: fullNumber.replace(/\s/g, "") };
    };

    const { dialCode, number } = parsePhoneNumber(value);
    const [selectedDialCode, setSelectedDialCode] = React.useState(dialCode);
    const [phoneNumber, setPhoneNumber] = React.useState(number);

    // Actualizar cuando cambia el valor externo
    React.useEffect(() => {
      const parsed = parsePhoneNumber(value);
      setSelectedDialCode(parsed.dialCode);
      setPhoneNumber(parsed.number);
    }, [value]);

    // Formatear el número para visualización (agregar espacios)
    const formatPhoneForDisplay = (num: string): string => {
      const cleaned = num.replace(/\D/g, "");
      if (cleaned.length <= 3) return cleaned;
      if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
      if (cleaned.length <= 9) return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;
    };

    const handleDialCodeChange = (newDialCode: string) => {
      setSelectedDialCode(newDialCode);
      const cleanNumber = phoneNumber.replace(/\s/g, "");
      onChange?.(cleanNumber ? `${newDialCode} ${cleanNumber}` : "");
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      // Permitir solo dígitos y espacios
      const cleaned = inputValue.replace(/[^\d\s]/g, "");
      // Limitar a 15 dígitos
      const digitsOnly = cleaned.replace(/\s/g, "");
      if (digitsOnly.length > 15) return;

      setPhoneNumber(digitsOnly);
      onChange?.(digitsOnly ? `${selectedDialCode} ${digitsOnly}` : "");
    };

    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <div className="flex gap-2">
          <Select value={selectedDialCode} onValueChange={handleDialCodeChange} disabled={disabled}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRY_CODES.map((country) => (
                <SelectItem key={country.code} value={country.dialCode}>
                  <span className="flex items-center gap-2">
                    <span>{country.flag}</span>
                    <span>{country.dialCode}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            ref={ref}
            type="tel"
            inputMode="numeric"
            value={formatPhoneForDisplay(phoneNumber)}
            onChange={handleNumberChange}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(error && "border-red-300", "flex-1")}
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";
