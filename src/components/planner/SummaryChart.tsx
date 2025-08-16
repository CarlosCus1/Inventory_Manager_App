import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import type { TooltipItem } from 'chart.js';
import { COLOR_PALETTES } from '../../utils/config'; // Assuming config is moved here

// Register all necessary components for Chart.js
Chart.register(...registerables);

interface SummaryChartProps {
  resumenMensual: Record<string, number>;
  montoTotalGeneral: number;
  linea: string;
}

export const SummaryChart: React.FC<SummaryChartProps> = ({ resumenMensual, montoTotalGeneral, linea }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  const _getPalette = (linea: string) => {
    const key = (linea || 'otros').toLowerCase() as keyof typeof COLOR_PALETTES;
    return COLOR_PALETTES[key] || COLOR_PALETTES.otros;
  };

  useEffect(() => {
    if (!chartRef.current || !resumenMensual) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Destroy previous chart instance if it exists
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const labels = Object.keys(resumenMensual).sort();
    const data = labels.map(label => resumenMensual[label]);
    const palette = _getPalette(linea);

    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: `Monto por Mes (S/)`,
          data: data,
          backgroundColor: palette.background,
          borderColor: palette.border,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--fg'), // Use --fg for tick color
              callback: function(value: string | number) {
                if (typeof value === 'number') {
                  return 'S/ ' + value.toLocaleString('es-PE');
                }
                return value;
              }
            },
            title: {
              display: true,
              text: 'Monto (S/)',
              color: getComputedStyle(document.documentElement).getPropertyValue('--heading') // Use --heading for title color
            }
          },
          x: {
            ticks: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--fg'), // Use --fg for tick color
            },
            title: {
              display: true,
              text: 'Mes',
              color: getComputedStyle(document.documentElement).getPropertyValue('--heading') // Use --heading for title color
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--fg'), // Use --fg for tooltip body
            titleColor: getComputedStyle(document.documentElement).getPropertyValue('--heading'), // Use --heading for tooltip title
            callbacks: {
              label: function(context: TooltipItem<'bar'>) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  const montoMes = context.parsed.y;
                  const porcentaje = montoTotalGeneral > 0 ? ((montoMes / montoTotalGeneral) * 100).toFixed(2) : 0;
                  label += `S/ ${montoMes.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${porcentaje}%)`;
                }
                return label;
              }
            }
          }
        }
      }
    });

    // Cleanup function to destroy the chart on component unmount
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [resumenMensual, montoTotalGeneral, linea]);

  return <canvas ref={chartRef}></canvas>;
};
