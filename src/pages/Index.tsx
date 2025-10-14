import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { MonthSummaryCard } from "@/components/home/MonthSummaryCard";
import { TopCategories } from "@/components/home/TopCategories";
import { RecentTransactions } from "@/components/home/RecentTransactions";
import { InstallmentsCard } from "@/components/home/InstallmentsCard";
import { PeriodSelector } from "@/components/analysis/PeriodSelector";
import { ChartContainer } from "@/components/analysis/ChartContainer";
import { SummaryTable } from "@/components/analysis/SummaryTable";
import { SearchFilters } from "@/components/history/SearchFilters";
import { TransactionList } from "@/components/history/TransactionList";
import { CategoryManager } from "@/components/settings/CategoryManager";
import { ExportData } from "@/components/settings/ExportData";
import { PaymentSummary } from "../components/home/PaymentSummary";

const Index = () => {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("activeTab") || "home";
  });

  const [selectedPeriod, setSelectedPeriod] = useState<"current" | "last" | "90days">("current");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState("all");

  const availableWidgets = [
    { id: "summary", name: "Resumen mensual", component: <MonthSummaryCard /> },
    { id: "installments", name: "Próximas cuotas", component: <InstallmentsCard /> },
    { id: "categories", name: "Top categorías", component: <TopCategories /> },
    { id: "recent", name: "Últimos movimientos", component: <RecentTransactions onViewAll={() => setActiveTab("history")} /> },
    { id: "payment", name: "Resumen por método de pago", component: <PaymentSummary /> },
  ];

  const [userWidgets, setUserWidgets] = useState<string[]>(() => {
    const saved = localStorage.getItem("userWidgets");
    return saved ? JSON.parse(saved) : ["summary", "installments", "categories", "recent"];
  });
  const [customizing, setCustomizing] = useState(false);

  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  const toggleWidget = (id: string) => {
    setUserWidgets((widgets) => {
      const updated = widgets.includes(id)
        ? widgets.filter((w) => w !== id)
        : [...widgets, id];
      localStorage.setItem("userWidgets", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-200">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="max-w-7xl mx-auto px-4 pt-24 pb-12">
        {activeTab === "analysis" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-50">Análisis Financiero</h1>
              <PeriodSelector
                selectedPeriod={selectedPeriod}
                onPeriodChange={setSelectedPeriod}
              />
            </div>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 dark:bg-slate-800 dark:border-slate-700">
              <ChartContainer selectedPeriod={selectedPeriod} />
            </div>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 dark:bg-slate-800 dark:border-slate-700">
              <SummaryTable selectedPeriod={selectedPeriod} />
            </div>
          </div>
        )}
        {activeTab === "home" && (
          <div className="flex flex-col gap-4">
            <button
              className="mb-4 px-4 py-1.5 rounded-md bg-gray-200 text-gray-800 shadow-sm hover:bg-gray-300 transition dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 self-start text-base"
              onClick={() => setCustomizing((c) => !c)}
            >
              {customizing ? "Cerrar Personalización" : "Personalizar Dashboard"}
            </button>
            {customizing && (
              <div className="mb-4 p-6 bg-gray-100 border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
                <h2 className="font-semibold mb-4 text-slate-800 dark:text-slate-200">Elige los widgets a mostrar:</h2>
                <div className="flex gap-6 flex-wrap">
                  {availableWidgets.map((w) => (
                    <label key={w.id} className="flex items-center gap-2 text-base">
                      <input
                        type="checkbox"
                        checked={userWidgets.includes(w.id)}
                        onChange={() => toggleWidget(w.id)}
                        className="accent-blue-600 focus:ring-2 focus:ring-blue-400 rounded"
                      />
                      {w.name}
                    </label>
                  ))}
                </div>
              </div>
            )}
            {/* Gasto mensual total ocupa todo el ancho arriba */}
            <div className="w-full">
              <MonthSummaryCard />
            </div>
            {/* Widgets en grid debajo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {userWidgets.filter(id => id !== "summary").map((id) => {
                const widget = availableWidgets.find((w) => w.id === id);
                return widget ? (
                  <div key={widget.id} className="space-y-6 flex flex-col">
                    {widget.component}
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-50">Historial de Transacciones</h1>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 dark:bg-slate-800 dark:border-slate-700">
              <SearchFilters
                searchTerm={searchTerm}
                selectedCategory={selectedCategory}
                selectedPayment={selectedPayment}
                onSearchChange={setSearchTerm}
                onCategoryChange={setSelectedCategory}
                onPaymentChange={setSelectedPayment}
              />
            </div>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 dark:bg-slate-800 dark:border-slate-700">
              <TransactionList />
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-50">Configuración</h1>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 dark:bg-slate-800 dark:border-slate-700">
              <CategoryManager />
            </div>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 dark:bg-slate-800 dark:border-slate-700">
              <ExportData />
            </div>
            <div className="text-center text-muted-foreground text-sm py-8 dark:text-slate-400">
              Billetera Inteligente v1.0 • Desarrollado con ❤️
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;