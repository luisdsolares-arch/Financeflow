import { useEffect, useState } from "react";
import api from "../services/api";

export default function TransactionsPage() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api
      .get("/transactions")
      .then((res) => setRows(res.data))
      .catch(() => setRows([]));
  }, []);

  return (
    <div className="panel p-5">
      <h2 className="text-lg font-semibold text-slate-800">Transacciones</h2>
      <p className="mt-1 text-sm text-slate-500">Listado cronologico y control de operaciones.</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="pb-2">Fecha</th>
              <th className="pb-2">Descripcion</th>
              <th className="pb-2">Categoria</th>
              <th className="pb-2">Tipo</th>
              <th className="pb-2 text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100">
                <td className="py-2">{row.date}</td>
                <td>{row.description}</td>
                <td>{row.category}</td>
                <td>{row.type}</td>
                <td className="text-right">${row.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
