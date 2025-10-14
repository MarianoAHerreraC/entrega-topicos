import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-100 to-blue-100 dark:from-slate-900 dark:to-blue-900">
      <div className="text-center bg-white dark:bg-slate-800 rounded-xl shadow-lg px-8 py-10 border border-gray-200 dark:border-slate-700">
        <h1 className="mb-4 text-5xl font-extrabold text-blue-600 dark:text-blue-400 drop-shadow">404</h1>
        <p className="mb-6 text-xl text-gray-600 dark:text-gray-300">¡Ups! Página no encontrada</p>
        <a
          href="/"
          className="inline-block px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Volver al inicio
        </a>
      </div>
    </div>
  );
};

export default NotFound;
