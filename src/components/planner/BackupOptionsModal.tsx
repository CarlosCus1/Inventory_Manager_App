import React, { useState } from 'react';

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
          <button
            onClick={() => {
              onLoadAndEdit();
              onClose();
            }}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            Cargar y Editar
          </button>
          <button
            onClick={() => {
              onCreateIdenticalCopy();
              onClose();
            }}
            className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:bg-green-700 dark:hover:bg-green-800"
          >
            Crear Copia Idéntica
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-300 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};