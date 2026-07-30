import React, { useCallback, useEffect, useState } from 'react';
import { useMapConfig } from '../context/map';
import { useAuth } from '../context/auth';
import { request } from '../services/api';
import ConfirmDialog from './ConfirmDialog';

const emptyForm = { nombre: '', telefono: '', parentesco: 'OTRO' };
const relationships = ['PADRE', 'MADRE', 'HERMANO', 'HERMANA', 'AMIGO', 'PAREJA', 'OTRO'];
const phoneHref = (phone) => `tel:${String(phone).replace(/[^+\d]/g, '')}`;

export default function ContactosEmergencia() {
  const { setMapConfig, defaultMapConfig } = useMapConfig();
  const { showToast } = useAuth();
  const [data, setData] = useState({ contactos: [], servicios: [], lugares: [] });
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const load = useCallback(async () => {
    const [contacts, services, places] = await Promise.all([request('/contacts'), request('/services'), request('/places')]);
    const next = { contactos: contacts.data || [], servicios: services.data || [], lugares: places.data || [] };
    setData(next);
    const points = [...next.servicios, ...next.lugares].filter((item) => Number.isFinite(Number(item.latitud)) && Number.isFinite(Number(item.longitud)));
    setMapConfig({ centro: points.length ? [Number(points[0].latitud), Number(points[0].longitud)] : defaultMapConfig.centro, zoom: 16, markers: points.map((item) => ({ position: [Number(item.latitud), Number(item.longitud)], title: item.nombre || item.ubicacion_nombre || 'Punto de apoyo', desc: item.descripcion || item.direccion || 'Punto registrado por SafeWalk U' })) });
    setStatus('ready');
  }, [defaultMapConfig, setMapConfig]);

  useEffect(() => {
    let active = true;
    load().catch((loadError) => { if (active) { setError(loadError.message); setStatus('error'); } });
    return () => { active = false; setMapConfig(defaultMapConfig); };
  }, [defaultMapConfig, load, setMapConfig]);

  const resetForm = () => { setForm(emptyForm); setEditingId(null); };
  const submit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!/^[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u.test(form.nombre.trim())) {
      setError('El nombre del contacto solo debe contener letras, espacios y tildes.');
      return;
    }

    if (!/^[0-9]{10}$/.test(form.telefono.trim())) {
      setError('El teléfono debe contener exactamente 10 dígitos.');
      return;
    }

    setSaving(true);
    try {
      await request(editingId ? `/contacts/${editingId}` : '/contacts', { method: editingId ? 'PUT' : 'POST', body: JSON.stringify({ ...form, nombre: form.nombre.trim(), telefono: form.telefono.trim() }) });
      showToast(editingId ? 'Contacto actualizado.' : 'Contacto agregado.'); resetForm(); await load();
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : 'No fue posible guardar el contacto.'); }
    finally { setSaving(false); }
  };
  const edit = (contact) => { setEditingId(contact.id_contacto); setForm({ nombre: contact.nombre, telefono: contact.telefono, parentesco: contact.parentesco }); };
  const remove = async (contact) => {
    setPendingDelete(contact);
  };

  const confirmRemove = async () => {
    const contact = pendingDelete;
    if (!contact) return;
    try { await request(`/contacts/${contact.id_contacto}`, { method: 'DELETE' }); showToast('Contacto eliminado.'); if (editingId === contact.id_contacto) resetForm(); await load(); }
    catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : 'No fue posible eliminar el contacto.'); }
    finally { setPendingDelete(null); }
  };

  return <div className="space-y-5">
    <div><h2 className="text-xl font-black text-purple-950">Contactos de apoyo</h2><p className="mt-1 text-xs text-slate-500">Administra tus contactos personales y consulta servicios de emergencia verificados.</p></div>
    {status === 'loading' && <p className="rounded-2xl bg-slate-50 p-4 text-xs font-semibold text-slate-600">Cargando red de apoyo…</p>}
    {error && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-xs font-semibold text-red-700">{error}</p>}

    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-purple-100 bg-purple-50/40 p-4">
      <div className="flex items-center justify-between"><h3 className="text-sm font-black text-purple-950">{editingId ? 'Editar contacto' : 'Agregar contacto'}</h3><span className="text-[10px] font-bold text-slate-500">{data.contactos.length}/20</span></div>
      <input required minLength={2} maxLength={100} aria-label="Nombre del contacto" placeholder="Nombre completo" value={form.nombre} onChange={(event) => setForm((value) => ({ ...value, nombre: event.target.value }))} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" />
      <div className="space-y-1">
        <div className="relative">
          <input
            required
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={10}
            aria-label="Teléfono del contacto"
            placeholder="Teléfono (10 dígitos), ej. 0991234567"
            value={form.telefono}
            onChange={(event) => {
              const cleaned = event.target.value.replace(/\D/g, '').slice(0, 10);
              setForm((value) => ({ ...value, telefono: cleaned }));
            }}
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 pr-14 text-sm"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
            {form.telefono.length}/10
          </span>
        </div>
      </div>
      <select aria-label="Parentesco" value={form.parentesco} onChange={(event) => setForm((value) => ({ ...value, parentesco: event.target.value }))} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">{relationships.map((relationship) => <option key={relationship} value={relationship}>{relationship}</option>)}</select>
      <div className="grid grid-cols-2 gap-2">{editingId && <button type="button" onClick={resetForm} className="min-h-11 rounded-xl border border-purple-300 text-xs font-bold text-purple-900">Cancelar</button>}<button disabled={saving || (!editingId && data.contactos.length >= 20)} className={`${editingId ? '' : 'col-span-2'} min-h-11 rounded-xl bg-purple-900 text-xs font-bold text-white disabled:opacity-50`}>{saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Agregar contacto'}</button></div>
    </form>

    <section className="space-y-3"><h3 className="text-sm font-black text-purple-950">Mis contactos</h3>{data.contactos.map((contact) => <article key={contact.id_contacto} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex justify-between gap-3"><div><p className="text-xs font-bold text-slate-900">{contact.nombre}</p><p className="mt-1 text-[11px] text-slate-500">{contact.parentesco}</p></div><div className="flex gap-2"><button type="button" onClick={() => edit(contact)} className="min-h-11 rounded-xl border px-3 text-xs font-bold text-purple-900">Editar</button><button type="button" onClick={() => remove(contact)} className="min-h-11 rounded-xl border border-red-200 px-3 text-xs font-bold text-red-700">Eliminar</button></div></div><a href={phoneHref(contact.telefono)} className="mt-3 flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-xs font-bold text-white">Llamar {contact.telefono}</a></article>)}{status === 'ready' && data.contactos.length === 0 && <p className="rounded-2xl border border-slate-200 p-4 text-xs text-slate-600">Aún no has registrado contactos personales.</p>}</section>
    <section className="space-y-3"><h3 className="text-sm font-black text-purple-950">Servicios de emergencia</h3>{data.servicios.map((service) => <article key={service.id_servicio} className="rounded-2xl border border-red-100 bg-white p-4"><p className="text-xs font-bold text-slate-900">{service.nombre || service.tipo_servicio}</p><p className="mt-1 text-[11px] text-slate-500">{service.ubicacion_nombre || service.direccion}</p>{service.telefono && <a href={phoneHref(service.telefono)} className="mt-3 flex min-h-11 items-center justify-center rounded-xl bg-red-600 px-4 text-xs font-bold text-white">Llamar {service.telefono}</a>}</article>)}</section>
    <section className="space-y-3"><h3 className="text-sm font-black text-purple-950">Lugares seguros ({data.lugares.length})</h3>{data.lugares.map((place) => <article key={place.id_lugar_seguro} className="rounded-2xl border border-green-100 bg-green-50 p-4 text-xs"><strong>{place.nombre || place.ubicacion_nombre}</strong><p className="mt-1 text-slate-600">{place.descripcion || place.direccion}</p></article>)}</section>
    <ConfirmDialog open={Boolean(pendingDelete)} title="Eliminar contacto" message={pendingDelete ? `¿Eliminar a ${pendingDelete.nombre} de tus contactos de emergencia?` : ''} confirmText="Eliminar" danger onClose={() => setPendingDelete(null)} onConfirm={confirmRemove} />
  </div>;
}
