import React, { forwardRef } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, ButtonProps } from "@/components/ui/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const confirmButtonVariants = cva("", {
  variants: {
    variant: {
      default: "",
      destructive: "",
      outline: "",
      secondary: "",
      ghost: "",
      link: "",
      success: "",
      warning: "",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface ConfirmDialogProps
  extends Omit<ButtonProps, "onClick">,
    VariantProps<typeof confirmButtonVariants> {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  children?: React.ReactNode;
  asChild?: boolean;
}

const ConfirmDialog = forwardRef<HTMLButtonElement, ConfirmDialogProps>(
  (
    {
      title = "Confirmar acción",
      description = "¿Estás seguro de que deseas continuar? Esta acción no se puede deshacer.",
      confirmText = "Confirmar",
      cancelText = "Cancelar",
      onConfirm,
      onCancel,
      children,
      variant,
      size,
      className,
      asChild = true,
      disabled,
      ...props
    },
    ref
  ) => {
    const handleConfirm = async () => {
      await onConfirm();
    };

    const handleCancel = () => {
      onCancel?.();
    };

    return (
      <AlertDialog>
        <AlertDialogTrigger asChild={asChild}>
          {children ? (
            children
          ) : (
            <Button
              ref={ref}
              variant={variant}
              size={size}
              className={cn(confirmButtonVariants({ variant }), className)}
              disabled={disabled}
              {...props}
            />
          )}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              {cancelText}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              {confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }
);

ConfirmDialog.displayName = "ConfirmDialog";

export { ConfirmDialog };

export { confirmButtonVariants };