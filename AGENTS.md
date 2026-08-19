<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Reglas de ASIEContable

- Trabajar únicamente en la fase solicitada; no adelantar módulos futuros.
- Mantener un monolito modular con Next.js App Router, TypeScript estricto, Tailwind CSS, MySQL y `mysql2/promise`.
- No agregar Express, MongoDB, GridFS ni microservicios.
- Separar componentes visuales, lógica de negocio y acceso a datos.
- Mantener secretos y configuración fuera del código mediante variables de entorno.
- No guardar archivos `.env`, credenciales ni secretos en Git.
- Ejecutar `npm run lint` y `npm run build` al terminar cada tarea.
- Informar los archivos modificados y las validaciones ejecutadas en cada entrega.
