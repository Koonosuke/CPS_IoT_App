"use client";

import { useMapEvents } from "react-leaflet";
import type { LatLngTuple } from "leaflet";

interface Props {
  setPos: React.Dispatch<React.SetStateAction<LatLngTuple | null>>;
}

export default function DeviceClaimForm({ setPos }: Props) {
  useMapEvents({
    click(e) {
      setPos([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null; // 地図に描画するものはなし
}

