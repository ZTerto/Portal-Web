.PHONY: up down reload upFrontend upBackend fclean db build test build0 build1 build2

# Levantar entorno docker
up:
	docker-compose up -d --build
	@echo ""
	@echo "🚀 Servicios levantados:"
	@echo "PostgreSQL → localhost:55432"
	@echo "Backend    → http://localhost:3000"
	@echo "Frontend   → http://localhost:5173"
	@echo ""

# Detener entorno docker completamente
down:
	@echo "🛑 Deteniendo todos los servicios Docker..."
	@docker-compose down --remove-orphans

	@echo "✨ Entorno detenido completamente."

reload:
	@echo "🔄 Reiniciando entorno (sin borrar BD)..."
	docker-compose down
	docker-compose up -d --build

	@echo "⏳ Esperando a backend..."
	@until curl -s http://localhost:3000/ping > /dev/null; do \
		sleep 1; \
	done

	@echo ""
	@echo "🚀 Servicios levantados:"
	@echo "PostgreSQL → localhost:55432"
	@echo "Backend    → http://localhost:3000"
	@echo "Frontend   → http://localhost:5173"



# Probar entorno completo
test:
	@echo "🧪 Ejecutando test del entorno..."
	@echo ""

	@echo "🔍 Probando backend (http://localhost:3000/ping)..."
	@response_backend=$$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ping); \
	if [ "$$response_backend" = "200" ]; then \
		echo "   ✔ Backend OK — responde correctamente"; \
		echo "   👉 http://localhost:3000/ping"; \
	else \
		echo "   ❌ Backend NO responde"; \
	fi
	@echo ""

	@echo "🔍 Probando frontend (http://localhost:5173)..."
	@response_frontend=$$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173); \
	if [ "$$response_frontend" = "200" ] || [ "$$response_frontend" = "304" ]; then \
		echo "   ✔ Frontend OK — responde correctamente"; \
		echo "   👉 http://localhost:5173"; \
	else \
		echo "   ❌ Frontend NO responde"; \
	fi
	@echo ""

	@echo "🔍 Esperando a PostgreSQL..."
	@for i in 1 2 3 4 5 6 7 8 9 10; do \
		docker exec postgres-db pg_isready -U appuser -d appdb >/dev/null 2>&1 && break; \
		echo "   ⏳ PostgreSQL aún no listo..."; \
		sleep 1; \
	done

	@docker exec postgres-db pg_isready -U appuser -d appdb >/dev/null 2>&1 && \
		echo "   ✔ PostgreSQL OK — acepta conexiones (localhost:55432)" || \
		echo "   ❌ PostgreSQL NO responde"

	@echo ""

	@echo "🔍 Probando consulta SQL básica..."
	@docker exec postgres-db psql -U appuser -d appdb -c "SELECT 1;" >/dev/null 2>&1 && \
		echo "   ✔ SQL OK — consulta ejecutada correctamente" || \
		echo "   ❌ SQL FALLÓ"


	@echo "✅ Tests finalizados"


# Limpiar todo
# fclean:
#	@echo "🧹 Limpiando entorno del frontend..."
#	rm -rf frontend
#	rm -f docker-compose.yml
#	rm -f frontend/.env
#
#	@echo "🧹 Limpiando entorno del backend..."
#	rm -rf backend
#	rm -rf mongo-data
#	rm -f backend/.env
#
#	@echo "🧹 Limpiando entorno SQL..."
#	rm -rf postgres-data
#
#	@echo "🧹 Eliminando .env global..."
#	rm -f .env
#
#	@echo "✅ Limpieza completa."


# Acceder a la base de datos PostgreSQL
db:
	@echo ""
	@echo "🐘 Acceso a PostgreSQL"
	@echo "----------------------------------------"
	@echo "Dentro de psql puedes usar:"
	@echo ""
	@echo "  \\dt                     → listar tablas"
	@echo "  SELECT * FROM users;     → ver usuarios"
	@echo "  SELECT * FROM roles;     → ver roles"
	@echo "  SELECT * FROM user_roles;"
	@echo ""
	@echo "  \\q                      → salir"
	@echo "----------------------------------------"
	@echo ""
	@docker exec -it postgres-db psql -U appuser -d appdb


# Verificar entorno
build:
	@echo "🧪 Verificando entorno..."

	@# Verificar make
	@if ! command -v make > /dev/null; then \
		echo "❌ make no está instalado. Instálalo con: sudo apt install make"; \
		exit 1; \
	else \
		echo "✅ make instalado"; \
	fi

	@# Verificar node
	@if ! command -v node > /dev/null; then \
		echo "❌ Node.js no está instalado. Instálalo con: sudo apt install nodejs"; \
		exit 1; \
	else \
		echo "✅ Node.js instalado: $$(node -v)"; \
	fi

	@# Verificar npm
	@if ! command -v npm > /dev/null; then \
		echo "❌ npm no está instalado. Instálalo con: sudo apt install npm"; \
		exit 1; \
	else \
		echo "✅ npm instalado: $$(npm -v)"; \
	fi

	@# Verificar docker
	@if ! command -v docker > /dev/null; then \
		echo "❌ Docker no está instalado. Instálalo con: sudo apt install docker.io"; \
		exit 1; \
	else \
		echo "✅ Docker instalado: $$(docker --version)"; \
	fi

	@# Verificar docker-compose
	@if ! command -v docker-compose > /dev/null; then \
		echo "❌ docker-compose no está instalado. Instálalo con: sudo apt install docker-compose"; \
		exit 1; \
	else \
		echo "✅ docker-compose instalado: $$(docker-compose --version)"; \
	fi

	@echo "📦 Instalando dependencias backend..."
	@if [ -f backend/package.json ]; then \
		cd backend && npm install bcrypt; \
	fi

	@echo "🎉 Todos los requisitos están satisfechos."


# Construir entorno docker con Vite y TailwindCSS + instalación del frontend
build0:
	@echo "📁 Creando carpeta frontend..."
	@mkdir -p frontend

	@echo "📝 Creando archivo .env..."
	@echo "FRONTEND_PORT=8080" > .env
	@echo "BACKEND_PORT=3000" >> .env

	@echo "🐳 Construyendo contenedores (si existen)..."
	@docker-compose build >/dev/null 2>&1 || true

	@echo "📝 Generando docker-compose.yml..."
	@echo "services:" > docker-compose.yml
	@echo "  frontend:" >> docker-compose.yml
	@echo "    image: node:20" >> docker-compose.yml
	@echo "    working_dir: /app" >> docker-compose.yml
	@echo "    env_file: .env" >> docker-compose.yml
	@echo "    volumes:" >> docker-compose.yml
	@echo "      - ./frontend:/app" >> docker-compose.yml
	@echo '    command: ["npm", "run", "dev", "--", "--host", "--port", "8080"]' >> docker-compose.yml
	@echo "    ports:" >> docker-compose.yml
	@echo '      - "8080:8080"' >> docker-compose.yml
	@echo "" >> docker-compose.yml
	@echo "networks:" >> docker-compose.yml
	@echo "  app-network:" >> docker-compose.yml
	@echo "    driver: bridge" >> docker-compose.yml

	@echo "🔧 Modificando docker-compose.yml para usar variables del .env..."
	@sed -i 's/8080:8080/$${FRONTEND_PORT}:$${FRONTEND_PORT}/' docker-compose.yml
	@sed -i 's/"8080"/"$${FRONTEND_PORT}"/' docker-compose.yml

	@echo "⚙️  Ejecutando instalación de Vite dentro de frontend..."
	@cd frontend && npm create vite@latest

	@echo "🎉 build0 completado: entorno Vite + Docker creado correctamente."


# https://tailwindcss.com/docs/installation/using-vite
# Instalar Tailwind, configurar Vite, Router, SPA base y Dockerfile
build1:
	@echo "📝 Creando archivo .env en frontend..."
	@cd frontend && \
		echo "FRONTEND_PORT=8080" > .env && \
		echo "VITE_API_URL=http://localhost:3000" >> .env

	@echo "🧩 Configurando Tailwind, Vite y dependencias del frontend..."
	@cd frontend && \
		npm install -D vite >/dev/null 2>&1 && \
		npm install tailwindcss @tailwindcss/vite >/dev/null 2>&1 && \
		npm install react-router-dom @types/react-router-dom >/dev/null 2>&1 && \
		npm install jwt-decode >/dev/null 2>&1

	@echo "📝 Generando vite.config.ts..."
	@cd frontend && \
		echo "import { defineConfig } from 'vite'" > vite.config.ts && \
		echo "import tailwindcss from '@tailwindcss/vite'" >> vite.config.ts && \
		echo "" >> vite.config.ts && \
		echo "export default defineConfig({" >> vite.config.ts && \
		echo "  plugins: [" >> vite.config.ts && \
		echo "    tailwindcss()," >> vite.config.ts && \
		echo "  ]," >> vite.config.ts && \
		echo "})" >> vite.config.ts

	@echo "🎨 Generando index.css..."
	@cd frontend && \
		echo "@tailwind base;" > src/index.css && \
		echo "@tailwind components;" >> src/index.css && \
		echo "@tailwind utilities;" >> src/index.css && \
		echo '@import "tailwindcss";' >> src/index.css

	@echo "📁 Creando estructura de páginas..."
	@cd frontend && mkdir -p src/pages

	@echo "📝 Creando Home.tsx..."
	@cd frontend && \
		echo "export default function Home() {" > src/pages/Home.tsx && \
		echo "  return (" >> src/pages/Home.tsx && \
		echo "    <div className='p-6'>" >> src/pages/Home.tsx && \
		echo "      <h1 className='text-3xl font-bold'>Home Page</h1>" >> src/pages/Home.tsx && \
		echo "      <p>Bienvenido a tu aplicación React + Vite + Tailwind 🎉</p>" >> src/pages/Home.tsx && \
		echo "    </div>" >> src/pages/Home.tsx && \
		echo "  );" >> src/pages/Home.tsx && \
		echo "}" >> src/pages/Home.tsx

	@echo "📝 Creando Login.tsx..."
	@cd frontend && \
		echo "export default function Login() {" > src/pages/Login.tsx && \
		echo "  return (" >> src/pages/Login.tsx && \
		echo "    <div className='p-6'>" >> src/pages/Login.tsx && \
		echo "      <h1 className='text-3xl font-bold'>Login</h1>" >> src/pages/Login.tsx && \
		echo "      <p>Aquí gestionaremos el login más adelante.</p>" >> src/pages/Login.tsx && \
		echo "    </div>" >> src/pages/Login.tsx && \
		echo "  );" >> src/pages/Login.tsx && \
		echo "}" >> src/pages/Login.tsx

	@echo "🧰 Creando carpeta utils..."
	@cd frontend && mkdir -p src/utils

	@echo "🐳 Generando Dockerfile para el frontend..."
	@cd frontend && \
		echo "# Etapa de desarrollo" > Dockerfile && \
		echo "FROM node:20" >> Dockerfile && \
		echo "" >> Dockerfile && \
		echo "WORKDIR /app" >> Dockerfile && \
		echo "" >> Dockerfile && \
		echo "COPY package*.json ./" >> Dockerfile && \
		echo "RUN npm install" >> Dockerfile && \
		echo "COPY . ." >> Dockerfile && \
		echo "EXPOSE 8080" >> Dockerfile && \
		echo 'CMD ["npm", "run", "dev", "--", "--host", "--port", "8080"]' >> Dockerfile

	@echo "🔧 Ajustando Dockerfile para usar variables del .env..."
	@cd frontend && \
		sed -i 's/EXPOSE 8080/EXPOSE $${FRONTEND_PORT}/' Dockerfile && \
		sed -i 's/"8080"/"$${FRONTEND_PORT}"/' Dockerfile

	@echo "✅ Frontend configurado correctamente (Tailwind + Router + Home + Login + utils + Dockerfile dinámico)"


# Configurar entorno completo: PostgreSQL + Docker + Backend + Frontend
build2:
	@echo "🐘 Inicializando build2 (PostgreSQL + Docker)..."

	@echo "🧹 Borrando archivos previos..."
	@rm -f docker-compose.yml
	@rm -f .env
	@rm -f backend/.env
	@rm -f backend/Dockerfile

	@echo "📁 Creando estructura necesaria..."
	@mkdir -p postgres-data
	@mkdir -p backend

	@echo "📦 Creando backend/package.json..."
	@rm -f backend/package.json
	@echo "{" > backend/package.json
	@echo "  \"name\": \"backend\"," >> backend/package.json
	@echo "  \"version\": \"1.0.0\"," >> backend/package.json
	@echo "  \"type\": \"module\"," >> backend/package.json
	@echo "  \"main\": \"index.js\"," >> backend/package.json
	@echo "  \"scripts\": {" >> backend/package.json
	@echo "    \"start\": \"node index.js\"" >> backend/package.json
	@echo "  }," >> backend/package.json
	@echo "  \"dependencies\": {" >> backend/package.json
	@echo "    \"express\": \"^4.19.2\"," >> backend/package.json
	@echo "    \"pg\": \"^8.11.5\"" >> backend/package.json
	@echo "  }" >> backend/package.json
	@echo "}" >> backend/package.json


	@echo "📝 Creando .env global..."
	@echo "POSTGRES_DB=appdb" > .env
	@echo "POSTGRES_USER=appuser" >> .env
	@echo "POSTGRES_PASSWORD=apppassword" >> .env
	@echo "POSTGRES_PORT=5432" >> .env
	@echo "BACKEND_PORT=3000" >> .env
	@echo "FRONTEND_PORT=5173" >> .env

	@echo "📝 Creando .env del backend..."
	@echo "DB_HOST=db" > backend/.env
	@echo "DB_PORT=5432" >> backend/.env
	@echo "DB_NAME=appdb" >> backend/.env
	@echo "DB_USER=appuser" >> backend/.env
	@echo "DB_PASSWORD=apppassword" >> backend/.env

	@echo "🧠 Creando backend/index.js..."
	@rm -f backend/index.js
	@echo "import express from 'express';" > backend/index.js
	@echo "" >> backend/index.js
	@echo "const app = express();" >> backend/index.js
	@echo "const port = process.env.BACKEND_PORT || 3000;" >> backend/index.js
	@echo "" >> backend/index.js
	@echo "app.get('/', (req, res) => {" >> backend/index.js
	@echo "  res.send('Backend Portal-TDM funcionando correctamente 🚀');" >> backend/index.js
	@echo "});" >> backend/index.js
	@echo "" >> backend/index.js
	@echo "app.get('/ping', (req, res) => {" >> backend/index.js
	@echo "  res.send('backend pong 🏓');" >> backend/index.js
	@echo "});" >> backend/index.js
	@echo "" >> backend/index.js
	@echo "app.listen(port, '0.0.0.0', () => {" >> backend/index.js
	@echo "  console.log('Backend listening on port ' + port);" >> backend/index.js
	@echo "});" >> backend/index.js

	@echo "🐳 Creando Dockerfile del backend..."
	@echo "FROM node:20-alpine" > backend/Dockerfile
	@echo "" >> backend/Dockerfile
	@echo "WORKDIR /app" >> backend/Dockerfile
	@echo "" >> backend/Dockerfile
	@echo "COPY package*.json ./" >> backend/Dockerfile
	@echo "RUN npm install" >> backend/Dockerfile
	@echo "" >> backend/Dockerfile
	@echo "COPY . ." >> backend/Dockerfile
	@echo "" >> backend/Dockerfile
	@echo "EXPOSE 3000" >> backend/Dockerfile
	@echo "" >> backend/Dockerfile
	@echo "CMD [\"node\", \"index.js\"]" >> backend/Dockerfile

	@echo "🐳 Creando docker-compose.yml base (placeholders)..."
	@rm -f docker-compose.yml
	@echo "services:" > docker-compose.yml
	@echo "  db:" >> docker-compose.yml
	@echo "    image: postgres:16" >> docker-compose.yml
	@echo "    container_name: postgres-db" >> docker-compose.yml
	@echo "    restart: always" >> docker-compose.yml
	@echo "    env_file: .env" >> docker-compose.yml
	@echo "    environment:" >> docker-compose.yml
	@echo "      POSTGRES_DB: POSTGRES_DB_VALUE" >> docker-compose.yml
	@echo "      POSTGRES_USER: POSTGRES_USER_VALUE" >> docker-compose.yml
	@echo "      POSTGRES_PASSWORD: POSTGRES_PASSWORD_VALUE" >> docker-compose.yml
	@echo "    ports:" >> docker-compose.yml
	@echo "      - \"55432:5432\"" >> docker-compose.yml
	@echo "    volumes:" >> docker-compose.yml
	@echo "      - postgres-data:/var/lib/postgresql/data" >> docker-compose.yml
	@echo "    networks:" >> docker-compose.yml
	@echo "      - app-network" >> docker-compose.yml
	@echo "" >> docker-compose.yml
	@echo "  backend:" >> docker-compose.yml
	@echo "    build: ./backend" >> docker-compose.yml
	@echo "    container_name: backend" >> docker-compose.yml
	@echo "    env_file:" >> docker-compose.yml
	@echo "      - ./backend/.env" >> docker-compose.yml
	@echo "    ports:" >> docker-compose.yml
	@echo "      - \"BACKEND_PORT_VALUE:3000\"" >> docker-compose.yml
	@echo "    depends_on:" >> docker-compose.yml
	@echo "      - db" >> docker-compose.yml
	@echo "    networks:" >> docker-compose.yml
	@echo "      - app-network" >> docker-compose.yml
	@echo "" >> docker-compose.yml
	@echo "  frontend:" >> docker-compose.yml
	@echo "    image: node:20" >> docker-compose.yml
	@echo "    container_name: frontend" >> docker-compose.yml
	@echo "    working_dir: /app" >> docker-compose.yml
	@echo "    env_file: .env" >> docker-compose.yml
	@echo "    volumes:" >> docker-compose.yml
	@echo "      - ./frontend:/app" >> docker-compose.yml
	@echo "    command: [\"npm\", \"run\", \"dev\", \"--\", \"--host\", \"--port\", \"FRONTEND_PORT_VALUE\"]" >> docker-compose.yml
	@echo "    ports:" >> docker-compose.yml
	@echo "      - \"FRONTEND_PORT_VALUE:FRONTEND_PORT_VALUE\"" >> docker-compose.yml
	@echo "    depends_on:" >> docker-compose.yml
	@echo "      - backend" >> docker-compose.yml
	@echo "    networks:" >> docker-compose.yml
	@echo "      - app-network" >> docker-compose.yml
	@echo "" >> docker-compose.yml
	@echo "networks:" >> docker-compose.yml
	@echo "  app-network:" >> docker-compose.yml
	@echo "    driver: bridge" >> docker-compose.yml
	@echo "" >> docker-compose.yml
	@echo "volumes:" >> docker-compose.yml
	@echo "  postgres-data:" >> docker-compose.yml

	@echo "🔧 Sustituyendo placeholders por variables de entorno..."
	@sed -i 's/POSTGRES_DB_VALUE/$${POSTGRES_DB}/g' docker-compose.yml
	@sed -i 's/POSTGRES_USER_VALUE/$${POSTGRES_USER}/g' docker-compose.yml
	@sed -i 's/POSTGRES_PASSWORD_VALUE/$${POSTGRES_PASSWORD}/g' docker-compose.yml
	@sed -i 's/BACKEND_PORT_VALUE/$${BACKEND_PORT}/g' docker-compose.yml
	@sed -i 's/FRONTEND_PORT_VALUE/$${FRONTEND_PORT}/g' docker-compose.yml


	@echo "📦 Instalando dependencias backend si existen..."
	@cd backend && npm install >/dev/null 2>&1 || true

	@echo "✅ build2 finalizado correctamente"
