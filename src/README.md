# Vitalid App - Estructura de Proyecto

## Arquitectura: Monolito Modular en Capas

La aplicación sigue una arquitectura en capas para separar responsabilidades:

### 📁 Estructura de Carpetas

```
src/
├── pages/                    # Vistas principales/Containers
│   └── App.tsx              # Página principal (usa hooks y servicios)
│
├── components/              # Componentes React
│   ├── presentation/        # Componentes de presentación reutilizables
│   │   ├── LoginScreen.tsx
│   │   ├── DoctorCard.tsx
│   │   ├── ChatInterface.tsx
│   │   └── ... (más componentes)
│   └── ui/                  # Componentes base de UI (shadcn)
│       ├── button.tsx
│       ├── dialog.tsx
│       └── ... (componentes de UI)
│
├── hooks/                   # Lógica reutilizable (Custom Hooks)
│   ├── useAuth.ts          # Manejo de autenticación
│   ├── useNavigation.ts    # Manejo de navegación
│   ├── useDoctors.ts       # Datos de doctores
│   ├── useChat.ts          # Lógica de chat
│   ├── useTreatments.ts    # Datos de tratamientos
│   └── useHealthData.ts    # Datos de salud
│
├── services/                # Llamadas a API y lógica de datos
│   ├── doctorService.ts    # Operaciones con doctores
│   ├── chatService.ts      # Operaciones de chat
│   ├── treatmentService.ts # Operaciones de tratamientos
│   └── healthService.ts    # Operaciones de salud
│
├── types/                   # Tipos TypeScript centralizados
│   └── index.ts            # Todos los tipos de la app
│
├── context/                 # Estado global (opcional)
│   └── (Para estado compartido entre componentes)
│
├── utils/                   # Funciones auxiliares
│   └── (Utilidades generales)
│
├── images/                  # Activos de imágenes
├── styles/                  # Estilos CSS globales
├── main.tsx                 # Punto de entrada
└── app/                     # Componentes legacy (en transición)
    └── (Se mantendrá por compatibilidad)
```

---

## 🏗️ Patrones de Arquitectura

### 1. **Separación de Responsabilidades**

```
DATA LAYER (services/)
     ↓
LOGIC LAYER (hooks/)
     ↓
PRESENTATION LAYER (components/)
```

### 2. **Flujo de Datos**

```
Component
   ↓
Hook (useChat, useDoctors, etc)
   ↓
Service (chatService, doctorService, etc)
   ↓
API (mock o real)
```

### 3. **Ejemplo de Uso**

#### ❌ **SIN SEPARACIÓN (Antes)**
```typescript
export function ChatInterface() {
  const [messages, setMessages] = useState([]);
  
  // Lógica de API aquí
  const handleSend = async (msg) => {
    const response = await fetch('/api/chat', {...});
    setMessages([...messages, response]);
  };
  
  return <div>...</div>; // Presentación
}
```

#### ✅ **CON SEPARACIÓN (Ahora)**
```typescript
// hooks/useChat.ts (LÓGICA)
export function useChat(doctorId: number | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const sendMessage = async (content: string) => {
    const message = await chatService.send(doctorId, content);
    setMessages(prev => [...prev, message]);
  };
  
  return { messages, sendMessage };
}

// services/chatService.ts (DATOS)
export const chatService = {
  send: async (doctorId, content) => {
    return fetch('/api/chat', {...});
  }
};

// components/presentation/ChatInterface.tsx (PRESENTACIÓN)
export function ChatInterface() {
  const { messages, sendMessage } = useChat(selectedDoctor);
  return <div>...</div>; // Solo UI
}
```

---

## 🎯 Ventajas de esta Arquitectura

| Beneficio | Descripción |
|-----------|-------------|
| **Mantenibilidad** | Cambios en API = cambios en services, no en componentes |
| **Testabilidad** | Cada capa se puede testear independientemente |
| **Reutilización** | Hooks se pueden reutilizar en múltiples componentes |
| **Escalabilidad** | Fácil agregar nuevas funcionalidades |
| **Separación de Concerns** | Cada archivo tiene una responsabilidad clara |

---

## 🔧 Cómo Agregar Nueva Funcionalidad

### 1. Crear el Tipo (types/index.ts)
```typescript
export interface NewFeature {
  id: string;
  name: string;
}
```

### 2. Crear el Servicio (services/newFeatureService.ts)
```typescript
export const newFeatureService = {
  getAll: (): NewFeature[] => {
    return []; // datos
  }
};
```

### 3. Crear el Hook (hooks/useNewFeature.ts)
```typescript
export function useNewFeature() {
  const [data, setData] = useState<NewFeature[]>([]);
  
  useEffect(() => {
    const result = newFeatureService.getAll();
    setData(result);
  }, []);
  
  return { data };
}
```

### 4. Usar en Componente (components/presentation/)
```typescript
export function NewFeatureComponent() {
  const { data } = useNewFeature();
  return <div>{/* Presentación */}</div>;
}
```

---

## 📝 Reglas de la Arquitectura

✅ **HACER:**
- Lógica compleja en hooks
- Llamadas a API en services
- Solo presentación en components
- Tipos compartidos en types/
- Funciones puras cuando sea posible

❌ **NO HACER:**
- API calls directamente en componentes
- Lógica en components presentacionales
- Props drilling excesivo
- Tipos esparcidos por el código
- Estado global innecesario

---

## 🚀 Landing Page Estática

El archivo `index.html` en la raíz se mantiene como página estática HTML para:
- ✅ Mejor SEO
- ✅ Carga más rápida
- ✅ Sin JavaScript innecesario

La aplicación React (`app.html`) está separada como la app interactiva.

---

## 📚 Recursos Útiles

- [TypeScript en React](https://react.dev/learn/typescript)
- [Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [Hooks API Reference](https://react.dev/reference/react)
- [Tailwind CSS](https://tailwindcss.com/)
