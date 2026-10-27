import { useState, useEffect } from "react";

/**
 * Hook propio de persistencia en localStorage.
 *
 * Expone una API idéntica a useState, pero sincroniza el valor con
 * localStorage. Es tolerante a errores: si el JSON guardado está corrupto
 * o localStorage no está disponible, cae al valor inicial sin romper la app.
 */
export function useLocalStorage<T>(
  clave: string,
  valorInicial: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  // Lectura perezosa: solo se ejecuta en el primer render.
  const [valor, setValor] = useState<T>(() => {
    try {
      const crudo = window.localStorage.getItem(clave);
      // Si no hay nada guardado, usamos el valor inicial.
      if (crudo === null) return valorInicial;
      // Puede lanzar SyntaxError si el contenido está corrupto.
      return JSON.parse(crudo) as T;
    } catch (error) {
      // JSON corrupto o localStorage inaccesible: avisamos y limpiamos.
      console.warn(
        `useLocalStorage: no se pudo leer la clave "${clave}". Se usa el valor inicial.`,
        error
      );
      try {
        window.localStorage.removeItem(clave);
      } catch {
        // Si ni siquiera se puede borrar, lo ignoramos.
      }
      return valorInicial;
    }
  });

  // Cada vez que cambia el valor, lo persistimos.
  useEffect(() => {
    try {
      window.localStorage.setItem(clave, JSON.stringify(valor));
    } catch (error) {
      console.warn(
        `useLocalStorage: no se pudo guardar la clave "${clave}".`,
        error
      );
    }
  }, [clave, valor]);

  return [valor, setValor];
}
