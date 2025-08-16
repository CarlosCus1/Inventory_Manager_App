// --------------------------------------------------------------------------- #
//                                                                             #
//                               src/pages/Home.tsx                            #
//                                                                             #
// --------------------------------------------------------------------------- #

import React from "react";
import { Link } from "react-router-dom";


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
  const btnClass = `btn-module-${variant}`;
  const cardMod = `reel-card reel-card--${variant}`;

  return (
    <div className={`${cardMod} surface surface-border p-6 ring-1 ring-[var(--border)] flex flex-col h-full`}>
      <h3 className={`reel-card__title ${titleClass}`}>{title}</h3>
      <p className="reel-card__desc mb-5 flex-grow">{desc}</p>
      <div className="flex justify-center mt-1.5">
        <Link to={to} className={btnClass} aria-label={`Ir a ${title}`}>
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
          {/* Fondo radial decorativo */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 decorative-bg-radial">
            <div className="h-full w-full opacity-60 blur-3xl" />
          </div>

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
            <section className="section-card">
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