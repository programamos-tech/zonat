# 🔐 Variables de Entorno - ZONA T

## 📋 Variables Requeridas (OBLIGATORIAS)

Estas variables son **esenciales** para que la aplicación funcione:

### 1. `NEXT_PUBLIC_SUPABASE_URL`
**Descripción**: URL del proyecto de Supabase  
**Producción**:
```
https://allvvgbdzalqhuydhgyy.supabase.co
```

**Desarrollo** (si tienes proyecto separado):
```
https://bbkihtgpuzyywhmkwtgc.supabase.co
```

---

### 2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
**Descripción**: Clave pública/anónima de Supabase (segura para el frontend)  
**Producción**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsbHZ2Z2JkemFscWh1eWRoZ3l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NDE1MTQsImV4cCI6MjA3ODExNzUxNH0.Tm4gpc2xdXwxoEOAHIePbNZOqm-Vqe1aRNwJhT6azII
```

**Desarrollo**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJia2lodGdwdXp5eXdobWt3dGdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMjgwMzIsImV4cCI6MjA3NjkwNDAzMn0.IkllhPygyMvL1Wha1g803_0iTBzgc2RKLj8KLLGLiNg
```

---

### 3. `SUPABASE_SERVICE_ROLE_KEY`
**Descripción**: Clave de servicio de Supabase (⚠️ MANTENER SECRETA - solo backend)  
**Producción**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsbHZ2Z2JkemFscWh1eWRoZ3l5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjU0MTUxNCwiZXhwIjoyMDc4MTE3NTE0fQ.kyQYyjk7su4tEAoN1NY5O9g4kAuF6Mq92rATmyHvTf8
```

**Desarrollo**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJia2lodGdwdXp5eXdobWt3dGdjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMyODAzMiwiZXhwIjoyMDc2OTA0MDMyfQ.IVwGBykWyy2UH724J1TKUnaq47ccIXVUOoPxI2E-ghw
```

⚠️ **IMPORTANTE**: Marca esta variable como **"Sensitive"** en Vercel.

---

## 📝 Variables Opcionales

Estas variables mejoran la experiencia pero no son obligatorias:

### 4. `NODE_ENV`
**Descripción**: Entorno de ejecución  
**Valor**: Se configura automáticamente en Vercel
- `production` en producción
- `development` en desarrollo

**No necesitas configurarla manualmente** ✅

---

### 5. `NEXT_PUBLIC_ENV`
**Descripción**: Identifica el ambiente en el banner de la UI  
**Valores posibles**:
- `production` - Para producción
- `staging` - Para staging/preview
- `development` - Para desarrollo

**Ejemplo para producción**:
```
production
```

---

### 6. `NEXT_PUBLIC_DEPLOYMENT_DATE`
**Descripción**: Fecha de deployment (se muestra en el banner)  
**Formato**: ISO 8601

**Ejemplo**:
```
2024-01-15T10:30:00Z
```

**Opcional**: Vercel puede configurarla automáticamente.

---

### 7. `NEXT_PUBLIC_APP_NAME`
**Descripción**: Nombre de la aplicación  
**Valor por defecto**: `ZONA T`

**Ejemplo**:
```
ZONA T
```

---

### 8. `NEXT_PUBLIC_APP_VERSION`
**Descripción**: Versión de la aplicación  
**Valor por defecto**: `1.0.0`

**Ejemplo**:
```
1.0.0
```

---

## 🚀 Configuración en Vercel

### Para PRODUCCIÓN (rama `main`)

Agrega estas variables en **Settings → Environment Variables → Production**:

```
NEXT_PUBLIC_SUPABASE_URL=https://allvvgbdzalqhuydhgyy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsbHZ2Z2JkemFscWh1eWRoZ3l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NDE1MTQsImV4cCI6MjA3ODExNzUxNH0.Tm4gpc2xdXwxoEOAHIePbNZOqm-Vqe1aRNwJhT6azII
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsbHZ2Z2JkemFscWh1eWRoZ3l5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjU0MTUxNCwiZXhwIjoyMDc4MTE3NTE0fQ.kyQYyjk7su4tEAoN1NY5O9g4kAuF6Mq92rATmyHvTf8
NEXT_PUBLIC_ENV=production
```

**Marcar como Sensitive**: `SUPABASE_SERVICE_ROLE_KEY` ✅

---

### Para PREVIEW (rama `develop`)

Agrega estas variables en **Settings → Environment Variables → Preview**:

```
NEXT_PUBLIC_SUPABASE_URL=https://bbkihtgpuzyywhmkwtgc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJia2lodGdwdXp5eXdobWt3dGdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMjgwMzIsImV4cCI6MjA3NjkwNDAzMn0.IkllhPygyMvL1Wha1g803_0iTBzgc2RKLj8KLLGLiNg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJia2lodGdwdXp5eXdobWt3dGdjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMyODAzMiwiZXhwIjoyMDc2OTA0MDMyfQ.IVwGBykWyy2UH724J1TKUnaq47ccIXVUOoPxI2E-ghw
NEXT_PUBLIC_ENV=staging
```

**Marcar como Sensitive**: `SUPABASE_SERVICE_ROLE_KEY` ✅

---

## ✅ Checklist de Configuración

- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurada para Production
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurada para Production
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada para Production (marcada como Sensitive)
- [ ] `NEXT_PUBLIC_ENV=production` configurada para Production
- [ ] Variables de Preview configuradas para `develop`
- [ ] Verificar que las variables de Production NO estén en Preview
- [ ] Verificar que las variables de Preview NO estén en Production

---

## 🔐 Seguridad

- ✅ **NUNCA** compartas las `SUPABASE_SERVICE_ROLE_KEY` públicamente
- ✅ Marca `SUPABASE_SERVICE_ROLE_KEY` como **"Sensitive"** en Vercel
- ✅ Las variables `NEXT_PUBLIC_*` son seguras para el frontend
- ✅ Las variables sin `NEXT_PUBLIC_*` solo están disponibles en el servidor

---

## 📝 Notas

- Las variables `NEXT_PUBLIC_*` están disponibles en el navegador (frontend)
- Las variables sin `NEXT_PUBLIC_*` solo están disponibles en el servidor (backend)
- `NODE_ENV` se configura automáticamente por Vercel
- Después de agregar variables, necesitas hacer un nuevo deploy

