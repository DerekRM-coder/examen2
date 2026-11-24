import { onUnmounted, ref } from 'vue';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Network, type ConnectionStatus } from '@capacitor/network';

/**
 * TODO [M7] Capacidades nativas (6 pts en total: este archivo, PerfilPage.vue y AndroidManifest.xml).
 *
 * useConexion() devuelve { conectado, tipo }:
 *   - Valor inicial con Network.getStatus()                       (@capacitor/network)
 *   - Se actualiza solo con Network.addListener('networkStatusChange', ...)
 *   - El oyente se libera (handle.remove()) cuando se destruye la página que lo usa (onUnmounted).
 *   Las páginas Equipos y Formulario ya muestran el aviso "Sin conexión" y deshabilitan Guardar con `conectado`.
 */
export function useConexion() {
  const conectado = ref(true);
  const tipo = ref('unknown');
  let desmontado = false;
  let listener: Awaited<ReturnType<typeof Network.addListener>> | null = null;

  const actualizar = (estado: ConnectionStatus) => {
    conectado.value = estado.connected;
    tipo.value = estado.connectionType;
  };

  const iniciar = async () => {
    try {
      const estadoInicial = await Network.getStatus();
      if (desmontado) return;
      actualizar(estadoInicial);

      const nuevoListener = await Network.addListener('networkStatusChange', actualizar);
      if (desmontado) await nuevoListener.remove();
      else listener = nuevoListener;
    } catch {
      // La vista conserva el estado inicial si la capacidad nativa no está disponible.
    }
  };

  void iniciar();
  onUnmounted(() => {
    desmontado = true;
    if (listener) void listener.remove();
  });

  return { conectado, tipo };
}

/**
 * TODO [M7] vibrar(): vibración breve de confirmación con Haptics.impact({ style: ImpactStyle.Light })
 *   (@capacitor/haptics). En el navegador NO debe hacer nada: use Capacitor.isNativePlatform().
 *   Se llama después de guardar y de eliminar con éxito.
 */
export async function vibrar() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // La vibración es opcional y no debe convertir una operación exitosa en error.
  }
}
