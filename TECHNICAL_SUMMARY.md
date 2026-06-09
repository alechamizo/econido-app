# EcoNido App - Resumen Técnico para Desarrolladores

## 📋 Descripción General

**EcoNido** es una aplicación web para el seguimiento de ocupación de cajas nido (nesting boxes) destinadas a aves rapaces y otras especies. Permite registrar inspecciones históricas, visualizar datos en un mapa interactivo y generar reportes de reproducción.

**Stack Tecnológico:**
- **Frontend:** React 19 + Tailwind CSS 4 + TypeScript
- **Backend:** Express 4 + tRPC 11 + Node.js
- **Base de Datos:** Supabase PostgreSQL (migrado de MySQL/TiDB)
- **Autenticación:** Manus OAuth 2.0
- **Mapas:** Google Maps API (proxy Manus)
- **Hosting:** Cloud Run (Node.js)

---

## 🏗️ Arquitectura

### Backend (tRPC-First)

```
server/
├── _core/
│   ├── context.ts         # Contexto tRPC con usuario autenticado
│   ├── oauth.ts           # Manejo de autenticación Manus
│   ├── llm.ts             # Integración con LLM (Claude)
│   ├── map.ts             # Proxy Google Maps
│   ├── notification.ts    # Notificaciones al propietario
│   └── voiceTranscription.ts # Transcripción de audio
├── db.ts                  # Funciones de base de datos (SQL directo)
├── routers.ts             # Procedimientos tRPC públicos y protegidos
└── storage.ts             # Manejo de archivos S3
```

**Patrón tRPC:**
- Todos los datos fluyen a través de procedimientos tRPC (`nestBox.list`, `inspection.create`, etc.)
- Tipos TypeScript compartidos entre cliente y servidor (type-safe end-to-end)
- Autenticación automática en `protectedProcedure`
- Serialización SuperJSON (soporta Date, Map, Set, etc.)

### Frontend (React + Hooks)

```
client/src/
├── pages/
│   ├── MapView.tsx        # Mapa interactivo con marcadores de cajas
│   ├── InspectionHistory.tsx # Historial de inspecciones por caja
│   ├── Dashboard.tsx       # Estadísticas y resumen
│   ├── QuickReview.tsx     # Revisión rápida de últimas inspecciones
│   ├── AdminPanel.tsx      # Importación de GeoJSON y gestión
│   └── InspectionForm.tsx  # Formulario para crear inspecciones
├── components/
│   ├── DashboardLayout.tsx # Layout con sidebar para admin
│   ├── Map.tsx             # Componente Google Maps
│   └── ui/                 # shadcn/ui components
└── lib/trpc.ts             # Cliente tRPC configurado
```

**Patrón de Datos:**
- `trpc.*.useQuery()` para lecturas
- `trpc.*.useMutation()` para escrituras
- Optimistic updates para UX instantáneo
- Caché automático con React Query

---

## 📊 Modelo de Datos

### Tablas Principales

#### `nestBoxes` (Cajas Nido)
```sql
CREATE TABLE "nestBoxes" (
  id SERIAL PRIMARY KEY,
  "cajaId" VARCHAR(50) UNIQUE,      -- Código único (A11, B21-1, C22-3)
  instalacion VARCHAR(100),          -- Ubicación (PSF Ext I, PSF Ext II, PSF Ext III)
  "tipoCaja" VARCHAR(50),            -- Tipo de caja (Estándar, Lechuza, etc.)
  latitude DECIMAL(10,8),            -- WGS84 (convertido de UTM)
  longitude DECIMAL(11,8),           -- WGS84 (convertido de UTM)
  "estadoActual" VARCHAR(20),        -- ocupada | vacia | desconocido
  "ultimaEspecie" VARCHAR(100),      -- Última especie registrada
  "createdAt" TIMESTAMP,
  "updatedAt" TIMESTAMP
);
```

#### `inspections` (Inspecciones)
```sql
CREATE TABLE inspections (
  id UUID PRIMARY KEY,
  nestboxid UUID REFERENCES "nestBoxes"(id),
  fecha DATE,                        -- Fecha de la inspección
  ocupada BOOLEAN,                   -- Estado de ocupación
  especie VARCHAR(100),              -- Especie detectada
  num_huevos DECIMAL(5,2),           -- Número de huevos
  num_pollos DECIMAL(5,2),           -- Número de pollos
  observaciones TEXT,                -- Notas de campo
  status VARCHAR(50),                -- completada | pendiente | revisada
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `users` (Usuarios)
```sql
CREATE TABLE "users" (
  id SERIAL PRIMARY KEY,
  "openId" VARCHAR(255) UNIQUE,      -- ID de Manus OAuth
  name VARCHAR(255),
  email VARCHAR(255),
  "loginMethod" VARCHAR(50),         -- google | microsoft | etc.
  role VARCHAR(50) DEFAULT 'user',   -- admin | user
  "createdAt" TIMESTAMP,
  "updatedAt" TIMESTAMP,
  "lastSignedIn" TIMESTAMP
);
```

---

## 🔄 Flujos Principales

### 1. Visualización de Cajas en Mapa

```
MapView.tsx
  ↓ useQuery()
trpc.nestBox.list
  ↓
server/routers.ts (nestBox.list procedure)
  ↓
server/db.ts (getNestBoxes)
  ↓
SELECT * FROM "nestBoxes" (SQL directo, no Drizzle)
  ↓
Retorna 32 cajas con estado y especie
  ↓
Frontend renderiza marcadores con colores:
  - Rojo (#FF6B6B) = Ocupada
  - Turquesa (#4ECDC4) = Vacía
  - Gris (#95A5A6) = Sin datos
```

### 2. Importación de GeoJSON

```
AdminPanel.tsx (usuario admin)
  ↓ Sube archivo GeoJSON
  ↓ useMutation(nestBox.importFromGeoJSON)
  ↓
server/routers.ts (importFromGeoJSON procedure)
  ↓
Parsea GeoJSON (features con propiedades)
  ↓
Detecta CRS (EPSG:25830 = UTM zona 30)
  ↓
Convierte coordenadas UTM → WGS84 (latitud/longitud)
  ↓
Valida rangos: lat [-90,90], lon [-180,180]
  ↓
INSERT INTO "nestBoxes" (batch insert)
  ↓
Retorna cajas creadas/actualizadas
```

### 3. Registro de Inspecciones

```
InspectionForm.tsx
  ↓ Usuario selecciona caja, especie, huevos, pollos, observaciones
  ↓ useMutation(inspection.create)
  ↓
server/routers.ts (inspection.create procedure)
  ↓
Valida datos con Zod schema
  ↓
INSERT INTO inspections
  ↓
UPDATE "nestBoxes" SET "estadoActual", "ultimaEspecie"
  ↓
Retorna inspección creada
  ↓
Frontend actualiza optimistamente el mapa
```

### 4. Historial de Inspecciones

```
InspectionHistory.tsx (usuario selecciona una caja)
  ↓ useQuery(inspection.getByNestBoxId)
  ↓
server/routers.ts (inspection.getByNestBoxId procedure)
  ↓
SELECT * FROM inspections WHERE nestboxid = ? ORDER BY fecha DESC
  ↓
Retorna lista de inspecciones (últimas primero)
  ↓
Frontend renderiza tabla con:
  - Fecha, estado, especie, huevos, pollos, observaciones
  - Miniaturas de fotos (si existen)
  - Botón para editar/eliminar (solo admin)
```

---

## 🔐 Autenticación y Autorización

### Flujo OAuth

```
1. Usuario hace clic en "Iniciar sesión"
2. Redirige a getLoginUrl() → Manus OAuth portal
3. Usuario se autentica (Google, Microsoft, etc.)
4. Redirige a /api/oauth/callback con code
5. Backend intercambia code por token
6. Crea sesión con cookie HTTP-only
7. Retorna a / con usuario autenticado
```

### Roles y Permisos

```
publicProcedure
  └─ Accesible sin autenticación
     - nestBox.list (leer cajas)
     - inspection.getByNestBoxId (leer inspecciones)

protectedProcedure
  └─ Requiere autenticación
     - inspection.create (crear inspecciones)
     - inspection.update (editar inspecciones)

adminProcedure (custom)
  └─ Requiere role === 'admin'
     - nestBox.importFromGeoJSON (importar GeoJSON)
     - nestBox.delete (eliminar cajas)
     - inspection.delete (eliminar inspecciones)
```

---

## 🗄️ Migración a Supabase PostgreSQL

### Cambios Principales

| Aspecto | MySQL (TiDB) | PostgreSQL (Supabase) |
|---------|--------------|----------------------|
| **Driver** | mysql2 | postgres-js |
| **ORM** | Drizzle + MySQL | Drizzle + PostgreSQL |
| **Tipos de Datos** | DECIMAL, VARCHAR | NUMERIC, VARCHAR |
| **UUIDs** | Generados en app | Nativos en DB |
| **Timestamps** | DATETIME | TIMESTAMP WITH TZ |
| **Conexión** | TiDB Cloud | Supabase Pooler |

### Problemas Resueltos

1. **Mismatch de columnas**: Schema Drizzle usaba camelCase (`nestBoxId`) pero Supabase tenía snake_case (`nestboxid`)
   - **Solución:** SQL directo con postgres-js en lugar de Drizzle ORM

2. **Conversión de coordenadas UTM**: GeoJSON original usaba EPSG:25830 (UTM zona 30)
   - **Solución:** Función `convertUTMtoWGS84()` en `server/utm-converter.ts`

3. **Deadlock en conexiones**: Conexión única de Drizzle se agotaba
   - **Solución:** Pool de conexiones con `max: 10` en postgres-js

---

## 📱 Funcionalidades Principales

### 1. Mapa Interactivo
- Visualización de 32 cajas nido con marcadores coloreados
- Filtro por estado (ocupada, vacía, todas)
- Clic en marcador → detalles de caja + últimas inspecciones
- Geolocalización del usuario (marcador azul)
- Zoom y pan interactivos

### 2. Historial de Inspecciones
- Tabla con todas las inspecciones de una caja
- Ordenadas por fecha (más recientes primero)
- Muestra: fecha, estado, especie, huevos, pollos, observaciones
- Miniaturas de fotos (si existen)
- Editar/eliminar (solo admin)

### 3. Dashboard
- Estadísticas: Total cajas, ocupadas, vacías
- Gráficos de ocupación por especie
- Últimas inspecciones registradas
- Tasa de éxito reproductivo

### 4. Panel de Administrador
- Importar cajas desde GeoJSON
- Editar propiedades de cajas
- Eliminar cajas (con confirmación)
- Gestionar usuarios y roles
- Ver logs de cambios

### 5. Formulario de Inspecciones
- Selector de caja nido
- Selector de especie (autocomplete)
- Campos numéricos: huevos, pollos
- Área de observaciones (texto libre)
- Carga de fotos/videos (próxima fase)
- Validación en tiempo real

---

## 🚀 Próximas Mejoras

### Fase 1 (Corto Plazo)
- [ ] Carga de fotos en inspecciones
- [ ] Miniaturas en historial
- [ ] Exportar reportes PDF
- [ ] Filtros avanzados (rango de fechas, especie)

### Fase 2 (Mediano Plazo)
- [ ] Sincronización offline (Service Worker + IndexedDB)
- [ ] Notificaciones push
- [ ] Integración con cámaras de vigilancia
- [ ] Análisis de tendencias (ML)

### Fase 3 (Largo Plazo)
- [ ] App móvil nativa (React Native)
- [ ] Integración con sensores IoT
- [ ] Predicción de éxito reproductivo
- [ ] Marketplace de datos para investigadores

---

## 🔧 Configuración de Desarrollo

### Variables de Entorno Requeridas
```bash
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_DB_PASSWORD=xxxxx

# Manus OAuth
VITE_APP_ID=xxxxx
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im

# Google Maps
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=xxxxx

# Otros
JWT_SECRET=xxxxx
OWNER_NAME=Alejandro Chamizo
OWNER_OPEN_ID=xxxxx
```

### Comandos Útiles
```bash
# Desarrollo
pnpm dev

# Tests
pnpm test

# Generar migraciones Drizzle
pnpm drizzle-kit generate

# Build producción
pnpm build

# Linter
pnpm lint
```

---

## 📈 Métricas de Rendimiento

- **Tiempo de carga inicial:** ~2-3s
- **Tiempo de respuesta API:** <200ms (Supabase)
- **Tamaño del bundle:** ~450KB (gzipped)
- **Lighthouse Score:** 85+ (Performance)

---

## 🐛 Troubleshooting

### Problema: Mapa muestra 0 cajas
**Causa:** Caché del navegador o Service Worker desactualizado
**Solución:** 
1. Limpiar caché: `Ctrl+Shift+Delete`
2. Desregistrar Service Workers
3. Recargar página

### Problema: Importación de GeoJSON falla
**Causa:** Coordenadas en formato incorrecto o CRS no soportado
**Solución:** Verificar que:
- CRS sea EPSG:25830 (UTM) o EPSG:4326 (WGS84)
- Propiedades incluyan "Etiqueta" (cajaId) y "PSF" (instalación)

### Problema: Conexión a Supabase timeout
**Causa:** Contraseña incorrecta o base de datos no disponible
**Solución:**
1. Verificar `SUPABASE_DB_PASSWORD` en variables de entorno
2. Resetear contraseña en Supabase dashboard
3. Verificar que la base de datos esté activa

---

## 📚 Referencias

- [tRPC Documentation](https://trpc.io)
- [Drizzle ORM](https://orm.drizzle.team)
- [Supabase PostgreSQL](https://supabase.com/docs/guides/database)
- [Google Maps API](https://developers.google.com/maps)
- [Manus OAuth](https://docs.manus.im/oauth)

