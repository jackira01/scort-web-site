import ExcelJS from 'exceljs';
import { Response } from 'express';

export interface ExcelColumn {
    header: string;
    key: string;
    width?: number;
}

export const generateExcel = async (
    res: Response,
    sheetName: string,
    columns: ExcelColumn[],
    data: any[],
    fileName: string = 'Reporte.xlsx'
) => {
    try {
        // 1. Crear el libro y la hoja
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(sheetName);

        // 2. Definir columnas
        worksheet.columns = columns;

        // 3. Estilizar el encabezado
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' } // Gris claro
        };
        headerRow.commit();

        // 4. Añadir las filas
        // Si los datos son objetos complejos, asegúrate de que las keys coincidan o mapea antes de llamar a esta función
        data.forEach(item => {
            worksheet.addRow(item);
        });

        // 5. Configurar la respuesta para la descarga
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${fileName}"`
        );

        // 6. Escribir en el stream de respuesta
        await workbook.xlsx.write(res);
        res.status(200).end();

    } catch (error) {
        console.error("Error al generar Excel:", error);
        if (!res.headersSent) {
            res.status(500).send("Error al generar el archivo Excel");
        }
    }
};
