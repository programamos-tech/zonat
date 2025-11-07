# 🚀 Configuración de Vercel para Producción

## 📋 Configuración de Ramas

- **Production Branch**: `main` → Despliega a producción
- **Preview Branch**: `develop` → Despliega a preview/staging

## 🔐 Variables de Entorno

### Para PRODUCCIÓN (rama `main`)

Configurar en Vercel: **Settings → Environment Variables → Production**

```
NEXT_PUBLIC_SUPABASE_URL=https://allvvgbdzalqhuydhgyy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsbHZ2Z2JkemFscWh1eWRoZ3l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NDE1MTQsImV4cCI6MjA3ODExNzUxNH0.Tm4gpc2xdXwxoEOAHIePbNZOqm-Vqe1aRNwJhT6azII
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsbHZ2Z2JkemFscWh1eWRoZ3l5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjU0MTUxNCwiZXhwIjoyMDc4MTE3NTE0fQ.kyQYyjk7su4tEAoN1NY5O9g4kAuF6Mq92rATmyHvTf8
```

### Para PREVIEW (rama `develop`)

Configurar en Vercel: **Settings → Environment Variables → Preview**

Usar las credenciales de **desarrollo** (el proyecto de desarrollo en Supabase).

## 📝 Pasos para Configurar

1. **Verificar rama de producción:**
   - Ve a: Settings → Git
   - Asegúrate de que "Production Branch" sea `main`

2. **Agregar variables de producción:**
   - Ve a: Settings → Environment Variables
   - Haz clic en "Create new"
   - En "Environments", selecciona **"Production"** (NO "All Environments")
   - Agrega las 3 variables de arriba
   - Guarda

3. **Verificar variables de preview:**
   - En la misma página, verifica que las variables de `develop` estén configuradas para **"Preview"** solamente
   - NO deben estar en "Production"

## ✅ Verificación

Después de configurar:

- **Deploy desde `main`** → Usa variables de PRODUCCIÓN
- **Deploy desde `develop`** → Usa variables de PREVIEW/desarrollo

## 🔗 Enlaces Útiles

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Production**: https://supabase.com/dashboard/project/allvvgbdzalqhuydhgyy

