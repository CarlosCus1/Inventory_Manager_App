// Data for global state store
export const mockStore = {
  moduleUsage: {
    devoluciones: 75,
    pedido: 90,
    inventario: 60,
    comparador: 45,
    planificador: 30
  } as const,
  incompleteTasks: 5,
  lastActivity: {
    devoluciones: new Date('2024-01-15T10:30:00'),
    pedido: new Date('2024-01-15T14:20:00'),
    inventario: new Date('2024-01-15T09:15:00'),
    comparador: new Date('2024-01-14T16:45:00'),
    planificador: new Date('2024-01-14T11:30:00')
  } as const
};

export const mockRootProps = {
  phoneNumber: '+1234567890',
  supportMessage: 'Hello, I need support with the Inventory Manager App.',
  moduleStats: [
    { name: 'Devoluciones', usage: 75, color: '#DC2626' },
    { name: 'Pedido', usage: 90, color: '#2563EB' },
    { name: 'Inventario', usage: 60, color: '#16A34A' },
    { name: 'Comparador', usage: 45, color: '#EA580C' },
    { name: 'Planificador', usage: 30, color: '#0EA5E9' }
  ]
};
