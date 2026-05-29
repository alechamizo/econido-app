# EcoNido App - TODO

## Base de Datos y Esquema
- [x] Crear tabla `nestBoxes` con campos: id, caja_id, instalacion, tipo_caja, latitude, longitude, estado_actual, ultima_especie, createdAt, updatedAt
- [x] Crear tabla `inspections` con campos: id, nestBoxId, fecha, ocupada, especie, num_huevos, num_pollos, estado_conservacion, observaciones, multimedia_urls, createdAt, userId
- [x] Crear tabla `multimedia` con campos: id, inspectionId, url, tipo (foto/audio), createdAt
- [x] Crear tabla `users` extendida con campo `role` (admin/tecnico) - ya existe en schema base
- [ ] Crear índices para búsquedas geoespaciales y filtros

## Módulo 1: Mapa Interactivo
- [x] Integrar Google Maps con capas satélite y vectorial
- [x] Implementar pines de colores por especie según tabla PRD
- [x] Crear sistema de filtros en tiempo real (especie, estado, zona)
- [x] Popup al hacer clic en pin con ID caja, última especie y botón "Añadir Inspección"
- [ ] Botón "Añadir Caja" que capture GPS actual o permita clic manual en mapa

## Módulo 2: Formulario de Inspección
- [x] Crear formulario con lógica condicional (campos ocultos si no ocupada)
- [x] Campo de fecha (por defecto hoy)
- [x] Selector booleano "¿Está ocupada?"
- [x] Desplegable de especies con opción "otros" + input texto libre
- [x] Campos numéricos: huevos (0-15), pollos (0-15)
- [x] Selector estado conservación: Bueno / Necesita reparación / Caída
- [x] Área de observaciones libre
- [x] Input multimedia con acceso a cámara nativa del dispositivo
- [ ] Compresión de fotos/vídeos en cliente antes de subida

## Módulo 3: Gestión de Cajas Nido
- [x] Alta manual con geolocalización GPS o clic en mapa
- [x] Importador GeoJSON en zona administración
- [x] Validación estructura GeoJSON según especificación PRD
- [ ] Edición de cajas existentes (admin only)
- [ ] Baja/eliminación de cajas (admin only)

## Módulo 4: Dashboard
- [x] KPI: Total cajas
- [x] KPI: Tasa de ocupación (%)
- [x] KPI: Total pollos nacidos en temporada
- [x] Gráfico Pie: Distribución porcentual de especies
- [x] Gráfico Bar: Éxito reproductor (Huevos vs Pollos) filtrable
- [x] Gráfico Line: Evolución temporal ocupación (meses/años)
- [ ] Filtros por instalación y especie en gráficos

## Módulo 5: Control de Acceso por Roles
- [x] Rol Técnico: acceso mapa, geolocalizar cajas, rellenar inspecciones (solo lectura cajas)
- [x] Rol Administrador: acceso total, dashboard, importador GeoJSON, edición/borrado, exportación CSV
- [x] Middleware de autorización en backend (protectedProcedure + role check)
- [x] UI condicional según rol del usuario

## Módulo 6: Modo Offline
- [ ] Implementar IndexedDB para almacenamiento local de cajas e inspecciones
- [ ] Sincronización automática al recuperar conexión
- [ ] Indicador visual de estado online/offline
- [ ] Cola de cambios pendientes durante offline
- [ ] Manejo de conflictos de sincronización

## Módulo 7: Historial de Inspecciones
- [x] Vista de línea de tiempo por caja nido
- [x] Filtros por fecha en historial
- [x] Exportación a CSV (admin only)
- [ ] Visualización de cambios históricos

## UI/UX General
- [ ] Diseño responsive para dispositivos móviles en campo
- [ ] Navegación intuitiva entre módulos
- [ ] Indicadores visuales de estado (online/offline, sincronización)
- [ ] Mensajes de confirmación para acciones críticas
- [ ] Manejo de errores y validación de formularios

## Testing y Validación
- [ ] Tests unitarios para procedimientos tRPC
- [ ] Tests de integración para flujos offline/online
- [ ] Validación de datos GeoJSON
- [ ] Tests de permisos por rol

## Deployment y Documentación
- [ ] Documentación de instalación y configuración
- [ ] Guía de uso para técnicos y administradores
- [ ] Variables de entorno necesarias
