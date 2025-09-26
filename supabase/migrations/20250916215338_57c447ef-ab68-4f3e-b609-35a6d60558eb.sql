-- Fix security linter warnings

-- Update existing functions to have proper search_path
CREATE OR REPLACE FUNCTION public.has_role(r app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = r
  )
$$;

CREATE OR REPLACE FUNCTION public.auth_uid()
RETURNS uuid
LANGUAGE SQL
STABLE
SET search_path = public
AS $$ 
  SELECT auth.uid() 
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nombre, role)
  VALUES (new.id, coalesce(new.raw_user_meta_data->>'nombre',''), 'comercial');
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.touch_fecha_modificacion()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  new.fecha_modificacion = now();
  RETURN new;
END;
$$;