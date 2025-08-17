import { mostrarToast } from './uiUtils'; // Assuming uiUtils.ts is in src/utils

export class FileManager {
    static async loadJsonFile(file: File): Promise<unknown> {
        return new Promise((resolve, reject) => {
            if (!file) {
                return reject(new Error('No se seleccionó ningún archivo.'));
            }

            const reader = new FileReader();
            reader.onload = readerEvent => {
                try {
                    const content = readerEvent.target?.result;
                    if (typeof content === 'string') {
                        const data = JSON.parse(content);
                        resolve(data);
                    } else {
                        reject(new Error('Contenido del archivo no es una cadena de texto.'));
                    }
                } catch (error) {
                    mostrarToast('Error al leer o procesar el archivo JSON.', 'error');
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    }
}