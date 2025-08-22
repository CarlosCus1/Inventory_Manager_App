import React from 'react';
import { ModuleButton } from '../ui/ModuleButton';

interface BackupOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadAndEdit: () => void;
  onCreateIdenticalCopy: () => void;
}

export const BackupOptionsModal: React.FC<BackupOptionsModalProps> = ({
  isOpen,
  onClose,
  onLoadAndEdit,
  onCreateIdenticalCopy,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm mx-auto dark:bg-gray-800">
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Opciones de Respaldo</h3>
        <div className="space-y-4">
          <ModuleButton // Use ModuleButton
            module="planificador" // Specify the module
            variant="contained" // Or "outlined" if preferred
            onClick={() => {
              onLoadAndEdit();
              onClose();
            }}
            className="w-full" // Keep w-full for full width
          >
            Cargar y Editar
          </ModuleButton>
          <ModuleButton // Use ModuleButton
            module="planificador" // Specify the module
            variant="contained" // Or "outlined" if preferred
            onClick={() => {
              onCreateIdenticalCopy();
              onClose();
            }}
            className="w-full" // Keep w-full for full width
          >
            Crear Copia Idéntica
          </ModuleButton>
          <ModuleButton // Use ModuleButton
            module="planificador" // Specify the module
            variant="outlined" // Use outlined for a secondary action
            onClick={onClose}
            className="w-full" // Keep w-full for full width
          >
            Cancelar
          </ModuleButton>
        </div>
      </div>
    </div>
  );
};