// --------------------------------------------------------------------------- #
//                                                                             #
//                               src/pages/Home.tsx                            #
//                                                                             #
// --------------------------------------------------------------------------- #

import React from "react";
import { Link } from "react-router-dom";
import { ModuleColor } from '../enums';
// Removed unused import: import InteractiveBackground from '../components/background/InteractiveBackground';

const Card: React.FC<{
  to: string;
  title: string;
  desc: string;
  variant:
    | "devoluciones"
    | "pedido"
    | "inventario"
    | "comparador"
    | "planificador";
}> = ({ to, title, desc, variant }) => {
  // Simplificación de clases dinámicas usando template literals.
  // Esto es más limpio y mantenible que las cadenas de ternarios.
  const titleClass = `title-${variant}`;
  const btnClass = `btn btn-module-${variant}`;
  const cardMod = `reel-card reel-card--${variant}`;

  const buttonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    transition: 'all 0.2s ease-in-out',
    padding: '0.5rem 1rem',
    color: '#ffffff',
    textDecoration: 'none', // to remove the underline
  };

  const variantColors = {
    devoluciones: ModuleColor.DEVOLUCIONES,
    pedido: ModuleColor.PEDIDO,
    inventario: ModuleColor.INVENTARIO,
    comparador: ModuleColor.COMPARADOR,
    planificador: ModuleColor.PLANIFICADOR,
  };

  buttonStyle.backgroundColor = variantColors[variant];


  return (
    <div className={`${cardMod} flex flex-col h-full`}>
      <h3 className={`reel-card__title ${titleClass} pt-2 pl-2`}>{title}</h3>
      <p className="reel-card__desc mb-5 flex-grow px-5 pt-2">{desc}</p>
      <div className="flex justify-center mt-1.5">
        <Link to={to} className={btnClass} style={buttonStyle} aria-label={`Ir a ${title}`}>
          Ir al módulo
        </Link>
      </div>
    </div>
  );
};

const Home: React.FC = () => {
  const items: {
    to: string;
    title: string;
    desc: string;
    variant: "devoluciones" | "pedido" | "inventario" | "comparador" | "planificador";
  }[] = [
    { to: "/devoluciones", title: "Devoluciones", desc: "Registra devoluciones de productos de forma rápida. Ideal para logística inversa y control de calidad.", variant: "devoluciones" },
    { to: "/pedido", title: "Pedidos", desc: "Crea y administra hojas de pedido con información de stock para optimizar requerimientos.", variant: "pedido" },
    { to: "/inventario", title: "Inventario", desc: "Realiza el conteo y actualización de existencias para mantener un inventario preciso.", variant: "inventario" },
    { to: "/comparador", title: "Comparador", desc: "Analiza precios de la competencia para optimizar tus decisiones de compra y venta.", variant: "comparador" },
    { to: "/planificador", title: "Planificador", desc: "Distribuye montos en el tiempo de forma equitativa con opción de ajuste manual.", variant: "planificador" },
  ];

  return (
    <div className="surface min-h-screen">
      <main>
        <section className="relative flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6">
          <div className="w-full max-w-6xl">
            {/* Header */}
            <header className="text-center mb-10 section-card">
              <h1 className="text-4xl md:text-5xl font-extrabold mb-3 heading">
                Panel de Control General
              </h1>
              <p className="text-base md:text-lg muted">
                Acceso rápido a todos los módulos de gestión de operaciones.
              </p>
            </header>

            {/* Contenedor de tarjetas con un grid más simétrico */}
            <section className="section-card relative">
              <div className="px-[clamp(12px,4vw,40px)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 justify-items-center">
                  {items.map((item) => (
                    <div key={item.to} className="self-stretch">
                      <div className="group rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_10px_20px_-10px_color-mix(in_oklab,var(--fg)_20%,transparent)] h-full">
                        <div className="rounded-2xl overflow-hidden ring-1 ring-[color-mix(in_oklab,_var(--border)_60%,_transparent)] group-hover:ring-[color-mix(in_oklab,_var(--fg)_14%,_transparent)] transition-colors duration-300 h-full">
                          <div className="relative h-full">
                            <div className="card-hover-glow pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />
                            <Card {...item} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;