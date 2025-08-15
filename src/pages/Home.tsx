
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
    | "comparador";
}> = ({ to, title, desc, variant }) => {
  const titleClass =
    variant === "devoluciones"
      ? "title-devoluciones"
      : variant === "pedido"
      ? "title-pedido"
      : variant === "inventario"
      ? "title-inventario"
      : "title-comparador";

  const btnClass =
    variant === "devoluciones"
      ? "btn-module-devoluciones"
      : variant === "pedido"
      ? "btn-module-pedido"
      : variant === "inventario"
      ? "btn-module-inventario"
      : "btn-module-comparador";

  // Botón outline eliminado según nueva pauta (solo CTA principal)

  const cardMod =
    variant === "devoluciones"
      ? "reel-card reel-card--devoluciones"
      : variant === "pedido"
      ? "reel-card reel-card--pedido"
      : variant === "inventario"
      ? "reel-card reel-card--inventario"
      : "reel-card reel-card--comparador";

  return (
    <div className={`${cardMod} surface surface-border p-6 ring-1 ring-[var(--border)]`}>
      <h3 className={`reel-card__title ${titleClass}`}>{title}</h3>
      <p className="reel-card__desc mb-5">{desc}</p>
      <div className="flex justify-center mt-1.5">
        <Link to={to} className={btnClass} aria-label={`Ir a ${title}`}>
          Ir al módulo
        </Link>
      </div>
    </div>
  );
};

const Home: React.FC = () => {
  const items = [
    <Card key="dev" to="/devoluciones" title="Devoluciones" desc="Gestión de devoluciones por cliente." variant="devoluciones" />,
    <Card key="ped" to="/pedido" title="Pedido" desc="Ingreso y control de pedidos." variant="pedido" />,
    <Card key="inv" to="/inventario" title="Inventario" desc="Gestión de stock y movimientos." variant="inventario" />,
    <Card key="cmp" to="/comparador" title="Comparación" desc="Comparación de precios por marcas." variant="comparador" />,
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
                Gestor de Inventario
              </h1>
              <p className="text-base md:text-lg muted">
                Seleccione el módulo que desea utilizar
              </p>
            </header>

            {/* Móvil: lista vertical; Desktop: carrusel */}
            <section className="section-card">
              {/* Móvil: pila vertical con aire lateral y ancho máximo controlado */}
              <div className="md:hidden">
                <div className="flex flex-col gap-4 px-5">
                  {items.map((node, i) => (
                    <div key={`m-${i}`} className="mx-auto w-full max-w-[380px]">
                      {node}
                    </div>
                  ))}
                </div>
              </div>
              {/* Desktop: grid horizontal sin overflow/carrusel (muestra las 4 cards) */}
              <div className="hidden md:block">
                <div className="px-[clamp(12px,4vw,40px)]">
                  <div className="grid grid-cols-3 xl:grid-cols-4 gap-x-[clamp(12px,3vw,28px)] gap-y-6 justify-items-center">
                    {items.map((node, i) => (
                      <div key={`d-${i}`} className="w-full max-w-[320px] [transform-style:preserve-3d] will-change-transform card-bg-gradient">
                        <div className="group rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_10px_20px_-10px_color-mix(in_oklab,var(--fg)_20%,transparent)]">
                          <div
                            className="rounded-2xl overflow-hidden ring-1 ring-[color-mix(in_oklab,_var(--border)_60%,_transparent)] group-hover:ring-[color-mix(in_oklab,_var(--fg)_14%,_transparent)] transition-colors duration-300"
                          >
                            <div className="relative">
                              <div className="card-hover-glow pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />
                              {node}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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
