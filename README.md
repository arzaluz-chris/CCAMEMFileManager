# CCAMEMFileManager

Para ejecutar el entorno de desarrollo se deben iniciar por separado el
frontend y el backend.

```bash
# Iniciar frontend
cd frontend
npm run dev
```

```bash
# Iniciar backend
cd backend
npm run dev
```

El frontend quedará accesible en `http://localhost:5173` y el backend en
`http://localhost:3000`.


Durante el desarrollo las peticiones realizadas a la ruta `/api` desde el
frontend se redirigen automáticamente al backend gracias a la configuración de
proxy en `vite.config.js`.


