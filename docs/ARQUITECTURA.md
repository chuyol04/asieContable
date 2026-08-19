# Arquitectura

## Base inicial

ASIEContable comienza como un monolito modular en Next.js con App Router. Las páginas, endpoints y módulos compartirán una aplicación desplegable, pero el código mantendrá separadas la interfaz, la lógica de negocio y el acceso a datos.

- **Next.js y TypeScript:** aplicación web principal y rutas HTTP.
- **Tailwind CSS:** estilos de interfaz.
- **MySQL:** base de datos relacional para información operativa y financiera.
- **mysql2/promise:** pool inicial de acceso a MySQL sin una capa ORM prematura.
- **Docker Compose:** una instancia reproducible de MySQL para desarrollo local.

## Integraciones futuras

- Google Drive será el repositorio documental; la aplicación almacenará referencias y metadatos.
- Firebase Authentication proporcionará autenticación cuando se implemente la fase correspondiente.
- La producción podrá ejecutarse en un VPS con Nginx y Docker.

## Decisiones

No se incorpora Express porque los Route Handlers de Next.js cubren la API del monolito sin mantener un segundo servidor. No se incorpora MongoDB porque las relaciones financieras y operativas definidas encajan en MySQL y requieren consistencia relacional. Tampoco se crean microservicios antes de existir límites operativos que los justifiquen.
