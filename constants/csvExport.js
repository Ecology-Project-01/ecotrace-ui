/**
 * Shared CSV column layout for EcoTrace exports (opens in Excel).
 * Headers: date, start time, end time, duration, distance covered, loc1–loc5, taxon, geo, contributor, notes
 */

export const OBSERVATION_CSV_HEADERS = [
    'date',
    'start time',
    'end time',
    'duration',
    'distance covered',
    'loc1',
    'loc2',
    'loc3',
    'loc4',
    'loc5',
    'order',
    'family',
    'common name',
    'scientific name',
    'count',
    'IUCN status',
    'latitude',
    'longitude',
    'contributor',
    'org',
    'notes',
];

export const observationCsvHeaderLine = () => OBSERVATION_CSV_HEADERS.join(',');

/** Escape for CSV: quote if needed */
export function csvQ(val) {
    const s = val == null ? '' : String(val);
    if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
}

function pad(n) {
    return String(n).padStart(2, '0');
}

export function formatDateLocal(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatTimeLocal(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** API observation: location_name array or string */
export function locationNameToLocArray(location_name) {
    if (!location_name) return [];
    if (Array.isArray(location_name)) return location_name.map((x) => String(x).trim());
    if (typeof location_name === 'string') {
        return location_name
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
    }
    return [];
}

export function locArrayToFive(locArray) {
    const a = Array.isArray(locArray) ? [...locArray] : [];
    while (a.length < 5) a.push('');
    return a.slice(0, 5).map((x) => csvQ(x));
}

export function getLatLngFromObservation(item) {
    const loc = item.location;
    let lat = '';
    let lng = '';
    if (Array.isArray(loc)) {
        lat = loc[0] != null ? String(loc[0]) : '';
        lng = loc[1] != null ? String(loc[1]) : '';
    } else if (loc?.coordinates) {
        lng = String(loc.coordinates[0] ?? '');
        lat = String(loc.coordinates[1] ?? '');
    }
    return { lat, lng };
}

/**
 * Single API observation row (Results screen).
 * Point observation: end time = start time; duration & distance empty.
 */
export function rowFromApiObservation(item) {
    const t = item.observedDate || item.observedAt;
    const dateStr = formatDateLocal(t);
    const startStr = formatTimeLocal(t);
    const endStr = startStr;
    const durationStr = '';
    const distanceStr = '';

    const locParts = locationNameToLocArray(item.location_name);
    const [l1, l2, l3, l4, l5] = locArrayToFive(locParts);

    const { lat, lng } = getLatLngFromObservation(item);
    const tx = item.taxon || {};

    return [
        csvQ(dateStr),
        csvQ(startStr),
        csvQ(endStr),
        csvQ(durationStr),
        csvQ(distanceStr),
        l1,
        l2,
        l3,
        l4,
        l5,
        csvQ(tx.order || ''),
        csvQ(tx.family || ''),
        csvQ(tx.common_name || ''),
        csvQ(tx.scientific_name || ''),
        item.count != null ? String(item.count) : '',
        csvQ(tx.iucn_status || ''),
        csvQ(lat),
        csvQ(lng),
        csvQ(item.contributor || ''),
        csvQ(item.org || ''),
        csvQ(item.notes || ''),
    ].join(',');
}

/** Duration string between two ISO dates */
export function formatDurationBetween(startIso, endIso) {
    if (!startIso || !endIso) return '';
    const a = new Date(startIso).getTime();
    const b = new Date(endIso).getTime();
    if (Number.isNaN(a) || Number.isNaN(b) || b < a) return '';
    const ms = b - a;
    const sec = Math.floor(ms / 1000);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

/**
 * Trip observation row (pending-upload shape). Optional ctx fills contributor/org from the trip.
 */
export function rowFromTripObservation(trip, item, ctx = {}) {
    const tripStart = trip.startTime;
    const tripEnd = trip.endTime;

    const dateStr = formatDateLocal(tripStart);
    const startStr = formatTimeLocal(tripStart);
    const endStr = formatTimeLocal(tripEnd);
    const durationStr = formatDurationBetween(tripStart, tripEnd);
    const distM = typeof trip.distance === 'number' ? trip.distance : 0;
    const distanceStr = distM >= 1000 ? `${(distM / 1000).toFixed(2)} km` : `${Math.round(distM)} m`;

    const area = item.areaName || '';
    const locParts =
        typeof area === 'string' && area.includes(',')
            ? area.split(',').map((x) => x.trim())
            : area
              ? [area]
              : [];
    const [l1, l2, l3, l4, l5] = locArrayToFive(locParts);

    const lat = item.latitude != null ? String(item.latitude) : '';
    const lng = item.longitude != null ? String(item.longitude) : '';

    const contributor = item.contributor || ctx.contributor || '';
    const org = item.org || ctx.org || '';

    return [
        csvQ(dateStr),
        csvQ(startStr),
        csvQ(endStr),
        csvQ(durationStr),
        csvQ(distanceStr),
        l1,
        l2,
        l3,
        l4,
        l5,
        csvQ(item.order || ''),
        csvQ(item.family || ''),
        csvQ(item.commonName || ''),
        csvQ(item.scientificName || ''),
        item.count != null ? String(item.count) : '1',
        csvQ(item.iucn || ''),
        csvQ(lat),
        csvQ(lng),
        csvQ(contributor),
        csvQ(org),
        csvQ(item.notes || ''),
    ].join(',');
}
