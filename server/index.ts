import express, { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { camelCaseResponseMiddleware } from './middlewares/camelCaseMiddleware';
import { WebSocketServer } from 'ws';

declare global {
  var wss: WebSocketServer | undefined;
  var upgradeListenerAdded: boolean | undefined;
  var serverStarted: boolean | undefined;
}

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Log all requests for debugging
app.use((req, res, next) => {
  if (req.path.startsWith('/api/orders') && req.method === 'POST') {
    console.log('=== REQUEST MIDDLEWARE DEBUG ===');
    console.log('Path:', req.path);
    console.log('Content-Type:', req.get('content-type'));
    console.log('Body keys:', Object.keys(req.body));
    console.log('Body:', req.body);
    console.log('=== END MIDDLEWARE DEBUG ===');
  }
  next();
});

app.use(camelCaseResponseMiddleware);

// Middleware de logging
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

if (!global.serverStarted) {
  global.serverStarted = true;

  (async () => {
    const server = await registerRoutes(app);

    // Configuración WebSocket
    if (!global.wss) {
      global.wss = new WebSocketServer({ noServer: true });

      global.wss.on('connection', (ws) => {
        console.log('Nueva conexión WebSocket establecida');

        ws.on('message', (message) => {
          try {
            const data = JSON.parse(message.toString());
            console.log('Mensaje WebSocket recibido:', data);
          } catch (error) {
            console.error('Error al procesar mensaje WebSocket:', error);
          }
        });

        ws.on('close', () => {
          console.log('Conexión WebSocket cerrada');
        });

        ws.on('error', (error) => {
          console.error('Error en WebSocket:', error);
        });
      });
    }

    // Manejador de upgrade (WebSocket)
    if (!global.upgradeListenerAdded) {
      // Eliminamos cualquier listener previo para evitar duplicados
      server.removeAllListeners('upgrade');

      server.on('upgrade', (req, socket, head) => {
        if (req.url === '/ws') {
          if (!socket.destroyed) {  // Verificamos que el socket no esté cerrado
            global.wss!.handleUpgrade(req, socket, head, (ws) => {
              global.wss!.emit('connection', ws, req);
            });
          }
        } else {
          socket.destroy();
        }
      });
      global.upgradeListenerAdded = true;
    }

    // Configuración Vite para desarrollo o archivos estáticos para producción
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Iniciar servidor
    const port = 2000;
    server.listen({
      port,
      host: "0.0.0.0",
    }, () => {
      log(`Servidor activo en http://localhost:${port}`);
    });
  })();
} else {
  console.log('Servidor ya está iniciado — No se inicia otra vez');
}