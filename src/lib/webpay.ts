import { apiFetch } from "@/lib/api-client";

/**
 * Inicia un pago Webpay para una reserva y redirige al navegador hacia
 * Transbank. Transbank exige que el redirect sea un form POST con
 * "token_ws" en el body (no basta con un <a href> ni un router.push a su
 * URL) — por eso se arma un <form> invisible y se manda solo.
 *
 * No hay que esperar nada después de llamar a esto: si todo sale bien,
 * el navegador ya se fue a la página de Webpay. Si el fetch inicial
 * falla (reserva cancelada, ya pagada, etc.), lanza ApiError como
 * cualquier otra llamada de apiFetch, para que el caller lo capture con
 * un toast.
 */
export async function iniciarPagoWebpay(reservaId: number): Promise<void> {
  const { url, token } = await apiFetch<{ url: string; token: string }>(
    `/pagos/webpay/${reservaId}/iniciar`,
    { method: "POST" },
  );

  const form = document.createElement("form");
  form.method = "POST";
  form.action = url;
  form.style.display = "none";

  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "token_ws";
  input.value = token;

  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
}
