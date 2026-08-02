# MotoManager Frontend Connect

Vamos a construir el frontend de MotoManager usando el backend real ya cerrado.

Usa como referencia principal:
- docs/01_PRD/requirements.md
- docs/02_UX/ux_blueprint.md
- docs/05_OpenAPI/openapi.yaml
- backend/README.md
- prompts/lovable/final/sprint-04/

Backend local:
- API base: http://localhost:8000/api/v1/
- Swagger: http://localhost:8000/api/docs/
- Admin Jazzmin: http://localhost:8000/admin/

Credenciales iniciales:
- email: admin@taller.com
- password: Clave123456

Objetivo:
Implementar Sprint 04 conectando pantallas reales al backend: login, layout autenticado, navegación por rol, dashboard base, clientes, motos, recepción, diagnóstico, cotización y órdenes de trabajo.

No inventes endpoints. Si falta algo o un endpoint no responde como espera el frontend, reporta el bloqueo exacto para que Claude lo corrija en backend.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/28346008-c0dd-4a4c-9ac5-15a28b0f2e62).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
