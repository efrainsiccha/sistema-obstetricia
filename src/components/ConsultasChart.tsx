import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  {
    dia: 'Lun',
    Prenatal: 12,
    Postparto: 5,
    Parto: 2,
  },
  {
    dia: 'Mar',
    Prenatal: 15,
    Postparto: 8,
    Parto: 3,
  },
  {
    dia: 'Mié',
    Prenatal: 10,
    Postparto: 6,
    Parto: 1,
  },
  {
    dia: 'Jue',
    Prenatal: 18,
    Postparto: 7,
    Parto: 4,
  },
  {
    dia: 'Vie',
    Prenatal: 14,
    Postparto: 9,
    Parto: 2,
  },
  {
    dia: 'Sáb',
    Prenatal: 8,
    Postparto: 4,
    Parto: 1,
  },
  {
    dia: 'Dom',
    Prenatal: 5,
    Postparto: 3,
    Parto: 1,
  },
];

export function ConsultasChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#fdd8e5" />
        <XAxis 
          dataKey="dia" 
          stroke="#846871"
          style={{ fontSize: '14px' }}
        />
        <YAxis 
          stroke="#846871"
          style={{ fontSize: '14px' }}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #fdd8e5',
            borderRadius: '8px',
            padding: '10px'
          }}
        />
        <Legend 
          wrapperStyle={{
            paddingTop: '20px',
            fontSize: '14px'
          }}
        />
        <Bar dataKey="Prenatal" fill="#d4588f" radius={[8, 8, 0, 0]} />
        <Bar dataKey="Postparto" fill="#f8a5c2" radius={[8, 8, 0, 0]} />
        <Bar dataKey="Parto" fill="#ff85a1" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
