import { Order } from '../types';

export const printGeneralDailyReport = (dateString: string, dayOrders: Order[]) => {
  if (dayOrders.length === 0) return;

  const grandTotalOrders = dayOrders.length;
  const grandTotalFee = dayOrders.reduce((sum, o) => sum + parseFloat(o.feeValue || '0'), 0);

  // Group by Motoboy
  const groupedByMotoboy = dayOrders.reduce((acc, order) => {
    const name = order.motoboyName || 'Sem Motoboy';
    if (!acc[name]) acc[name] = { count: 0, totalFee: 0 };
    const feeValue = parseFloat(order.feeValue || '0');
    acc[name].count += 1;
    acc[name].totalFee += feeValue;
    return acc;
  }, {} as Record<string, { count: number; totalFee: number }>);

  // Group by Store
  const groupedByStore = dayOrders.reduce((acc, order) => {
    const store = order.storeName || 'Sem Loja';
    if (!acc[store]) acc[store] = { count: 0, totalFee: 0 };
    const feeValue = parseFloat(order.feeValue || '0');
    acc[store].count += 1;
    acc[store].totalFee += feeValue;
    return acc;
  }, {} as Record<string, { count: number; totalFee: number }>);

  const motoboysHtml = Object.keys(groupedByMotoboy).sort().map(name => {
    const data = groupedByMotoboy[name];
    return `
      <div class="order-item">
        <span><strong>${name}</strong> (${data.count} ${data.count === 1 ? 'pedido' : 'pedidos'})</span>
        <span style="font-weight: bold; color: #1e3a8a;">R$ ${data.totalFee.toFixed(2).replace('.', ',')}</span>
      </div>
    `;
  }).join('');

  const storesHtml = Object.keys(groupedByStore).sort().map(store => {
    const data = groupedByStore[store];
    return `
      <div class="order-item">
        <span><strong>${store}</strong> (${data.count} ${data.count === 1 ? 'pedido' : 'pedidos'})</span>
        <span style="font-weight: bold; color: #16a34a;">R$ ${data.totalFee.toFixed(2).replace('.', ',')}</span>
      </div>
    `;
  }).join('');

  const now = new Date();
  const datePrinted = now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const htmlContent = `
    <div class="report-header">
      <div class="report-title" style="color: #1e293b; font-size: 26px;">CIA DO CHOPP</div>
      <div style="font-size: 18px; font-weight: bold; margin-top: 5px; color: #b45309;">Relatório Geral de Fechamento do Dia</div>
      <div class="report-subtitle">Dia de Fechamento: <strong>${dateString}</strong> | Impresso em: ${datePrinted}</div>
    </div>
    <div style="border-bottom: 3px double #000; padding-bottom: 5px; margin-bottom: 15px;"></div>
    
    <div style="margin-bottom: 25px;">
      <h3 style="font-size: 18px; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 10px; color: #1e3a8a;">Resumo por Motoboy</h3>
      ${motoboysHtml}
    </div>

    <div style="margin-bottom: 25px;">
      <h3 style="font-size: 18px; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 10px; color: #16a34a;">Resumo por Loja</h3>
      ${storesHtml}
    </div>

    <div style="border-top: 2px solid #000; padding-top: 10px; margin-top: 20px;">
      <div class="total-line" style="border-top: none; margin-top: 0; font-size: 20px;">
        <span>TOTAL GERAL DE PEDIDOS:</span>
        <span>${grandTotalOrders}</span>
      </div>
      <div class="total-line" style="border-top: none; margin-top: 0; font-size: 22px; color: #15803d;">
        <span>VALOR TOTAL DE TAXAS DO DIA:</span>
        <span>R$ ${grandTotalFee.toFixed(2).replace('.', ',')}</span>
      </div>
    </div>
  `;

  // General print helper
  const printWindow = window.open('', '_blank', 'height=600,width=800');
  if (!printWindow) {
    alert('Falha ao abrir janela de impressão. Verifique se o bloqueador de pop-ups está ativo.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8" />
      <title>Fechamento do Dia - ${dateString}</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; margin: 25px; color: #111; }
        .report-header { text-align: center; margin-bottom: 20px; }
        .report-title { font-size: 24px; font-weight: bold; }
        .report-subtitle { font-size: 14px; margin-bottom: 15px; color: #666; }
        .order-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ccc; font-size: 14px; }
        .total-line { display: flex; justify-content: space-between; padding: 10px 0; font-weight: bold; }
        .total-footer { text-align: center; margin-top: 50px; }
        .signature-line { border-top: 1px solid #000; width: 40%; margin: 0 auto; padding-top: 6px; font-size: 12px; font-weight: bold; display: inline-block; }
      </style>
    </head>
    <body>
      ${htmlContent}
      <div class="total-footer" style="display: flex; justify-content: space-around; margin-top: 80px;">
        <div style="text-align: center; width: 45%;">
          <p class="signature-line">Assinatura do Gerente</p>
        </div>
        <div style="text-align: center; width: 45%;">
          <p class="signature-line">Data e Hora de Fechamento</p>
        </div>
      </div>
    </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 400);
};

const printHtmlContent = (title: string, htmlContent: string) => {
  const printWindow = window.open('', '_blank', 'height=600,width=800');
  if (!printWindow) {
    alert('Falha ao abrir janela de impressão. Verifique se o bloqueador de pop-ups está ativo.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8" />
      <title>${title}</title>
      <style>
        @media print {
          body { font-family: system-ui, -apple-system, sans-serif; margin: 20px; color: #000; }
          .report-header { text-align: center; margin-bottom: 20px; }
          .report-title { font-size: 24px; font-weight: bold; }
          .report-subtitle { font-size: 14px; margin-bottom: 15px; color: #555; }
          .order-item, .store-summary { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #ccc; }
          .order-item:last-child, .store-summary:last-child { border-bottom: none; }
          .total-line { display: flex; justify-content: space-between; padding: 10px 0; border-top: 2px solid #000; font-weight: bold; margin-top: 10px; font-size: 18px; }
          .total-footer { text-align: center; margin-top: 60px; }
          .signature-line { border-top: 1px solid #000; width: 60%; margin: 0 auto; padding-top: 6px; font-size: 13px; font-weight: bold; }
        }
        body { font-family: system-ui, -apple-system, sans-serif; margin: 20px; color: #111; }
        .report-header { text-align: center; margin-bottom: 20px; }
        .report-title { font-size: 24px; font-weight: bold; color: #1e3a8a; }
        .report-subtitle { font-size: 14px; margin-bottom: 15px; color: #666; }
        .order-item, .store-summary { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #ccc; }
        .total-line { display: flex; justify-content: space-between; padding: 10px 0; border-top: 2px solid #000; font-weight: bold; margin-top: 10px; font-size: 18px; }
        .total-footer { text-align: center; margin-top: 60px; }
        .signature-line { border-top: 1px solid #000; width: 60%; margin: 0 auto; padding-top: 6px; font-size: 13px; font-weight: bold; }
      </style>
    </head>
    <body>
      ${htmlContent}
      <div class="total-footer">
        <p class="signature-line">Assinatura do Motoboy: ${title.split(' - ')[1] || ''}</p>
      </div>
    </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
  }, 400);
};

export const printDeliveryReport = (motoboyName: string, motoboyOrders: Order[]) => {
  if (motoboyOrders.length === 0) return;

  const sortedOrders = [...motoboyOrders].sort((a, b) => b.timestamp - a.timestamp);
  let totalFee = 0;

  const ordersHtml = sortedOrders.map(order => {
    const feeValue = parseFloat(order.feeValue || '0');
    totalFee += feeValue;
    const feeFormatted = feeValue.toFixed(2).replace('.', ',');
    const storeInfo = order.storeName ? ` (${order.storeName})` : '';

    return `
      <div class="order-item">
        <span style="font-size: 16px;">Pedido: <strong>${order.orderNumber}</strong>${storeInfo}</span>
        <span style="font-size: 16px; font-weight: bold; color: #15803d;">R$ ${feeFormatted}</span>
      </div>
    `;
  }).join('');

  const now = new Date();
  const datePrinted = now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const htmlContent = `
    <div class="report-header">
      <div class="report-title">Relatório de Entregas</div>
      <div style="font-size: 18px; font-weight: bold; margin-top: 5px; color: #4338ca;">Motoboy: ${motoboyName}</div>
      <div class="report-subtitle">Data de Impressão: ${datePrinted}</div>
    </div>
    <div style="border-bottom: 2px solid #000; padding-bottom: 5px;"></div>
    <div style="margin-top: 15px;">
      ${ordersHtml}
    </div>
    <div class="total-line">
      <span>Total de Taxas (${sortedOrders.length} pedidos):</span>
      <span style="color: #15803d;">R$ ${totalFee.toFixed(2).replace('.', ',')}</span>
    </div>
  `;

  printHtmlContent(`Relatório de Entregas - ${motoboyName}`, htmlContent);
};

export const printStoreTotalsReport = (motoboyName: string, motoboyOrders: Order[]) => {
  if (motoboyOrders.length === 0) return;

  let grandTotalFee = 0;
  const grandTotalOrders = motoboyOrders.length;

  const groupedByStore = motoboyOrders.reduce((acc, order) => {
    const storeName = order.storeName || 'Loja Desconhecida';
    if (!acc[storeName]) {
      acc[storeName] = { count: 0, totalFee: 0 };
    }
    const feeValue = parseFloat(order.feeValue || '0');
    acc[storeName].count += 1;
    acc[storeName].totalFee += feeValue;
    grandTotalFee += feeValue;
    return acc;
  }, {} as Record<string, { count: number; totalFee: number }>);

  const storesHtml = Object.keys(groupedByStore).sort().map(storeName => {
    const data = groupedByStore[storeName];
    const totalFeeFormatted = data.totalFee.toFixed(2).replace('.', ',');

    return `
      <div style="border: 1px solid #e5e7eb; padding: 12px; margin-bottom: 12px; border-radius: 8px; background-color: #f9fafb;">
        <h4 style="font-size: 18px; font-weight: bold; margin-top:0; margin-bottom: 8px; color: #1e40af;">${storeName}</h4>
        <div class="store-summary">
          <span>Total de Pedidos:</span>
          <strong>${data.count}</strong>
        </div>
        <div class="store-summary">
          <span>Total de Taxas:</span>
          <strong style="color: #15803d;">R$ ${totalFeeFormatted}</strong>
        </div>
      </div>
    `;
  }).join('');

  const now = new Date();
  const datePrinted = now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const htmlContent = `
    <div class="report-header">
      <div class="report-title">Relatório de Totais por Loja</div>
      <div style="font-size: 18px; font-weight: bold; margin-top: 5px; color: #4338ca;">Motoboy: ${motoboyName}</div>
      <div class="report-subtitle">Data de Impressão: ${datePrinted}</div>
    </div>
    <div style="margin-top: 20px;">
      ${storesHtml}
    </div>
    <div class="total-line" style="margin-top: 20px;">
      <span>Total Geral de Pedidos:</span>
      <span>${grandTotalOrders}</span>
    </div>
    <div class="total-line">
      <span>Total Geral de Taxas:</span>
      <span style="color: #15803d;">R$ ${grandTotalFee.toFixed(2).replace('.', ',')}</span>
    </div>
  `;

  printHtmlContent(`Relatório por Loja - ${motoboyName}`, htmlContent);
};
