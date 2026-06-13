import { useEffect } from "react";
import { registerCityDefaults } from "../../game/city/registry/cityRegistry";
import { useCityStore } from "../../store/city/useCityStore";

export function useCityBoot() {
  const setSnapshot = useCityStore((state) => state.setSnapshot);

  useEffect(() => {
    const snapshot = registerCityDefaults();
    setSnapshot(snapshot);
  }, [setSnapshot]);
}
