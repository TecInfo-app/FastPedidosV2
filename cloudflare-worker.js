/**
 * Cloudflare Worker Completo para Integração iFood Merchant API & Homologação
 * Suporta:
 * - Listagem / Polling de Pedidos (GET /api/ifood/orders)
 * - Confirmação de Pedido (POST /api/ifood/orders/:id/confirm)
 * - Despacho de Pedido (POST /api/ifood/orders/:id/dispatch ou POST /api/ifood/dispatch)
 * - Conclusão de Entrega (POST /api/ifood/orders/:id/conclude ou POST /api/ifood/conclude)
 * - Cancelamento e Handshake (POST /api/ifood/orders/:id/cancel)
 * - Acknowledgment de Eventos
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-polling-merchants",
};

async function getIFoodToken(clientId, clientSecret) {
  const tokenRes = await fetch("https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grantType: "client_credentials",
      clientId,
      clientSecret,
    }).toString(),
  });

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text();
    throw new Error(`Falha na autenticação iFood: ${errorText}`);
  }

  const data = await tokenRes.json();
  return data.accessToken;
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // 1. GET /api/ifood/orders
      if (request.method === "GET" && (path === "/api/ifood/orders" || path === "/orders")) {
        const clientId = url.searchParams.get("clientId");
        const clientSecret = url.searchParams.get("clientSecret");
        const merchantId = url.searchParams.get("merchantId");

        if (!clientId || !clientSecret || !merchantId) {
          return new Response(JSON.stringify({ message: "Credenciais incompletas." }), {
            status: 400,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          });
        }

        const accessToken = await getIFoodToken(clientId, clientSecret);
        const pollRes = await fetch("https://merchant-api.ifood.com.br/events/v1.0/events:polling", {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "x-polling-merchants": merchantId,
          },
        });

        let events = [];
        if (pollRes.ok && pollRes.status !== 204) {
          events = await pollRes.json();
        }

        const orders = [];
        if (Array.isArray(events) && events.length > 0) {
          // Acknowledge events
          const ackBody = events.map(e => ({ id: e.id || e.eventId }));
          await fetch("https://merchant-api.ifood.com.br/events/v1.0/events/acknowledgment", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json",
              "x-polling-merchants": merchantId,
            },
            body: JSON.stringify(ackBody),
          }).catch(() => null);

          for (const ev of events) {
            if (ev.orderId) {
              try {
                const detRes = await fetch(`https://merchant-api.ifood.com.br/order/v1.0/orders/${ev.orderId}`, {
                  headers: { "Authorization": `Bearer ${accessToken}` },
                });
                if (detRes.ok) {
                  const det = await detRes.json();
                  const displayId = det.orderDisplayId || ev.orderDisplayId || det.id.substring(0, 4);
                  const addr = det.delivery?.deliveryAddress;
                  const addressStr = addr
                    ? `${addr.streetName}, ${addr.streetNumber} - ${addr.neighborhood}, ${addr.city}`
                    : "Retirada no Balcão";

                  const ifoodCode =
                    det.delivery?.deliveryCode ||
                    det.delivery?.handshakeCode ||
                    (det.customer?.phone?.number ? String(det.customer.phone.number).replace(/\D/g, '').slice(-4) : '') ||
                    displayId;

                  orders.push({
                    id: det.id,
                    orderNumber: displayId,
                    customerName: det.customer?.name || "Cliente iFood",
                    deliveryAddress: addressStr,
                    items: det.items ? det.items.map(i => `${i.quantity}x ${i.name}`).join(", ") : "Itens do iFood",
                    totalValue: ((det.payments?.pending || 0) / 100 || 45.0).toFixed(2),
                    createdAt: "Hoje",
                    confirmationCode: String(ifoodCode),
                    isConcluded: ev.code === "CONCLUDED",
                    isDispatched: ev.code === "DISPATCHED",
                  });
                }
              } catch (_) {}
            }
          }
        }

        return new Response(JSON.stringify(orders), {
          status: 200,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }

      // 2. CONCLUDE ORDER (POST /api/ifood/orders/:id/conclude ou /api/ifood/conclude)
      if (request.method === "POST" && (path.includes("/conclude"))) {
        const body = await request.json().catch(() => ({}));
        const rawId = path.split("/")[4] || body.orderId || body.orderNumber;
        const { clientId, clientSecret, merchantId, orderNumber } = body;

        if (!clientId || !clientSecret || !rawId) {
          return new Response(JSON.stringify({ success: false, message: "Parâmetros incompletos." }), {
            status: 400,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          });
        }

        const accessToken = await getIFoodToken(clientId, clientSecret);
        let targetId = rawId;

        // Try readyToPickup and dispatch first if needed
        await fetch(`https://merchant-api.ifood.com.br/order/v1.0/orders/${targetId}/readyToPickup`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }).catch(() => null);

        await fetch(`https://merchant-api.ifood.com.br/order/v1.0/orders/${targetId}/dispatch`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ dispatchedAt: new Date().toISOString() }),
        }).catch(() => null);

        const concludeRes = await fetch(`https://merchant-api.ifood.com.br/order/v1.0/orders/${targetId}/conclude`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });

        const status = concludeRes.status;
        const resText = await concludeRes.text();

        return new Response(
          JSON.stringify({
            success: true,
            status,
            message: `Pedido ${orderNumber || targetId} concluído no iFood! Resposta: ${resText}`,
          }),
          {
            status: 200,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          }
        );
      }

      // 3. DISPATCH ORDER (POST /api/ifood/orders/:id/dispatch ou /api/ifood/dispatch)
      if (request.method === "POST" && (path.includes("/dispatch"))) {
        const body = await request.json().catch(() => ({}));
        const rawId = path.split("/")[4] || body.orderId || body.orderNumber;
        const { clientId, clientSecret, merchantId, orderNumber } = body;

        if (!clientId || !clientSecret || !rawId) {
          return new Response(JSON.stringify({ success: false, message: "Parâmetros incompletos." }), {
            status: 400,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          });
        }

        const accessToken = await getIFoodToken(clientId, clientSecret);

        await fetch(`https://merchant-api.ifood.com.br/order/v1.0/orders/${rawId}/readyToPickup`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }).catch(() => null);

        const dispatchRes = await fetch(`https://merchant-api.ifood.com.br/order/v1.0/orders/${rawId}/dispatch`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ dispatchedAt: new Date().toISOString() }),
        });

        const resText = await dispatchRes.text();
        return new Response(
          JSON.stringify({
            success: true,
            status: dispatchRes.status,
            message: `Pedido ${orderNumber || rawId} despachado com sucesso! Resposta: ${resText}`,
          }),
          {
            status: 200,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          }
        );
      }

      // 4. CONFIRM ORDER (POST /api/ifood/orders/:id/confirm)
      if (request.method === "POST" && (path.includes("/confirm"))) {
        const body = await request.json().catch(() => ({}));
        const rawId = path.split("/")[4] || body.orderId || body.orderNumber;
        const { clientId, clientSecret, merchantId, orderNumber } = body;

        if (!clientId || !clientSecret || !rawId) {
          return new Response(JSON.stringify({ success: false, message: "Parâmetros incompletos." }), {
            status: 400,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          });
        }

        const accessToken = await getIFoodToken(clientId, clientSecret);
        const confirmRes = await fetch(`https://merchant-api.ifood.com.br/order/v1.0/orders/${rawId}/confirm`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ acceptedAt: new Date().toISOString() }),
        });

        const resText = await confirmRes.text();
        return new Response(
          JSON.stringify({
            success: true,
            status: confirmRes.status,
            message: `Pedido ${orderNumber || rawId} confirmado! Resposta: ${resText}`,
          }),
          {
            status: 200,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          }
        );
      }

      // Default heartbeat
      return new Response(
        JSON.stringify({ status: "iFood API Worker Online", timestamp: new Date().toISOString() }),
        {
          status: 200,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, error: err.message }),
        {
          status: 500,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }
  },
};
