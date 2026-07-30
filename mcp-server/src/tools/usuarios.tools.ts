import { SafeWalkApiClient } from '../api/safewalk-client.js';

export async function listarServiciosEmergencia(client: SafeWalkApiClient) {
  const data = await client.request<unknown[]>('/services');
  return data;
}

export async function listarLugaresSeguros(client: SafeWalkApiClient) {
  const data = await client.request<unknown[]>('/places');
  return data;
}
