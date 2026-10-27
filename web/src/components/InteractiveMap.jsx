import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  ASSEMBLY_POINTS,
  CONTOURS,
  HILLS,
  LABELS,
  RESERVOIR,
  RIVER_GODAVARI,
  RIVER_TRIBUTARY,
  RISK_RADIUS_METERS,
  ROADS,
  SITE_CENTER,
  WARDS,
} from '../lib/map-data.js';
import { formatCoordinate, formatNumber, formatRelative, riskLabel } from '../lib/format.js';

const COLORS = {
  aubergine: '#3A0F34',
  silver: '#DDD3E8',
  marigold: '#EAAA00',
};

const RISK_STYLES = {
  low: { color: 'rgba(221,211,232,0.42)', fill: 'rgba(221,211,232,0.035)', weight: 1 },
  moderate: { color: 'rgba(221,211,232,0.65)', fill: 'rgba(221,211,232,0.06)', weight: 1.2 },
  high: { color: 'rgba(234,170,0,0.62)', fill: 'rgba(234,170,0,0.07)', weight: 1.4 },
  severe: { color: 'rgba(234,170,0,0.95)', fill: 'rgba(234,170,0,0.11)', weight: 1.8 },
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function popupHtml(node) {
  const factors = (node.risk.topFactors ?? [])
    .slice(0, 3)
    .map(
      (factor) => `
        <div class="map-popup__factor">
          <span>${escapeHtml(factor.label)}</span>
          <strong>${escapeHtml(factor.value)}</strong>
        </div>`,
    )
    .join('');

  return `
    <div class="map-popup">
      <div class="map-popup__top">
        <span class="map-popup__id">${escapeHtml(node.id)}</span>
        <span class="map-popup__risk map-popup__risk--${node.risk.level}">${riskLabel(node.risk.level)}</span>
      </div>
      <h3>${escapeHtml(node.name)}</h3>
      <p class="map-popup__location">${escapeHtml(node.location)}</p>
      <div class="map-popup__metrics">
        <div><span>Water</span><strong>${formatNumber(node.latest.waterLevel)} cm</strong></div>
        <div><span>Rain</span><strong>${formatNumber(node.latest.rain)} mm/h</strong></div>
        <div><span>AQI</span><strong>${formatNumber(node.latest.aqi, { maximumFractionDigits: 0 })}</strong></div>
        <div><span>Battery</span><strong>${node.health.batteryPercent}%</strong></div>
      </div>
      <div class="map-popup__factors">
        <span class="map-popup__section-label">Risk contributors</span>
        ${factors || '<span class="map-popup__quiet">No threshold contributors</span>'}
      </div>
      <div class="map-popup__footer">
        <span>${formatCoordinate(node.lat, 'lat')} · ${formatCoordinate(node.lon, 'lon')}</span>
        <span>${escapeHtml(formatRelative(node.health.lastSeen))}</span>
      </div>
    </div>`;
}

function baseMapLayers() {
  const layers = [];
  const add = (layer) => {
    layers.push(layer);
    return layer;
  };

  HILLS.forEach((hill) => {
    add(
      L.polygon(hill, {
        color: 'rgba(221,211,232,0.055)',
        weight: 1,
        fillColor: COLORS.silver,
        fillOpacity: 0.025,
        interactive: false,
      }),
    );
  });

  CONTOURS.forEach((contour) => {
    add(
      L.polyline(contour, {
        color: 'rgba(221,211,232,0.14)',
        weight: 0.8,
        dashArray: '2 5',
        interactive: false,
      }),
    );
  });

  WARDS.forEach((ward) => {
    add(
      L.polygon(ward.path, {
        color: 'rgba(221,211,232,0.17)',
        weight: 1,
        dashArray: '5 7',
        fillOpacity: 0,
        interactive: false,
      }),
    );
  });

  add(
    L.polyline(RIVER_GODAVARI, {
      color: 'rgba(221,211,232,0.055)',
      weight: 30,
      lineCap: 'round',
      interactive: false,
    }),
  );
  add(
    L.polyline(RIVER_GODAVARI, {
      color: 'rgba(221,211,232,0.26)',
      weight: 4,
      lineCap: 'round',
      interactive: false,
    }),
  );
  add(
    L.polyline(RIVER_TRIBUTARY, {
      color: 'rgba(221,211,232,0.2)',
      weight: 2.5,
      lineCap: 'round',
      interactive: false,
    }),
  );

  add(
    L.polygon(RESERVOIR, {
      color: 'rgba(234,170,0,0.36)',
      weight: 1,
      fillColor: COLORS.marigold,
      fillOpacity: 0.055,
      interactive: false,
    }),
  );

  ROADS.forEach((road) => {
    add(
      L.polyline(road.path, {
        color: 'rgba(221,211,232,0.08)',
        weight: road.width + 4,
        lineCap: 'round',
        interactive: false,
      }),
    );
    add(
      L.polyline(road.path, {
        color: 'rgba(221,211,232,0.32)',
        weight: road.width,
        lineCap: 'round',
        interactive: false,
      }),
    );
  });

  LABELS.forEach((label) => {
    add(
      L.marker([label.lat, label.lon], {
        interactive: false,
        icon: L.divIcon({
          className: 'map-place-label-wrap',
          html: `<span class="map-place-label map-place-label--${label.kind}">${escapeHtml(label.text)}</span>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        }),
      }),
    );
  });

  ASSEMBLY_POINTS.forEach((point) => {
    add(
      L.marker([point.lat, point.lon], {
        interactive: false,
        icon: L.divIcon({
          className: 'map-assembly-wrap',
          html: `<span class="map-assembly" title="${escapeHtml(point.name)}"><span class="map-assembly__mark"></span><span class="map-assembly__label">${escapeHtml(point.name)}</span></span>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        }),
      }),
    );
  });

  return layers;
}

export function InteractiveMap({
  nodes = [],
  selectedNodeId,
  onSelectNode,
  className = '',
  showControls = true,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const nodeLayerRef = useRef(new Map());
  const selectRef = useRef(onSelectNode);
  const hasFocusedRef = useRef(false);
  const [pointer, setPointer] = useState(null);

  selectRef.current = onSelectNode;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;

    const map = L.map(containerRef.current, {
      center: SITE_CENTER,
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
      minZoom: 11,
      maxZoom: 17,
      zoomSnap: 0.25,
      preferCanvas: true,
      worldCopyJump: false,
    });
    mapRef.current = map;

    map.fitBounds(
      [
        [19.974, 73.754],
        [20.068, 73.869],
      ],
      { padding: [20, 20] },
    );

    if (showControls) {
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.control.scale({ position: 'bottomleft', imperial: false, maxWidth: 110 }).addTo(map);
    }

    // FeatureGroup keeps the generated basemap layers together underneath the
    // live node layers that are attached to the map later.
    L.featureGroup(baseMapLayers()).addTo(map);

    map.on('mousemove', (event) => {
      setPointer({ lat: event.latlng.lat, lon: event.latlng.lng });
    });
    map.on('mouseout', () => setPointer(null));

    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    observer.observe(containerRef.current);
    window.setTimeout(() => map.invalidateSize({ pan: false }), 80);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      nodeLayerRef.current.clear();
    };
  }, [showControls]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const currentIds = new Set(nodes.map((node) => node.id));

    for (const [nodeId, layer] of nodeLayerRef.current.entries()) {
      if (!currentIds.has(nodeId)) {
        layer.marker.remove();
        layer.circle.remove();
        nodeLayerRef.current.delete(nodeId);
      }
    }

    nodes.forEach((node, index) => {
      const selected = node.id === selectedNodeId;
      const riskStyle = RISK_STYLES[node.risk.level] ?? RISK_STYLES.low;
      const radius = (RISK_RADIUS_METERS[node.risk.level] ?? 800) * (selected ? 1.08 : 1);
      const markerHtml = `
        <div class="map-node map-node--${node.risk.level} ${selected ? 'map-node--selected' : ''}">
          <span class="map-node__pulse"></span>
          <span class="map-node__ring"></span>
          <span class="map-node__core">${String(index + 1).padStart(2, '0')}</span>
          <span class="map-node__label">
            <strong>${escapeHtml(node.name)}</strong>
            <span>${Math.round(node.risk.score)} · ${riskLabel(node.risk.level)}</span>
          </span>
        </div>`;
      const icon = L.divIcon({
        className: 'map-node-wrap',
        html: markerHtml,
        iconSize: [168, 72],
        iconAnchor: [84, 36],
      });

      const existing = nodeLayerRef.current.get(node.id);
      if (existing) {
        existing.marker.setLatLng([node.lat, node.lon]);
        existing.marker.setIcon(icon);
        existing.marker.setZIndexOffset(selected ? 800 : 300 + index);
        existing.marker.setPopupContent(popupHtml(node));
        existing.circle.setLatLng([node.lat, node.lon]);
        existing.circle.setRadius(radius);
        existing.circle.setStyle({
          color: riskStyle.color,
          fillColor: riskStyle.fill,
          weight: riskStyle.weight,
          dashArray: node.risk.level === 'severe' ? '6 7' : null,
        });
        return;
      }

      const circle = L.circle([node.lat, node.lon], {
        radius,
        color: riskStyle.color,
        fillColor: riskStyle.fill,
        fillOpacity: 0.75,
        weight: riskStyle.weight,
        dashArray: node.risk.level === 'severe' ? '6 7' : null,
        interactive: false,
      }).addTo(map);

      const marker = L.marker([node.lat, node.lon], {
        icon,
        zIndexOffset: selected ? 800 : 300 + index,
        riseOnHover: true,
        title: node.name,
      }).addTo(map);

      marker.bindPopup(popupHtml(node), {
        className: 'sentinel-popup',
        maxWidth: 308,
        minWidth: 280,
        closeButton: true,
        offset: [0, 4],
        autoPanPadding: [28, 28],
      });

      marker.on('click', () => {
        selectRef.current?.(node.id);
      });

      nodeLayerRef.current.set(node.id, { marker, circle });
    });
  }, [nodes, selectedNodeId]);

  useEffect(() => {
    if (!selectedNodeId || !mapRef.current || hasFocusedRef.current) return;
    const node = nodes.find((item) => item.id === selectedNodeId);
    if (!node) return;
    hasFocusedRef.current = true;
    mapRef.current.panTo([node.lat, node.lon], { animate: true, duration: 0.5 });
  }, [selectedNodeId, nodes]);

  return (
    <div className={`map-shell ${className}`}>
      <div className="map-canvas" ref={containerRef} aria-label="Interactive risk map" role="application" />
      <div className="map-overlay map-overlay--top-left">
        <span className="map-live">
          <span className="map-live__dot" />
          GPS POSITIONS · LIVE
        </span>
        <span className="map-overlay__detail">
          {nodes.length} nodes · {nodes.filter((node) => node.online).length} reporting
        </span>
      </div>
      <div className="map-overlay map-overlay--top-right">
        <div className="map-legend">
          <span className="map-legend__title">Risk envelope</span>
          {['low', 'moderate', 'high', 'severe'].map((level) => (
            <span className={`map-legend__item map-legend__item--${level}`} key={level}>
              <span className="map-legend__swatch" />
              {riskLabel(level)}
            </span>
          ))}
        </div>
      </div>
      <div className="map-compass" aria-hidden="true">
        <span>N</span>
        <i />
      </div>
      <div className="map-overlay map-overlay--bottom">
        <span className="map-coords">
          {pointer
            ? `${formatCoordinate(pointer.lat, 'lat')} · ${formatCoordinate(pointer.lon, 'lon')}`
            : 'GY-NEO6MV2 · 1 Hz GPS fix'}
        </span>
        <span className="map-source">DDMA offline vector basemap</span>
      </div>
    </div>
  );
}
