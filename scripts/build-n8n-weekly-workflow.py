#!/usr/bin/env python3
"""Build the Zona T weekly-report n8n workflow JSON."""

from __future__ import annotations

import json
from copy import deepcopy

SHEETS_CRED = {
    "googleSheetsOAuth2Api": {
        "id": "99mAfhYclFMJBbRj",
        "name": "Google Sheets account 2",
    }
}
GMAIL_CRED = {
    "gmailOAuth2": {
        "id": "bTQf0C8LaFF3bL8t",
        "name": "Gmail account 2",
    }
}

PLACEHOLDER_SECRET = "YOUR_CRON_SECRET"


def rl_id(expr: str) -> dict:
    return {"__rl": True, "mode": "id", "value": expr}


def rl_name(name: str) -> dict:
    return {"__rl": True, "mode": "name", "value": name}


def sheets_append(node_id: str, name: str, sheet_title: str, position: list[int]) -> dict:
    return {
        "parameters": {
            "operation": "append",
            "documentId": rl_id("={{ $('Crear spreadsheet').first().json.spreadsheetId }}"),
            "sheetName": rl_name(sheet_title),
            "columns": {
                "mappingMode": "autoMapInputData",
                "value": {},
                "matchingColumns": [],
                "schema": [],
                "attemptToConvertTypes": False,
                "convertFieldsToString": False,
            },
            "options": {
                "handlingExtraData": "insertInNewColumn",
                "useAppend": True,
            },
        },
        "id": node_id,
        "name": name,
        "type": "n8n-nodes-base.googleSheets",
        "typeVersion": 4.7,
        "position": position,
        "credentials": deepcopy(SHEETS_CRED),
        "retryOnFail": True,
        "maxTries": 3,
        "waitBetweenTries": 4000,
    }


def code_node(node_id: str, name: str, js: str, position: list[int]) -> dict:
    return {
        "parameters": {"jsCode": js},
        "id": node_id,
        "name": name,
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": position,
    }


HTTP_HEADERS = {
    "parameters": [{"name": "Authorization", "value": f"Bearer {PLACEHOLDER_SECRET}"}]
}

CODE_RESUMEN = r"""
const src = $('Pedir datos a Zonat').first().json;
const sales = src.sales || {};
const credits = src.credits || {};
const rows = [
  { Campo: 'Tienda', Valor: src.storeName || '' },
  { Campo: 'Periodo', Valor: src.periodLabel || '' },
  { Campo: 'Corte', Valor: 'Domingo 6:00 p.m. Colombia' },
  { Campo: 'Generado', Valor: src.generatedAt || '' },
  { Campo: 'Ventas (facturas)', Valor: sales.count || 0 },
  { Campo: 'Unidades vendidas', Valor: sales.units || 0 },
  { Campo: 'Ingresos (efectivo + transferencia + abonos)', Valor: sales.total || 0 },
  { Campo: 'Efectivo', Valor: sales.cash || 0 },
  { Campo: 'Transferencia', Valor: sales.transfer || 0 },
  { Campo: 'Abonos a créditos', Valor: sales.abonos || 0 },
  { Campo: 'Ventas a crédito (esta semana)', Valor: sales.credit || 0 },
  { Campo: 'Créditos nuevos', Valor: credits.issuedCount || 0 },
  { Campo: 'Monto créditos nuevos', Valor: credits.issuedAmount || 0 },
  { Campo: 'Clientes en mora', Valor: credits.overdueCount || 0 },
  { Campo: 'Saldo en mora', Valor: credits.overdueTotal || 0 },
  { Campo: 'Clientes al día (con saldo)', Valor: credits.currentCount || 0 },
  { Campo: 'Saldo al día', Valor: credits.currentTotal || 0 },
];
return rows.map((json) => ({ json }));
""".strip()

CODE_VENTAS = r"""
const rows = $('Pedir datos a Zonat').first().json.salesRows || [];
if (!rows.length) return [{ json: { Factura: 'Sin ventas en el periodo' } }];
return rows.map((row) => ({
  json: {
    Factura: row.invoiceNumber,
    Fecha: row.date,
    Cliente: row.clientName,
    Vendedor: row.sellerName,
    Pago: row.paymentMethod,
    Productos: row.itemsCount,
    Unidades: row.units,
    Total: row.total,
    Efectivo: row.cash,
    Transferencia: row.transfer,
  },
}));
""".strip()

CODE_PRODUCTOS = r"""
const rows = $('Pedir datos a Zonat').first().json.productRows || [];
if (!rows.length) return [{ json: { Producto: 'Sin productos vendidos en el periodo' } }];
return rows.map((row) => ({
  json: {
    Factura: row.invoiceNumber,
    Fecha: row.date,
    Producto: row.productName,
    Cantidad: row.quantity,
    'Precio unitario': row.unitPrice,
    Total: row.total,
    Vendedor: row.sellerName,
  },
}));
""".strip()

CODE_CREDITOS = r"""
const rows = $('Pedir datos a Zonat').first().json.creditRows || [];
if (!rows.length) return [{ json: { Factura: 'Sin créditos nuevos esta semana' } }];
return rows.map((row) => ({
  json: {
    Factura: row.invoiceNumber,
    Fecha: row.date,
    Cliente: row.clientName,
    Total: row.totalAmount,
    Pagado: row.paidAmount,
    Pendiente: row.pendingAmount,
    Estado: row.status,
    Vence: row.dueDate,
    'Días mora': row.daysOverdue,
  },
}));
""".strip()

CODE_MOROSOS = r"""
const rows = $('Pedir datos a Zonat').first().json.overdueRows || [];
if (!rows.length) return [{ json: { Cliente: 'No hay clientes en mora' } }];
return rows.map((row) => ({
  json: {
    Factura: row.invoiceNumber,
    Cliente: row.clientName,
    Total: row.totalAmount,
    Pagado: row.paidAmount,
    Pendiente: row.pendingAmount,
    Estado: row.status,
    Vence: row.dueDate,
    'Días mora': row.daysOverdue,
  },
}));
""".strip()

CODE_AL_DIA = r"""
const rows = $('Pedir datos a Zonat').first().json.currentRows || [];
if (!rows.length) return [{ json: { Cliente: 'No hay créditos al día con saldo' } }];
return rows.map((row) => ({
  json: {
    Factura: row.invoiceNumber,
    Cliente: row.clientName,
    Total: row.totalAmount,
    Pagado: row.paidAmount,
    Pendiente: row.pendingAmount,
    Estado: row.status,
    Vence: row.dueDate,
  },
}));
""".strip()

CODE_ARMAR = r"""
const src = $('Pedir datos a Zonat').first().json;
const sheet = $('Crear spreadsheet').first().json;
const input = $input.first();
const to = 'andrewjruss7@gmail.com';
const url = sheet.spreadsheetUrl || '';
const logoUrl = 'https://www.zonat.com.co/logo-zonat-gold.jpeg';
const logoBlock = `<table cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;"><tr><td width="72" height="72" style="width:72px;height:72px;border-radius:50%;overflow:hidden;background:#18181b;"><img src="${logoUrl}" alt="Zona T" width="72" height="72" style="display:block;width:72px;height:72px;border:0;border-radius:50%;object-fit:cover;-ms-interpolation-mode:bicubic;" /></td></tr></table>`;
const extra = url
  ? `<p style="margin:14px 0 0;font-size:13px;"><a href="${url}">Abrir reporte en Google Sheets</a></p>`
  : '';
let html = String(src.html || 'Reporte semanal Zona T');
// Always force round avatar logo in the outgoing Gmail body.
html = html.replace(
  /<img[^>]*logo-zonat-gold\.jpeg[^>]*>/i,
  `<img src="${logoUrl}" alt="Zona T" width="72" height="72" style="display:block;width:72px;height:72px;border:0;border-radius:50%;object-fit:cover;-ms-interpolation-mode:bicubic;" />`
);
if (!html.includes('logo-zonat-gold.jpeg') && !html.includes('zonat-logo.png')) {
  if (html.includes('color:#65a30d;">Zona T</div>')) {
    html = html.replace(
      /<div style="font-size:11px;font-weight:700;letter-spacing:0\.08em;text-transform:uppercase;color:#65a30d;">Zona T<\/div>\s*<h1/,
      `${logoBlock}<h1`
    );
  } else if (html.includes('<h1 style="margin:14px 0 0;font-size:22px;') || html.includes('<h1 style="margin:6px 0 0;font-size:22px;')) {
    html = html.replace(
      /<h1 style="margin:(?:14|6)px 0 0;font-size:22px;/,
      `${logoBlock}<h1 style="margin:14px 0 0;font-size:22px;`
    );
  } else if (html.includes('<body')) {
    html = html.replace(/<body[^>]*>/, (m) => `${m}${logoBlock}`);
  }
} else if (!html.includes('border-radius:50%')) {
  // If production HTML already has the logo but not round, wrap the first logo img.
  html = html.replace(
    /(<img[^>]*logo-zonat-gold\.jpeg[^>]*>)/i,
    `<table cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;"><tr><td width="72" height="72" style="width:72px;height:72px;border-radius:50%;overflow:hidden;background:#18181b;">$1</td></tr></table>`
  );
}
html = html.includes('</td>')
  ? html.replace(
      'Adjunto: Excel con ventas, productos, créditos de la semana, morosos y al día.',
      'Adjunto: Excel con ventas, productos, créditos de la semana, morosos y al día. También quedó una copia en Google Sheets.'
    )
  : html;
if (extra) {
  html = html.includes('</body>') ? html.replace('</body>', `${extra}</body>`) : html + extra;
}
const binary = input.binary ? { ...input.binary } : {};
if (binary.data) {
  binary.data = {
    ...binary.data,
    fileName: (src.excel && src.excel.filename) || binary.data.fileName || 'zonat-reporte.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
}
return [{
  json: {
    to,
    subject: src.subject || `Zona T · Ventas y créditos ${src.periodLabel || ''}`.trim(),
    html,
    spreadsheetUrl: url,
    spreadsheetId: sheet.spreadsheetId,
    periodLabel: src.periodLabel,
    excel: src.excel,
  },
  binary,
}];
""".strip()

CODE_LISTO = r"""
const mail = $input.first().json;
const sheet = $('Crear spreadsheet').first().json;
const src = $('Pedir datos a Zonat').first().json;
return [{
  json: {
    ok: true,
    gmailId: mail.id || mail.messageId || '',
    to: $('Armar correo').first().json.to,
    spreadsheetUrl: sheet.spreadsheetUrl,
    periodLabel: src.periodLabel,
    sales: src.sales,
    credits: src.credits,
  },
}];
""".strip()


def build() -> dict:
    nodes = [
        {
            "parameters": {
                "content": "## Reporte semanal Zona T\n\n1. Pide ventas y créditos a Zonat\n2. Crea un Google Sheet (Resumen, Ventas, Productos, Créditos, Morosos, Al día)\n3. Descarga el Excel\n4. Lo envía por Gmail a andrewjruss7@gmail.com (Excel). Diego recibe otro correo HTML, sin Excel, por Vercel.\n\nUsa **Probar ahora** para mandar un reporte de prueba.\nEl cron corre **domingo 17:05** (Colombia).\n\nActiva el workflow cuando el test salga bien.",
                "height": 300,
                "width": 380,
                "color": 7,
            },
            "id": "note-setup",
            "name": "Cómo funciona",
            "type": "n8n-nodes-base.stickyNote",
            "typeVersion": 1,
            "position": [40, 40],
        },
        {
            "parameters": {},
            "id": "manual-test",
            "name": "Probar ahora",
            "type": "n8n-nodes-base.manualTrigger",
            "typeVersion": 1,
            "position": [480, 80],
        },
        {
            "parameters": {
                "rule": {
                    "interval": [
                        {"field": "cronExpression", "expression": "5 17 * * 0"}
                    ]
                }
            },
            "id": "schedule-sunday",
            "name": "Domingo 17:05 Bogotá",
            "type": "n8n-nodes-base.scheduleTrigger",
            "typeVersion": 1.2,
            "position": [480, 280],
        },
        {
            "parameters": {
                "method": "GET",
                "url": "https://www.zonat.com.co/api/n8n/main-store/weekly",
                "sendHeaders": True,
                "headerParameters": deepcopy(HTTP_HEADERS),
                "options": {"timeout": 300000},
            },
            "id": "http-summary",
            "name": "Pedir datos a Zonat",
            "type": "n8n-nodes-base.httpRequest",
            "typeVersion": 4.2,
            "position": [760, 180],
            "retryOnFail": True,
            "maxTries": 3,
            "waitBetweenTries": 5000,
        },
        {
            "parameters": {
                "conditions": {
                    "options": {
                        "caseSensitive": True,
                        "leftValue": "",
                        "typeValidation": "loose",
                    },
                    "conditions": [
                        {
                            "id": "json-ok",
                            "leftValue": "={{ $json.ok }}",
                            "rightValue": True,
                            "operator": {
                                "type": "boolean",
                                "operation": "true",
                                "singleValue": True,
                            },
                        }
                    ],
                    "combinator": "and",
                }
            },
            "id": "if-summary",
            "name": "¿Datos OK?",
            "type": "n8n-nodes-base.if",
            "typeVersion": 2.2,
            "position": [1020, 180],
        },
        {
            "parameters": {
                "errorMessage": "Zonat no devolvió el resumen de ventas/créditos"
            },
            "id": "fail-summary",
            "name": "Fallo datos",
            "type": "n8n-nodes-base.stopAndError",
            "typeVersion": 1,
            "position": [1020, 420],
        },
        {
            "parameters": {
                "resource": "spreadsheet",
                "operation": "create",
                "title": "={{ 'Zona T · ' + ($json.periodLabel || 'reporte semanal') }}",
                "sheetsUi": {
                    "sheetValues": [
                        {"title": "Resumen"},
                        {"title": "Ventas"},
                        {"title": "Productos vendidos"},
                        {"title": "Créditos de la semana"},
                        {"title": "Clientes morosos"},
                        {"title": "Clientes al día"},
                    ]
                },
                "options": {"locale": "es_CO"},
            },
            "id": "sheets-create",
            "name": "Crear spreadsheet",
            "type": "n8n-nodes-base.googleSheets",
            "typeVersion": 4.7,
            "position": [1280, 80],
            "credentials": deepcopy(SHEETS_CRED),
            "retryOnFail": True,
            "maxTries": 2,
            "waitBetweenTries": 4000,
        },
        code_node("rows-resumen", "Filas Resumen", CODE_RESUMEN, [1540, 80]),
        sheets_append("sheet-resumen", "Hoja Resumen", "Resumen", [1800, 80]),
        code_node("rows-ventas", "Filas Ventas", CODE_VENTAS, [2060, 80]),
        sheets_append("sheet-ventas", "Hoja Ventas", "Ventas", [2320, 80]),
        code_node("rows-productos", "Filas Productos", CODE_PRODUCTOS, [2580, 80]),
        sheets_append(
            "sheet-productos",
            "Hoja Productos",
            "Productos vendidos",
            [2840, 80],
        ),
        code_node("rows-creditos", "Filas Créditos", CODE_CREDITOS, [1540, 300]),
        sheets_append(
            "sheet-creditos",
            "Hoja Créditos",
            "Créditos de la semana",
            [1800, 300],
        ),
        code_node("rows-morosos", "Filas Morosos", CODE_MOROSOS, [2060, 300]),
        sheets_append(
            "sheet-morosos",
            "Hoja Morosos",
            "Clientes morosos",
            [2320, 300],
        ),
        code_node("rows-aldia", "Filas Al día", CODE_AL_DIA, [2580, 300]),
        sheets_append(
            "sheet-aldia",
            "Hoja Al día",
            "Clientes al día",
            [2840, 300],
        ),
        {
            "parameters": {
                "method": "GET",
                "url": "https://www.zonat.com.co/api/n8n/main-store/weekly?format=xlsx",
                "sendHeaders": True,
                "headerParameters": deepcopy(HTTP_HEADERS),
                "options": {
                    "timeout": 300000,
                    "response": {"response": {"responseFormat": "file"}},
                },
            },
            "id": "http-excel",
            "name": "Descargar Excel",
            "type": "n8n-nodes-base.httpRequest",
            "typeVersion": 4.2,
            "position": [3100, 180],
            "retryOnFail": True,
            "maxTries": 2,
            "waitBetweenTries": 8000,
        },
        {
            "parameters": {
                "conditions": {
                    "options": {
                        "caseSensitive": True,
                        "leftValue": "",
                        "typeValidation": "loose",
                        "version": 2,
                    },
                    "conditions": [
                        {
                            "id": "excel-bin",
                            "leftValue": "={{ $binary.data.mimeType }}",
                            "rightValue": "",
                            "operator": {
                                "type": "string",
                                "operation": "notEmpty",
                                "singleValue": True,
                            },
                        }
                    ],
                    "combinator": "and",
                }
            },
            "id": "if-excel",
            "name": "¿Excel OK?",
            "type": "n8n-nodes-base.if",
            "typeVersion": 2.2,
            "position": [3360, 180],
        },
        {
            "parameters": {
                "errorMessage": "El Excel está vacío o no se pudo crear"
            },
            "id": "fail-excel",
            "name": "Fallo Excel",
            "type": "n8n-nodes-base.stopAndError",
            "typeVersion": 1,
            "position": [3360, 400],
        },
        code_node("armar-correo", "Armar correo", CODE_ARMAR, [3620, 80]),
        {
            "parameters": {
                "sendTo": "={{ $json.to }}",
                "subject": "={{ $json.subject }}",
                "emailType": "html",
                "message": "={{ $json.html }}",
                "options": {
                    "appendAttribution": False,
                    "senderName": "Zona T",
                    "attachmentsUi": {
                        "attachmentsBinary": [{"property": "data"}]
                    },
                },
            },
            "id": "gmail-send",
            "name": "Enviar por Gmail",
            "type": "n8n-nodes-base.gmail",
            "typeVersion": 2.2,
            "position": [3880, 80],
            "credentials": deepcopy(GMAIL_CRED),
            "retryOnFail": True,
            "maxTries": 2,
            "waitBetweenTries": 8000,
        },
        code_node("done", "Listo", CODE_LISTO, [4140, 80]),
    ]

    def conn(*names: str) -> dict:
        return {"main": [[{"node": n, "type": "main", "index": 0} for n in names]]}

    connections = {
        "Probar ahora": conn("Pedir datos a Zonat"),
        "Domingo 17:05 Bogotá": conn("Pedir datos a Zonat"),
        "Pedir datos a Zonat": conn("¿Datos OK?"),
        "¿Datos OK?": {
            "main": [
                [{"node": "Crear spreadsheet", "type": "main", "index": 0}],
                [{"node": "Fallo datos", "type": "main", "index": 0}],
            ]
        },
        "Crear spreadsheet": conn("Filas Resumen"),
        "Filas Resumen": conn("Hoja Resumen"),
        "Hoja Resumen": conn("Filas Ventas"),
        "Filas Ventas": conn("Hoja Ventas"),
        "Hoja Ventas": conn("Filas Productos"),
        "Filas Productos": conn("Hoja Productos"),
        "Hoja Productos": conn("Filas Créditos"),
        "Filas Créditos": conn("Hoja Créditos"),
        "Hoja Créditos": conn("Filas Morosos"),
        "Filas Morosos": conn("Hoja Morosos"),
        "Hoja Morosos": conn("Filas Al día"),
        "Filas Al día": conn("Hoja Al día"),
        "Hoja Al día": conn("Descargar Excel"),
        "Descargar Excel": conn("¿Excel OK?"),
        "¿Excel OK?": {
            "main": [
                [{"node": "Armar correo", "type": "main", "index": 0}],
                [{"node": "Fallo Excel", "type": "main", "index": 0}],
            ]
        },
        "Armar correo": conn("Enviar por Gmail"),
        "Enviar por Gmail": conn("Listo"),
    }

    return {
        "id": "zonat-weekly-report",
        "name": "Zona T · Ventas y créditos",
        "active": False,
        "nodes": nodes,
        "connections": connections,
        "settings": {
            "executionOrder": "v1",
            "timezone": "America/Bogota",
        },
        "meta": {"templateCredsSetupCompleted": True},
        "pinData": {},
        "tags": [],
    }


if __name__ == "__main__":
    import pathlib

    out = pathlib.Path(__file__).resolve().parents[1] / "n8n" / "zonat-weekly-report.json"
    data = build()
    out.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {out} nodes={len(data['nodes'])}")
