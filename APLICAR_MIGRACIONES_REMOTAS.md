# Aplicar Migraciones a la Base de Datos Remota

## Opción 1: Usando Supabase CLI (Recomendado)

### Paso 1: Vincular el proyecto remoto
```bash
npx supabase link --project-ref enhmruujoxmfcpfssghc
```

### Paso 2: Aplicar las migraciones
```bash
npx supabase db push
```

## Opción 2: Aplicar directamente sin vincular

Si prefieres aplicar solo las migraciones nuevas sin vincular:

```bash
# Aplicar solo la migración de fix de políticas
npx supabase db push --include-all
```

## Opción 3: Aplicar manualmente desde Supabase Dashboard

1. Ve a tu proyecto en https://supabase.com/dashboard
2. Ve a "SQL Editor"
3. Copia y pega el contenido de:
   - `supabase/migrations/20260110000004_create_rls_policies.sql`
   - `supabase/migrations/20260110000005_fix_rls_policies_permissive.sql`
4. Ejecuta cada script en orden

## ⚠️ IMPORTANTE

- **Haz un backup** de la base de datos antes de aplicar las migraciones
- Las políticas RLS pueden afectar el acceso a los datos
- Asegúrate de tener acceso con `supabaseAdmin` (service role key) para operaciones administrativas

## Verificar después de aplicar

Después de aplicar las migraciones, verifica que:
- ✅ El login funciona
- ✅ Puedes ver las tiendas
- ✅ Puedes ver los productos
- ✅ Las operaciones normales funcionan
