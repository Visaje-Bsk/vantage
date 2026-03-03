# Entornos de Base de Datos

## Situación actual (desde marzo 2026)

| Entorno | Proyecto Supabase | Quién lo usa |
|---|---|---|
| **Desarrollo local** | `ldkjcvuahfyxgnbyitqm` | Julian + compañero (trabajo diario) |
| **Servidor Ubuntu** | `coyyavooqplsywtxelou` | Producción final (usuarios finales) |

## Regla de trabajo

- **Todos los cambios y pruebas** se hacen contra `ldkjcvuahfyxgnbyitqm`
- `coyyavooqplsywtxelou` es la BD final del servidor — **no se modifica durante el desarrollo**
- Cuando una feature esté lista y probada en local, se sincroniza manualmente a `coyyavooqplsywtxelou`

## Archivos .env

```
.env              → ldkjcvuahfyxgnbyitqm  (npm run dev — trabajo local)
.env.production   → coyyavooqplsywtxelou  (npm run build — bundle para servidor Ubuntu)
```

Ambos archivos están en `.gitignore`. El compañero configura su propio `.env` con las credenciales de `ldkjcvuahfyxgnbyitqm`.

## Credenciales

- `ldkjcvuahfyxgnbyitqm`: URL `https://ldkjcvuahfyxgnbyitqm.supabase.co`
- `coyyavooqplsywtxelou`: URL `https://coyyavooqplsywtxelou.supabase.co`, publishable key `sb_publishable_UfPdwzlVyS_xGl5zoiEbbQ_TexfurQR`
- Pooler (para pg_dump/psql): `aws-1-us-east-2.pooler.supabase.com:5432`, usuario formato `postgres.<project-id>`

## Onboarding compañero

1. Clonar repo
2. Copiar `.env.example` → `.env` y completar con credenciales de `ldkjcvuahfyxgnbyitqm`
3. `npm install && npm run dev`
