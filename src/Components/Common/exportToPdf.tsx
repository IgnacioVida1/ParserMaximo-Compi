import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportToPDFProps {
    tableRef: React.RefObject<HTMLDivElement | null>;
    title: string;
    parserType: string;
    grammar?: string;
    inputString?: string;
}

export function ExportToPDF({ tableRef, title, parserType, grammar, inputString }: ExportToPDFProps) {
    const [isExporting, setIsExporting] = useState(false);

    const decodeHtml = (text: string): string => {
        if (!text) return '';
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        return textarea.value;
    };

    const cleanText = (text: string): string => {
        if (!text) return '';
        return decodeHtml(text)
            .replace(/&rarr;/g, '→')
            .replace(/&epsilon;/g, 'ε')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\$/g, 'EOF')
            .trimEnd();
    };

    const buildExportContainer = (tableClone: HTMLElement) => {
        const container = document.createElement('div');
        container.style.backgroundColor = '#ffffff';
        container.style.color = '#111827';
        container.style.fontFamily = 'Arial, Helvetica, sans-serif';
        container.style.padding = '24px 28px 28px';
        container.style.width = '1200px';
        container.style.boxSizing = 'border-box';

        const titleEl = document.createElement('div');
        titleEl.textContent = title;
        titleEl.style.fontSize = '22px';
        titleEl.style.fontWeight = '700';
        titleEl.style.textAlign = 'center';
        titleEl.style.marginBottom = '16px';
        container.appendChild(titleEl);

        const meta = document.createElement('div');
        meta.style.display = 'grid';
        meta.style.gridTemplateColumns = '160px 1fr';
        meta.style.rowGap = '6px';
        meta.style.columnGap = '10px';
        meta.style.fontSize = '12px';
        meta.style.color = '#374151';

        const addMetaRow = (label: string, value: string) => {
            const labelEl = document.createElement('div');
            labelEl.textContent = label;
            labelEl.style.fontWeight = '600';

            const valueEl = document.createElement('div');
            valueEl.textContent = value;
            valueEl.style.whiteSpace = 'pre-wrap';

            meta.appendChild(labelEl);
            meta.appendChild(valueEl);
        };

        addMetaRow('Tipo de parser:', parserType);
        addMetaRow('Fecha:', new Date().toLocaleString());

        if (grammar) {
            addMetaRow('Gramatica:', '');
            const grammarBlock = document.createElement('div');
            grammarBlock.style.gridColumn = '1 / -1';
            grammarBlock.style.backgroundColor = '#f8fafc';
            grammarBlock.style.border = '1px solid #e5e7eb';
            grammarBlock.style.borderRadius = '6px';
            grammarBlock.style.padding = '10px 12px';
            grammarBlock.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
            grammarBlock.style.fontSize = '11px';
            grammarBlock.style.whiteSpace = 'pre-wrap';
            grammarBlock.textContent = cleanText(grammar);
            meta.appendChild(grammarBlock);
        }

        if (inputString) {
            addMetaRow('Cadena de entrada:', cleanText(inputString));
        }

        meta.style.marginBottom = '18px';
        container.appendChild(meta);

        const tableWrapper = document.createElement('div');
        tableWrapper.style.border = '1px solid #e5e7eb';
        tableWrapper.style.borderRadius = '8px';
        tableWrapper.style.padding = '12px';
        tableWrapper.style.backgroundColor = '#ffffff';
        tableWrapper.appendChild(tableClone);

        container.appendChild(tableWrapper);
        return container;
    };

    const exportToPDF = async () => {
        if (!tableRef.current) return;
        
        setIsExporting(true);
        
        try {
            const originalElement = tableRef.current;
            const cloneElement = originalElement.cloneNode(true) as HTMLElement;

            const cleanTableText = (element: HTMLElement) => {
                const cells = element.querySelectorAll('th, td');
                cells.forEach(cell => {
                    const originalText = cell.textContent || '';
                    cell.textContent = cleanText(originalText);
                });
            };

            cleanTableText(cloneElement);

            const tables = cloneElement.querySelectorAll('table');
            tables.forEach(table => {
                table.style.backgroundColor = '#ffffff';
                table.style.borderCollapse = 'collapse';
                table.style.width = '100%';
                table.style.minWidth = '900px';
                table.style.fontSize = '10px';
                table.style.marginBottom = '12px';

                const cells = table.querySelectorAll('th, td');
                cells.forEach(cell => {
                    (cell as HTMLElement).style.border = '1px solid #d1d5db';
                    (cell as HTMLElement).style.padding = '6px 8px';
                    (cell as HTMLElement).style.textAlign = 'left';
                    (cell as HTMLElement).style.backgroundColor = '#ffffff';
                    (cell as HTMLElement).style.color = '#111827';
                    (cell as HTMLElement).style.fontSize = '9px';
                    (cell as HTMLElement).style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
                });

                const headers = table.querySelectorAll('th');
                headers.forEach(header => {
                    (header as HTMLElement).style.backgroundColor = '#eef2ff';
                    (header as HTMLElement).style.fontWeight = '700';
                    (header as HTMLElement).style.color = '#111827';
                    (header as HTMLElement).style.fontSize = '10px';
                });
            });

            const headings = cloneElement.querySelectorAll('h3');
            headings.forEach(heading => {
                (heading as HTMLElement).style.fontSize = '13px';
                (heading as HTMLElement).style.fontWeight = '700';
                (heading as HTMLElement).style.color = '#111827';
                (heading as HTMLElement).style.margin = '6px 0 8px';
            });

            const exportContainer = buildExportContainer(cloneElement);
            exportContainer.style.position = 'absolute';
            exportContainer.style.top = '-9999px';
            exportContainer.style.left = '-9999px';
            document.body.appendChild(exportContainer);

            const canvas = await html2canvas(exportContainer, {
                scale: 2.5,
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: true,
                windowWidth: exportContainer.scrollWidth,
                windowHeight: exportContainer.scrollHeight
            });

            document.body.removeChild(exportContainer);

            const imgData = canvas.toDataURL('image/png');

            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const margin = 8;
            const imgWidth = pdfWidth - margin * 2;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            const pageHeight = pdfHeight - margin * 2;

            let position = 0;
            while (position < imgHeight) {
                pdf.addImage(imgData, 'PNG', margin, margin - position, imgWidth, imgHeight);
                position += pageHeight;
                if (position < imgHeight) {
                    pdf.addPage();
                }
            }

            pdf.save(`${title.toLowerCase().replace(/\s/g, '_')}_${parserType}.pdf`);
            
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Error al generar el PDF. Intenta de nuevo.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <button
            onClick={exportToPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white"
            title="Exportar a PDF"
        >
            {isExporting ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Exportando...
                </>
            ) : (
                <>
                    <FileText className="w-4 h-4" />
                    Exportar PDF
                </>
            )}
        </button>
    );
}