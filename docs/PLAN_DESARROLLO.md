# Plan de desarrollo

## Fase 0: preparación local

Aplicación base, MySQL local, conexión, verificación de salud, migración técnica y documentación.

## Fase 1: estructura operativa

- **Fase 1.1 — Expediente de Empresas:** implementada. Incluye datos generales, representantes legales y metadatos de documentos.
- **Fase 1.2 — Cuentas bancarias por empresa:** implementada.
- **Fase 1.3 — Periodos mensuales:** implementada.

La Fase 1 está terminada. Los montos y operaciones pertenecen a la Fase 2 y continúan pendientes.

Bancos se conserva como catálogo auxiliar para seleccionar la institución de cada cuenta bancaria; no es un módulo operativo principal.

## Fase 2: captura de operaciones

- Montos esperados y carga de Excel: implementados.
- **Fase 2.2 — Depósitos recibidos:** terminada. Incluye captura individual y captura múltiple por lotes.

La Fase 2 está terminada.

## Fase 3: conciliación

- **Fase 3 — Conciliación:** terminada. Incluye coincidencias exactas, sugerencias similares, conciliación manual y reversión.

## Fase 4: entregas y evidencias

- **Fase 4 — Entregas de efectivo:** terminada. Incluye control de saldo, firma de recepción y comprobante imprimible.

## Fase 5: compras y rentabilidad

- **Fase 5.1 — Catálogo de productos por empresa:** terminada.
- **Fase 5.2 — Configuración de órdenes por empresa:** terminada.
- **Fase 5.3 — Creación de órdenes de compra:** terminada.
- **Fase 5.4 — Generación de PDF de órdenes de compra:** terminada.
- **Fase 5.5 — Google Drive para órdenes de compra:** terminada.

La Fase 5 está terminada.

## Fase 6: dashboard y reportes

- **Fase 6 — Dashboard y reportes:** terminada. Incluye indicadores por empresa y periodo, reportes de conciliación, entregas, órdenes, productos vendidos y la vista administrativa de costo y utilidad.

Los reportes se calculan desde la información operativa existente y no representan inventario físico. El costo interno y la utilidad no forman parte de los PDF de órdenes de compra.

Cada fase se implementará únicamente cuando sea solicitada y con criterios de terminación propios.
