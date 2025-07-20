# CCAMEMFileManager

Este proyecto se compone de un backend en Express y un frontend en React.
Antes de arrancar los servicios es necesario crear la base de datos.

## Configuración rápida de la base de datos

Ejecuta el script `setup-database.sh` desde la raíz del proyecto. Este script
crea el usuario `ccamem_user`, la base `ccamem_archivo` y carga el esquema
inicial.

```bash
./setup-database.sh
```

## Entorno de desarrollo

Inicia el frontend y el backend en terminales diferentes:

```bash
# Frontend
cd frontend
npm run dev
```

```bash
# Backend
cd backend
npm run dev
```

El frontend estará disponible en `http://localhost:5173` y el backend en
`http://localhost:3000`.

Durante el desarrollo las peticiones a `/api` se redirigen automáticamente al
backend gracias al proxy definido en `vite.config.js`.
