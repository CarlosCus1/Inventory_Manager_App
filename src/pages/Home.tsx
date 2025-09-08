// --------------------------------------------------------------------------- #
//                                                                             #
//                               src/pages/Home.tsx                            #
//                                                                             #
// --------------------------------------------------------------------------- #

import React from "react";
import { useNavigate } from "react-router-dom";
import { ModuleType } from '../enums';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const ModuleCard: React.FC<{
  to: string;
  title: string;
  desc: string;
  variant: "devoluciones" | "pedido" | "inventario" | "comparador";
  icon: React.ReactNode;
}> = ({ to, title, desc, variant, icon }) => {
  const navigate = useNavigate();

  const handleOpen = () => {
    if (to) navigate(to);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleOpen();
    }
  };

  return (
    <Card
      module={variant as ModuleType}
      hover
      role="link"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={handleKey}
      className={`module-card module-${variant} h-full flex flex-col cursor-pointer`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" 
             style={{ backgroundColor: `var(--module-surface)` }}>
          <span style={{ color: `var(--module-primary)` }}>
            {icon}
          </span>
        </div>
        <h3 className="module-card-title text-xl font-bold">
          {title}
        </h3>
      </div>
      
      <p className="module-card-description flex-grow">
        {desc}
      </p>
      
      <div className="mt-6">
        <Button 
          module={variant as ModuleType}
          variant="primary"
          fullWidth
          className="justify-center"
          onClick={(e) => { e.stopPropagation(); handleOpen(); }}
          aria-label={`Abrir ${title}`}
        >
          Ir al módulo
        </Button>
      </div>
    </Card>
  );
};

const Home: React.FC = () => {
  const { userName, userEmail } = useAuth();

  const items: {
    to: string;
    title: string;
    desc: string;
    variant: "devoluciones" | "pedido" | "inventario" | "comparador";
    icon: React.ReactNode;
  }[] = [
    { 
      to: "/devoluciones", 
      title: "Devoluciones", 
      desc: "Registra devoluciones de productos de forma rápida. Ideal para logística inversa y control de calidad.", 
      variant: "devoluciones",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
    },
    { 
      to: "/pedido", 
      title: "Pedidos", 
      desc: "Crea y administra hojas de pedido con información de stock para optimizar requerimientos.", 
      variant: "pedido",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    },
    { 
      to: "/inventario", 
      title: "Inventario", 
      desc: "Realiza el conteo y actualización de existencias para mantener un inventario preciso.", 
      variant: "inventario",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" /></svg>
    },
    { 
      to: "/comparador", 
      title: "Comparador", 
      desc: "Analiza precios de la competencia para optimizar tus decisiones de compra y venta.", 
      variant: "comparador",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
    },
  ];

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container-app">
        <header className="text-center mb-12 fade-in">
          <div className="surface-card max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
              Panel de Control General
            </h1>
            {userName && userEmail && (
              <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl">
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                  👋 Bienvenido, <span className="font-bold text-blue-600 dark:text-blue-400">{userName}</span>
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{userEmail}</p>
              </div>
            )}
            <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
              Acceso rápido a todos los módulos de gestión de operaciones.
            </p>
          </div>
        </header>

        

        <section className="grid-responsive">
          {items.map((item, index) => (
            <div 
              key={item.to} 
              className="scale-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <ModuleCard {...item} />
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default Home;