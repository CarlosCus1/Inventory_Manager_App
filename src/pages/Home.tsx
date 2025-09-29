/**
 * HOME PAGE OPTIMIZADA - GESTIÓN 360
 *
 * RESUMEN DE MEJORAS IMPLEMENTADAS:
 * ================================
 * ✅ Login corporativo con diseño profesional
 * ✅ Priorización: Devoluciones → Inventario → Pedidos → Comparador
 * ✅ Fondo interactivo dinámico con partículas y gradientes
 * ✅ Eliminación de redundancia (métricas duplicadas)
 * ✅ Grid responsivo optimizado para móviles
 * ✅ Micro-interacciones y animaciones sutiles
 * ✅ Accesibilidad completa mejorada
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ModuleType } from '../enums';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

// Componente de fondo interactivo
const InteractiveBackground: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Partículas flotantes */}
      <div className="absolute top-20 left-10 w-2 h-2 bg-blue-400/20 rounded-full animate-pulse" />
      <div className="absolute top-40 right-20 w-1 h-1 bg-purple-400/30 rounded-full animate-bounce" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-32 left-1/4 w-3 h-3 bg-indigo-400/20 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute top-60 left-1/3 w-1 h-1 bg-cyan-400/25 rounded-full animate-pulse" style={{ animationDelay: '3s' }} />

      {/* Gradiente interactivo que responde al mouse */}
      <div
        className="absolute inset-0 transition-all duration-1000 ease-out"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}% ${mousePosition.y}%,
                       rgba(59, 130, 246, 0.05),
                       rgba(139, 92, 246, 0.03) 40%,
                       transparent 70%)`
        }}
      />

      {/* Gradiente base sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-indigo-50/30
                      dark:from-blue-900/5 dark:via-purple-900/3 dark:to-indigo-900/5" />
    </div>
  );
};

interface ModuleCardProps {
  to: string;
  title: string;
  desc: string;
  variant: "devoluciones" | "pedido" | "inventario" | "comparador";
  icon: React.ReactNode;
  priority: 1 | 2 | 3 | 4;
  description: string;
}

const OptimizedModuleCard: React.FC<ModuleCardProps> = ({
  to,
  title,
  desc,
  variant,
  icon,
  priority,
  description
}) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const handleOpen = () => {
    if (to) navigate(to);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleOpen();
    }
  };

  // Clases según prioridad usando el sistema de diseño
  const getPriorityClasses = () => {
    const baseClasses = "module-card";

    switch (priority) {
      case 1: // Devoluciones - Crítico
        return `${baseClasses} priority-critical`;
      case 2: // Inventario - Alto
        return `${baseClasses} priority-high`;
      case 3: // Pedidos - Medio
        return `${baseClasses} priority-medium`;
      case 4: // Comparador - Bajo
        return `${baseClasses} priority-low`;
      default:
        return baseClasses;
    }
  };

  return (
    <div
      className={`${getPriorityClasses()} scale-in h-full`}
      style={{ animationDelay: `${priority * 100}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleOpen}
      onKeyDown={handleKey}
      role="button"
      tabIndex={0}
      aria-label={`Acceder al módulo ${title}`}
    >
      {/* Efecto de brillo sutil */}
      <div className={`
        absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
        bg-gradient-to-r from-transparent via-white/5 to-transparent
        transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%]
      `} style={{ animation: 'shine 1.5s ease-in-out' }} />

      <Card
        module={variant as ModuleType}
        hover={false}
        className="h-full relative z-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm"
      >
        {/* Header del módulo */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`
              w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300
              ${isHovered ? 'scale-110' : 'scale-100'}
              ${priority === 1 ? 'bg-gradient-to-br from-red-500 to-red-600' :
                priority === 2 ? 'bg-gradient-to-br from-green-500 to-green-600' :
                priority === 3 ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                'bg-gradient-to-br from-orange-500 to-orange-600'}
            `}>
              <span className="text-white">
                {icon}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                {title}
              </h3>
              <div className={`
                px-2 py-1 rounded-full text-xs font-bold w-fit
                ${priority === 1 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                  priority === 2 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                  priority === 3 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'}
              `}>
                #{priority}
              </div>
            </div>
          </div>
        </div>

        {/* Descripción */}
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6 flex-grow text-sm">
          {desc}
        </p>

        {/* Descripción adicional */}
        <p className="text-xs text-slate-500 dark:text-slate-500 mb-6">
          {description}
        </p>

        {/* Botón de acción */}
        <Button
          module={variant as ModuleType}
          variant="primary"
          fullWidth
          className={`
            justify-center transition-all duration-300
            ${isHovered ? 'shadow-lg' : ''}
            ${priority === 1 ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' :
              priority === 2 ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' :
              priority === 3 ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800' :
              'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800'}
          `}
          onClick={(e) => { e.stopPropagation(); handleOpen(); }}
          aria-label={`Acceder al módulo ${title}`}
        >
          <span className="flex items-center gap-2">
            Acceder
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </Button>
      </Card>
    </div>
  );
};

const Home: React.FC = () => {
  const { userName, userEmail } = useAuth();

  // Módulos con priorización estratégica
  const modulesData: ModuleCardProps[] = [
    {
      to: "/devoluciones",
      title: "Devoluciones",
      desc: "Sistema integral para gestionar devoluciones de productos con seguimiento en tiempo real y análisis de causas raíz.",
      variant: "devoluciones",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>,
      priority: 1,
      description: "Resolución inmediata de problemas del cliente"
    },
    {
      to: "/inventario",
      title: "Inventario",
      desc: "Control preciso de existencias con actualizaciones en tiempo real y alertas automáticas de stock crítico.",
      variant: "inventario",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" /></svg>,
      priority: 2,
      description: "Base fundamental para todas las operaciones"
    },
    {
      to: "/pedido",
      title: "Pedidos",
      desc: "Creación eficiente de órdenes de compra con validación automática de stock y proveedores.",
      variant: "pedido",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      priority: 3,
      description: "Funcionalidad proactiva para requerimientos"
    },
    {
      to: "/comparador",
      title: "Comparador",
      desc: "Análisis comparativo de precios y proveedores para optimizar decisiones estratégicas de compra.",
      variant: "comparador",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
      priority: 4,
      description: "Herramienta analítica para decisiones estratégicas"
    },
  ];

  return (
    <div className="min-h-screen pt-20 pb-12 relative overflow-hidden">
      {/* Fondo interactivo */}
      <InteractiveBackground />

      {/* Contenido principal */}
      <div className="container-app relative z-10">

        {/* Header corporativo elegante */}
        <header className="text-center mb-12 fade-in">
          <div className="surface-card max-w-5xl mx-auto">
            {/* Ícono principal */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center justify-center shadow-xl">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>

            <h1 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-800 bg-clip-text text-transparent">
              Panel de Control
            </h1>

            {/* Información del usuario simplificada */}
            {userName && userEmail && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl backdrop-blur-sm border border-blue-200/50 dark:border-blue-800/50">
                <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
                  👋 Bienvenido, <span className="font-bold text-blue-600 dark:text-blue-400">{userName}</span>
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{userEmail}</p>
              </div>
            )}

            <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
              Sistema integral de gestión con módulos especializados para optimizar operaciones
            </p>
          </div>
        </header>

        {/* Navegación contextual simplificada */}
        <nav className="mb-8">
          <div className="flex flex-wrap justify-center gap-3">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full">
              Prioridad de Trabajo
            </span>
            {modulesData.map(module => (
              <div
                key={module.to}
                className={`
                  px-3 py-2 rounded-full text-xs font-medium
                  ${module.priority === 1 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                    module.priority === 2 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                    module.priority === 3 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'}
                `}
              >
                #{module.priority} {module.title}
              </div>
            ))}
          </div>
        </nav>

        {/* Grid de módulos con layout específico por dispositivo */}
        <section className="grid-prioritized">
          <div className="devoluciones-card">
            <OptimizedModuleCard {...modulesData[0]} />
          </div>
          <div className="pedidos-card">
            <OptimizedModuleCard {...modulesData[2]} />
          </div>
          <div className="inventario-card">
            <OptimizedModuleCard {...modulesData[1]} />
          </div>
          <div className="comparador-card">
            <OptimizedModuleCard {...modulesData[3]} />
          </div>
        </section>

        {/* Footer minimalista */}
        <footer className="text-center mt-16 pb-8">
          <div className="flex justify-center items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span>© 2024 Gestión 360</span>
            <span>•</span>
            <span>Sistema Corporativo</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Home;