# EcoNido App - Documentación del Proyecto

## Descripción General

**EcoNido App** es una aplicación web de seguimiento y gestión de cajas nido para equipos de técnicos de campo y administradores. Permite monitorear la ocupación de cajas nido, registrar inspecciones detalladas, visualizar estadísticas y gestionar la base de datos de instalaciones.

### Características Principales

- **Mapa Interactivo**: Visualización en tiempo real de cajas nido con pines codificados por especie
- **Formulario de Inspección**: Registro detallado de inspecciones con lógica condicional y soporte multimedia
- **Gestión de Cajas**: Alta manual, importación GeoJSON, edición y eliminación
- **Dashboard Estadístico**: KPIs y gráficos con Recharts
- **Control de Acceso**: Roles Técnico (lectura) y Administrador (gestión completa)
- **Modo Offline**: Almacenamiento local con IndexedDB y sincronización automática
- **Historial de Inspecciones**: Línea de tiempo con filtros y exportación CSV

---

## Arquitectura Técnica

### Stack Tecnológico

- **Frontend**: React 19 + Tailwind CSS 4 + shadcn/ui
- **Backend**: Express 4 + tRPC 11
- **Base de Datos**: MySQL/TiDB con Drizzle ORM
- **Autenticación**: Manus OAuth
- **Almacenamiento**: S3 (Manus Storage)
- **Mapas**: Google Maps JavaScript API (proxy Manus)
- **Testing**: Vitest

### Estructura de Directorios

```
econido-app/
├── client/src/
│   ├── pages/              # Páginas principales
│   │   ├── MapView.tsx     # Mapa interactivo
│   │   ├── InspectionForm.tsx
│   │   ├── AdminPanel.tsx
│   │   ├── Dashboard.tsx
│   │   ├── InspectionHistory.tsx
│   │   └── EditNestBox.tsx
│   ├── components/         # Componentes reutilizables
│   ├── hooks/              # Hooks personalizados
│   └── lib/                # Utilidades
├── server/
│   ├── routers.ts          # Procedimientos tRPC
│   ├── db.ts               # Helpers de base de datos
│   └── _core/              # Infraestructura interna
├── drizzle/
│   └── schema.ts           # Definición de tablas
└── shared/                 # Tipos compartidos
```

---

## Guía de Uso por Roles

### Rol: Técnico

**Permisos:**
- Visualizar mapa de cajas nido
- Registrar inspecciones
- Ver historial de inspecciones
- Acceso de solo lectura a cajas nido

**Flujo Típico:**
1. Acceder al mapa desde la página principal
2. Seleccionar una caja nido en el mapa
3. Hacer clic en "Añadir Inspección"
4. Completar el formulario de inspección
5. Adjuntar fotos/audio si es necesario
6. Guardar la inspección
7. Consultar historial en la sección "Historial"

### Rol: Administrador

**Permisos:**
- Acceso completo a todas las funcionalidades
- Gestión de cajas nido (crear, editar, eliminar)
- Importación de datos GeoJSON
- Visualización de dashboard con estadísticas
- Exportación de datos a CSV
- Gestión de usuarios

**Flujo Típico:**
1. Acceder al panel de administración
2. Crear nuevas cajas nido manualmente o importar GeoJSON
3. Editar propiedades de cajas existentes
4. Eliminar cajas nido si es necesario
5. Consultar dashboard para análisis de ocupación
6. Exportar datos de inspecciones a CSV

---

## Instalación y Configuración

### Requisitos Previos

- Node.js 22.13.0+
- pnpm 10.4.1+
- Acceso a base de datos MySQL/TiDB
- Credenciales de Manus OAuth

### Instalación Local

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd econido-app
   ```

2. **Instalar dependencias**
   ```bash
   pnpm install
   ```

3. **Configurar variables de entorno**
   Consulta la sección de Variables de Entorno más abajo.

4. **Ejecutar migraciones de base de datos**
   ```bash
   pnpm db:push
   ```

5. **Iniciar servidor de desarrollo**
   ```bash
   pnpm dev
   ```

6. **Acceder a la aplicación**
   - URL: `http://localhost:3000`
   - Se abrirá el flujo de OAuth automáticamente

### Build para Producción

```bash
pnpm build
pnpm start
```

---

## Variables de Entorno

### Variables Requeridas (Inyectadas por Manus)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Conexión a base de datos MySQL/TiDB | `mysql://user:pass@host/db` |
| `JWT_SECRET` | Secreto para firmar cookies de sesión | `your-secret-key` |
| `VITE_APP_ID` | ID de aplicación OAuth | `app-id-from-manus` |
| `OAUTH_SERVER_URL` | URL del servidor OAuth | `https://api.manus.im` |
| `VITE_OAUTH_PORTAL_URL` | URL del portal de login | `https://portal.manus.im` |
| `OWNER_OPEN_ID` | OpenID del propietario | `owner-id` |
| `OWNER_NAME` | Nombre del propietario | `Admin Name` |
| `BUILT_IN_FORGE_API_URL` | URL de APIs internas | `https://forge.manus.im` |
| `BUILT_IN_FORGE_API_KEY` | Clave de APIs internas (servidor) | `api-key` |
| `VITE_FRONTEND_FORGE_API_KEY` | Clave de APIs internas (cliente) | `frontend-key` |
| `VITE_FRONTEND_FORGE_API_URL` | URL de APIs para cliente | `https://forge.manus.im` |

### Variables Opcionales

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `NODE_ENV` | Entorno de ejecución | `development` |
| `PORT` | Puerto del servidor | `3000` |

---

## Esquema de Base de Datos

### Tabla: `users`
```sql
- id: INT (PK, autoincrement)
- openId: VARCHAR(64) (UNIQUE)
- name: TEXT
- email: VARCHAR(320)
- loginMethod: VARCHAR(64)
- role: ENUM('user', 'admin')
- createdAt: TIMESTAMP
- updatedAt: TIMESTAMP
- lastSignedIn: TIMESTAMP
```

### Tabla: `nestBoxes`
```sql
- id: INT (PK, autoincrement)
- cajaId: VARCHAR(100)
- instalacion: VARCHAR(255)
- tipoCaja: VARCHAR(100)
- latitude: DECIMAL(10, 8)
- longitude: DECIMAL(11, 8)
- estadoActual: ENUM('ocupada', 'vacia', 'desconocido')
- ultimaEspecie: VARCHAR(100)
- createdAt: TIMESTAMP
- updatedAt: TIMESTAMP
```

### Tabla: `inspections`
```sql
- id: INT (PK, autoincrement)
- nestBoxId: INT (FK)
- userId: INT (FK)
- fecha: DATE
- ocupada: TINYINT(1)
- especie: VARCHAR(100)
- numHuevos: INT
- numPollos: INT
- estadoConservacion: ENUM('bueno', 'necesita_reparacion', 'caida')
- observaciones: TEXT
- multimediaUrls: JSON
- createdAt: TIMESTAMP
```

### Tabla: `multimedia`
```sql
- id: INT (PK, autoincrement)
- inspectionId: INT (FK)
- url: VARCHAR(500)
- tipo: ENUM('foto', 'audio')
- createdAt: TIMESTAMP
```

---

## API tRPC - Procedimientos Disponibles

### Autenticación

- `auth.me` - Obtener usuario actual
- `auth.logout` - Cerrar sesión

### Cajas Nido

- `nestBox.list` - Listar todas las cajas (público)
- `nestBox.getById` - Obtener caja por ID (público)
- `nestBox.create` - Crear caja (admin only)
- `nestBox.update` - Actualizar caja (admin only)
- `nestBox.delete` - Eliminar caja (admin only)

### Inspecciones

- `inspection.list` - Listar inspecciones (opcional filtro por cajaId)
- `inspection.getById` - Obtener inspección por ID
- `inspection.create` - Crear inspección (autenticado)
- `inspection.update` - Actualizar inspección (admin only)
- `inspection.delete` - Eliminar inspección (admin only)

### Sistema

- `system.notifyOwner` - Enviar notificación al propietario (admin only)

---

## Modo Offline

### Funcionalidad

La aplicación soporta operaciones offline mediante IndexedDB:

1. **Almacenamiento Local**: Las operaciones se guardan en IndexedDB cuando no hay conexión
2. **Indicador Visual**: Banner amarillo indica modo offline
3. **Sincronización Automática**: Al recuperar conexión, los cambios se sincronizan automáticamente
4. **Cola de Operaciones**: Las operaciones pendientes se muestran en el indicador

### Implementación

- Hook: `useOfflineSync()` en `client/src/hooks/useOfflineSync.ts`
- Componente: `OfflineIndicator` en `client/src/components/OfflineIndicator.tsx`
- Integración: Automática en `App.tsx`

---

## Formato GeoJSON Soportado

### Estructura Esperada

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [longitude, latitude]
      },
      "properties": {
        "cajaId": "CAJA-001",
        "instalacion": "Parque Natural",
        "tipoCaja": "Cemento-madera"
      }
    }
  ]
}
```

### Validación

- Cada feature debe tener geometría tipo "Point"
- Las coordenadas deben estar en formato [longitude, latitude]
- Las propiedades requeridas son: `cajaId`, `instalacion`, `tipoCaja`

---

## Testing

### Ejecutar Tests

```bash
pnpm test
```

### Cobertura de Tests

- ✅ Procedimientos tRPC (autenticación, permisos)
- ✅ Validación de roles (admin vs técnico)
- ✅ Validación de datos GeoJSON
- ⏳ Tests de integración offline/online (en desarrollo)

### Ejemplo de Test

```typescript
// server/routers.test.ts
describe("nestBox.delete", () => {
  it("should forbid non-admin users", async () => {
    const ctx = createUserContext(); // técnico
    const caller = appRouter.createCaller(ctx);
    
    expect(() => caller.nestBox.delete(1))
      .rejects.toThrow("FORBIDDEN");
  });
});
```

---

## Troubleshooting

### Error: "Base de datos no disponible"

**Causa**: Conexión a base de datos fallida
**Solución**: Verificar `DATABASE_URL` y conectividad de red

### Error: "Acceso denegado" en panel admin

**Causa**: Usuario no tiene rol admin
**Solución**: Contactar al administrador para promoción de rol

### Mapa no carga

**Causa**: API de Google Maps no disponible
**Solución**: Verificar credenciales de OAuth y conectividad

### Cambios offline no se sincronizan

**Causa**: Conexión perdida durante sincronización
**Solución**: Verificar conexión a internet y reintentar manualmente

---

## Soporte y Contacto

Para reportar bugs o solicitar características, contactar al equipo de desarrollo.

---

## Licencia

MIT

---

**Última actualización**: 29 de mayo de 2026
