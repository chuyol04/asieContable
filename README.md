# ASIEContable

Sistema operativo y financiero en desarrollo por fases. La empresa funciona como expediente de datos generales, representantes, documentos y cuentas bancarias. Bancos es un catálogo auxiliar.

## Requisitos

- Node.js 20.9 o posterior.
- npm.
- Docker Desktop con Docker Compose.

## Inicio local

```powershell
npm install
Copy-Item .env.example .env
docker compose up -d
npm run dev
```

Abre `http://localhost:3000`. MySQL queda disponible solo en `127.0.0.1` y en el puerto definido por `DB_PORT`.

Antes de usar credenciales fuera de una máquina local, reemplaza en `.env` todos los valores que comienzan con `change_`.

## Migración inicial

Con MySQL saludable, aplica manualmente la migración técnica:

```powershell
Get-Content -Raw database/migrations/001_create_system_settings.sql | docker compose exec -T mysql sh -c 'exec mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"'
```

Aplica después la migración de empresas:

```powershell
Get-Content -Raw database/migrations/002_create_companies.sql | docker compose exec -T mysql sh -c 'exec mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"'
```

El seed de OMEGA es opcional e idempotente:

```powershell
Get-Content -Raw database/seeds/001_omega.sql | docker compose exec -T mysql sh -c 'exec mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"'
```

Aplica después la migración de bancos:

```powershell
Get-Content -Raw database/migrations/003_create_banks.sql | docker compose exec -T mysql sh -c 'exec mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"'
```

El seed opcional agrega Afirme y BBVA:

```powershell
Get-Content -Raw database/seeds/002_banks.sql | docker compose exec -T mysql sh -c 'exec mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"'
```

Aplica finalmente la migración del expediente y cuentas bancarias:

```powershell
Get-Content -Raw database/migrations/004_create_company_dossier.sql | docker compose exec -T mysql sh -c 'exec mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"'
Get-Content -Raw database/migrations/005_rename_bank_account_city_to_plaza.sql | docker compose exec -T mysql sh -c 'exec mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"'
```

Aplica las migraciones de periodos y montos esperados:

```powershell
Get-Content -Raw database/migrations/006_create_accounting_periods.sql | docker compose exec -T mysql sh -c 'exec mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"'
Get-Content -Raw database/migrations/007_create_expected_amounts_and_reconciliation_model.sql | docker compose exec -T mysql sh -c 'exec mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"'
```

Para confirmar que se creó la tabla:

```powershell
docker compose exec mysql sh -c 'exec mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "SHOW TABLES;"'
```

## Verificación de salud

Con la aplicación en ejecución:

```powershell
Invoke-RestMethod http://localhost:3000/api/health
```

La respuesta correcta es:

```json
{
  "status": "ok",
  "application": "online",
  "database": "connected"
}
```

Si MySQL no está disponible, el endpoint responde HTTP `503`, mantiene `application: "online"` y devuelve `database: "unavailable"` sin revelar configuración sensible.

## Expedientes de empresas

Abre `http://localhost:3000/empresas`. Pruebas manuales recomendadas:

1. Crear una empresa y completar sus datos generales.
2. Intentar crear otra con el mismo nombre y comprobar el mensaje de duplicado.
3. Registrar y editar representantes y documentos desde las pestañas del expediente.
4. Registrar una cuenta seleccionando un banco del catálogo auxiliar.
5. Desactivar registros y comprobar que permanecen en el expediente.

## Catálogo auxiliar de bancos

La ruta `http://localhost:3000/bancos` se conserva para mantenimiento, pero Bancos ya no aparece como módulo principal. Las cuentas lo utilizan como selector auxiliar.

Desde la captura individual o por lote de depósitos se puede abrir la creación del banco y de la cuenta bancaria de la empresa seleccionada.

## Archivo de periodos

La eliminación de periodos es lógica y solo se permite cuando están vacíos. Si se cargó un Excel por error, elimínalo primero desde `Periodo → Montos esperados → Archivos importados`; una importación conciliada permanece protegida. Aplica la migración:

```powershell
Get-Content -Raw database/migrations/019_archive_accounting_periods.sql | docker compose exec -T mysql sh -c 'exec mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"'
```

Las entregas de efectivo son independientes de los depósitos bancarios y comparan el monto guardado contra el monto entregado. Aplica también:

```powershell
Get-Content -Raw database/migrations/020_add_cash_delivery_stored_amount.sql | docker compose exec -T mysql sh -c 'exec mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"'
```

## Expediente administrativo ampliado

La pestaña General admite varios correos y teléfonos; Representantes incluye RFC y CURP opcionales; Documentos organiza y carga archivos en Google Drive sin guardar binarios en MySQL. Aplica:

```powershell
Get-Content -Raw database/migrations/021_expand_company_administrative_dossier.sql | docker compose exec -T mysql sh -c 'exec mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"'
```

Google Drive usa OAuth del lado servidor. Configura `GOOGLE_DRIVE_OAUTH_CREDENTIALS_PATH` con el JSON descargado de Google Cloud y `GOOGLE_DRIVE_OAUTH_TOKEN_PATH` con una ruta segura fuera del repositorio. Después inicia sesión en ASIEContable y abre `http://localhost:3001/api/google-drive/connect` una sola vez para autorizar la cuenta documental.

Si no se proporcionan `GOOGLE_DRIVE_ROOT_FOLDER_ID` y `GOOGLE_DRIVE_DOCUMENTS_ROOT_FOLDER_ID`, el sistema reutiliza o crea la estructura `ASIEContable / Ordenes de compra` y `ASIEContable / Expedientes` en Mi unidad, sin generar carpetas duplicadas por nombre.

## Acceso con Firebase

El sistema utiliza Firebase Authentication con correo/contraseña y una cookie de sesión `httpOnly` validada en el servidor. Configura las variables `FIREBASE_PROJECT_ID`, `GOOGLE_APPLICATION_CREDENTIALS` y las variables públicas `NEXT_PUBLIC_FIREBASE_*` documentadas en `.env.example`. La cuenta de servicio debe permanecer fuera del repositorio.

En desarrollo abre `http://localhost:3001/login`. Los usuarios se administran desde Firebase Console; el sitio no ofrece registro público.

La pestaña `Templates / Carátulas` permite conservar un único PDF de presentación por empresa. El archivo se guarda en Google Drive y MySQL conserva solamente sus metadatos. Aplica:

```powershell
Get-Content -Raw database/migrations/022_create_company_cover_templates.sql | docker compose exec -T mysql sh -c 'exec mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"'
```

## Proveedores, productos y plantillas de órdenes

Aplica la migración del catálogo de proveedores:

```powershell
Get-Content -Raw database/migrations/017_create_suppliers.sql | docker compose exec -T mysql sh -c 'exec mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"'
Get-Content -Raw database/migrations/018_make_product_tax_optional.sql | docker compose exec -T mysql sh -c 'exec mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"'
```

- Proveedores: `http://localhost:3000/proveedores`
- Productos: `http://localhost:3000/productos`
- Plantillas por empresa: `http://localhost:3000/ordenes-compra/configuracion`
- Nueva orden con selector de empresa: `http://localhost:3000/ordenes-compra/nueva`

## Comandos útiles

```powershell
npm run lint
npm run build
npm run test:companies
npm run test:banks
npm run test:dossier
npm run test:expected-amounts
npm run test:suppliers
docker compose ps
docker compose logs mysql
docker compose stop
docker compose down
```

`docker compose down` conserva los datos. Para eliminar también el volumen se requiere explícitamente `docker compose down --volumes`.

## Problemas comunes

- **MySQL sigue iniciando:** espera a que `docker compose ps` muestre el estado `healthy`.
- **Puerto 3306 ocupado:** cambia `DB_PORT` en `.env` y reinicia Compose.
- **Acceso denegado:** confirma que `DB_NAME`, `DB_USER` y `DB_PASSWORD` coincidan en el mismo `.env`; si cambiaste credenciales después del primer arranque, recrea el volumen solo si puedes perder esos datos locales.
- **La app no encuentra MySQL:** al ejecutar Next.js desde la máquina usa `DB_HOST=127.0.0.1`; `mysql` se usaría como host únicamente desde otro contenedor de la misma red.
