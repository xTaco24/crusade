# 🗳️ Sistema de Votación Crusade - UNAB!

Una plataforma de votación digital moderna y segura construida para las elecciones estudiantiles de la Universidad Andrés Bello (UNAB). Este sistema proporciona una solución integral para gestionar procesos electorales con seguimiento de votos en tiempo real, controles administrativos y una interfaz fácil de usar.

## 🌟 Características

### 🔐 **Seguridad y Autenticación**
- Autenticación segura basada en email con validación de dominio UNAB
- Control de acceso basado en roles (Estudiantes, Administradores, Comité Electoral)
- Encriptación de votos y generación de comprobantes
- Aplicación de un solo voto por elección

### 🗳️ **Sistema de Votación**
- Votación en tiempo real con resultados en vivo
- Soporte para múltiples listas de candidatos
- Sistema de confirmación de voto y comprobantes
- Gestión de períodos de votación (programado, activo, pausado, cerrado)

### 👨‍💼 **Panel Administrativo**
- Gestión completa del ciclo de vida electoral
- Gestión de candidatos y listas
- Herramientas de simulación de votos para pruebas
- Análisis y reportes en tiempo real
- Control de estado de elecciones (borrador, programado, activo, cerrado, publicado)

### 📊 **Análisis y Reportes**
- Gráficos de distribución de votos en tiempo real
- Seguimiento de tasa de participación
- Tendencias históricas de votación
- Resultados detallados de elecciones con representaciones visuales

### 🎨 **Experiencia de Usuario**
- Diseño moderno y responsivo con tema oscuro
- Animaciones suaves y micro-interacciones
- Interfaz amigable para móviles
- Navegación intuitiva y flujos de usuario

## 🚀 Demo en Vivo

**Sitio de Producción:** 

### Credenciales de Demostración
```
Admin:


Estudiante:
Email: student@uandresbello.edu
Contraseña: password123

Comité Electoral:
Email: committee@unab.cl
Contraseña: password123
```

## 🛠️ Stack Tecnológico

- **Frontend:** React 18 + TypeScript
- **Estilos:** Tailwind CSS
- **Animaciones:** Framer Motion
- **Gráficos:** Recharts
- **Formularios:** React Hook Form + validación Yup
- **Enrutamiento:** React Router DOM
- **Iconos:** Lucide React
- **Herramienta de Construcción:** Vite
- **Notificaciones:** React Hot Toast

## 📋 Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Navegador web moderno

## ⚡ Inicio Rápido

### 1. Clonar el repositorio
```bash
git clone https://github.com/yourusername/crusade-voting.git
cd crusade-voting
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Iniciar servidor de desarrollo
```bash
npm run dev
```

### 4. Abrir el navegador
Navegar a `http://localhost:5173`

## 🏗️ Estructura del Proyecto

```
src/
├── components/           # Componentes UI reutilizables
│   ├── Layout/          # Componentes de diseño
│   ├── UI/              # Elementos UI básicos
│   └── ...              # Componentes específicos de características
├── hooks/               # Hooks personalizados de React
│   ├── useAuth.tsx      # Lógica de autenticación
│   ├── useElections.ts  # Gestión de elecciones
│   └── useVoting.ts     # Funcionalidad de votación
├── pages/               # Componentes de página
│   ├── Admin/           # Páginas administrativas
│   ├── Landing.tsx      # Página de inicio
│   ├── Login.tsx        # Autenticación
│   └── ...              # Otras páginas
├── types/               # Definiciones de tipos TypeScript
├── utils/               # Funciones utilitarias y constantes
├── lib/                 # Configuraciones de librerías externas
└── main.tsx             # Punto de entrada de la aplicación
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Iniciar servidor de desarrollo
npm run build        # Construir para producción
npm run preview      # Vista previa de construcción de producción
npm run lint         # Ejecutar ESLint

# Verificación de tipos
npm run type-check   # Ejecutar verificación del compilador TypeScript
```

## 🎯 Roles de Usuario y Permisos

### 👨‍🎓 **Estudiante**
- Ver elecciones disponibles
- Emitir votos en elecciones activas
- Ver resultados de elecciones
- Acceder a comprobantes de votación

### 👨‍💼 **Administrador**
- Acceso completo al sistema
- Crear y gestionar elecciones
- Controlar el ciclo de vida electoral
- Acceder a análisis y reportes
- Gestionar listas de candidatos
- Usar herramientas de simulación de votos

### 🏛️ **Comité Electoral**
- Monitorear procesos electorales
- Ver reportes detallados
- Asistir con supervisión electoral

## 📊 Ciclo de Vida Electoral

1. **Borrador** - Elección siendo configurada
2. **Programada** - Elección planificada para el futuro
3. **Campaña** - Período de campaña activo
4. **Votación Abierta** - Período de votación activo
5. **Pausada** - Temporalmente suspendida
6. **Votación Cerrada** - Período de votación terminado
7. **Resultados Publicados** - Resultados finales disponibles

## 🔒 Características de Seguridad

- **Validación de Dominio**: Solo se aceptan emails @uandresbello.edu y @unab.cl
- **Integridad del Voto**: Cada usuario puede votar solo una vez por elección
- **Almacenamiento Encriptado**: Datos de voto almacenados de forma segura
- **Rastro de Auditoría**: Seguimiento completo del historial de votación
- **Sistema de Comprobantes**: Confirmación criptográfica de votos

## 📱 Diseño Responsivo

La aplicación es completamente responsiva y optimizada para:
- 📱 Dispositivos móviles (320px+)
- 📱 Tablets (768px+)
- 💻 Escritorio (1024px+)
- 🖥️ Pantallas grandes (1440px+)

## 🎨 Sistema de Diseño

### Colores
- **Primario**: Azul (#3B82F6)
- **Éxito**: Verde (#10B981)
- **Advertencia**: Amarillo (#F59E0B)
- **Error**: Rojo (#EF4444)
- **Fondo**: Gris Oscuro (#111827)

### Tipografía
- **Familia de Fuente**: Fuentes del sistema para rendimiento óptimo
- **Encabezados**: Pesos en negrita con jerarquía adecuada
- **Cuerpo**: Peso regular con altura de línea del 150%

## 🧪 Características de Prueba

### Simulador de Votos
- Generar votos de prueba para desarrollo
- Múltiples patrones de votación (aleatorio, realista, competitivo)
- Conteos de votos y tiempos configurables
- Actualizaciones de resultados en tiempo real

## 🚀 Despliegue

### Construir para Producción
```bash
npm run build
```

### Desplegar en Bolt Hosting
La aplicación está configurada para fácil despliegue en Bolt Hosting con construcciones automáticas.

### Variables de Entorno
```env
VITE_APP_NAME=Sistema de Votación Crusade
VITE_APP_VERSION=1.0.0
```

## 🤝 Contribuir

1. Hacer fork del repositorio
2. Crear una rama de característica (`git checkout -b feature/caracteristica-increible`)
3. Hacer commit de los cambios (`git commit -m 'Agregar característica increíble'`)
4. Hacer push a la rama (`git push origin feature/caracteristica-increible`)
5. Abrir un Pull Request

### Guías de Desarrollo
- Seguir las mejores prácticas de TypeScript
- Usar Tailwind CSS para estilos
- Implementar manejo adecuado de errores
- Agregar estados de carga para operaciones asíncronas
- Asegurar responsividad móvil

## 📝 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🏫 Acerca de UNAB

La Universidad Andrés Bello (UNAB) es una prestigiosa universidad privada en Chile, comprometida con brindar educación de calidad y fomentar la participación democrática entre su cuerpo estudiantil.

## 📞 Soporte

Para soporte y preguntas:
- 📧 Email: soporte@unab.cl
- 🌐 Sitio Web: [https://www.unab.cl] (https://www.unab.cl)

## 🙏 Reconocimientos

- Gobierno Estudiantil UNAB por los requisitos y retroalimentación
- Comunidades de React y TypeScript por su excelente documentación
- Tailwind CSS por el framework CSS utility-first
- Todos los contribuidores que ayudaron a hacer posible este proyecto

---

**Hecho con ❤️ para la Universidad Andrés Bello**

*Empoderando la participación democrática a través de la tecnología*
