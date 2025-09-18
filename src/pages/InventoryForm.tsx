import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { InputQty } from '../components/ui/InputQty';
import { getRulesFromSchema } from '../utils/rhfSchemaUtils';

// Mock schema import - in a real app, you'd load this dynamically or import a generated type
const mockInventarioSchema = {
  properties: {
    cantidad: {
      type: "number",
      exclusiveMinimum: 0,
      errorMessage: "La cantidad debe ser mayor a 0",
      default: 0.01
    },
    cantidad_por_caja: {
      type: "number",
      minimum: 1,
      errorMessage: "Unidades por caja no puede ser menor a 1",
      default: 1
    }
  }
};

interface InventoryFormData {
  cantidad: number;
  cantidad_por_caja: number;
}

const InventoryForm: React.FC = () => {
  const { handleSubmit, control, formState: { errors } } = useForm<InventoryFormData>({
    defaultValues: {
      cantidad: mockInventarioSchema.properties.cantidad.default,
      cantidad_por_caja: mockInventarioSchema.properties.cantidad_por_caja.default,
    }
  });

  const onSubmit = (data: InventoryFormData) => {
    console.log("Form Data:", data);
    alert(`Cantidad: ${data.cantidad}, Unidades por caja: ${data.cantidad_por_caja}`);
  };

  const cantidadRules = getRulesFromSchema(mockInventarioSchema.properties.cantidad, true);
  const uPorCajaRules = getRulesFromSchema(mockInventarioSchema.properties.cantidad_por_caja, true);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
      <div>
        <label htmlFor="cantidad" className="block text-sm font-medium text-gray-700">Cantidad</label>
        <Controller
          name="cantidad"
          control={control}
          rules={cantidadRules as any}
          render={({ field }) => (
            <InputQty
              id="cantidad"
              schema={mockInventarioSchema.properties.cantidad}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={field.value}
              onValueChange={field.onChange}
              ref={field.ref}
              onBlur={field.onBlur}
              name={field.name}
            />
          )}
        />
        {errors.cantidad && <p className="mt-2 text-sm text-red-600">{errors.cantidad.message}</p>}
      </div>

      <div>
        <label htmlFor="cantidad_por_caja" className="block text-sm font-medium text-gray-700">Unidades por Caja</label>
        <Controller
          name="cantidad_por_caja"
          control={control}
          rules={uPorCajaRules as any}
          render={({ field }) => (
            <InputQty
              id="cantidad_por_caja"
              schema={mockInventarioSchema.properties.cantidad_por_caja}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={field.value}
              onValueChange={field.onChange}
              ref={field.ref}
              onBlur={field.onBlur}
              name={field.name}
            />
          )}
        />
        {errors.cantidad_por_caja && <p className="mt-2 text-sm text-red-600">{errors.cantidad_por_caja.message}</p>}
      </div>

      <button
        type="submit"
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Submit
      </button>
    </form>
  );
};

export default InventoryForm;
