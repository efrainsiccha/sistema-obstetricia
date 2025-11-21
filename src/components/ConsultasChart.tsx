import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

// Definimos la estructura de los datos que espera el gráfico
interface ChartData {
  name: string; // Ej: "Lun", "Mar"
  Prenatal: number;
  Postparto: number;
  Planificacion: number;
  Otro: number;
}

interface Props {
  data: ChartData[];
}

export function ConsultasChart({ data }: Props) {
  // Si no hay datos, mostramos un mensaje o un gráfico vacío
  if (!data || data.length === 0) {
    return <div className="h-[300px] flex items-center justify-center text-muted-foreground">Cargando datos...</div>;
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#6b7280', fontSize: 12 }}
          />
          <Tooltip 
            cursor={{ fill: '#fce7f3', opacity: 0.5 }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
          
          {/* Barras apiladas o agrupadas. Aquí las ponemos agrupadas para comparar mejor */}
          <Bar dataKey="Prenatal" fill="#db2777" radius={[4, 4, 0, 0]} name="Prenatal" />
          <Bar dataKey="Postparto" fill="#f472b6" radius={[4, 4, 0, 0]} name="Postparto" />
          <Bar dataKey="Planificacion" fill="#fb7185" radius={[4, 4, 0, 0]} name="Planificación" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}