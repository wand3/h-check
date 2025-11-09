import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useMemo } from 'react';
import type { FhirQueryResponse } from '../schemas/fhirResponse';

export function FhirQueryVisualizer({ data }: { data: FhirQueryResponse }) {
  const patients = data.processed_results.patients;

  const ageBuckets = useMemo(() => {
    const buckets: Record<string, number> = { '0-20': 0, '21-40': 0, '41-60': 0, '61+': 0 };
    patients.forEach((p) => {
      const a = p.age ?? 0;
      if (a <= 20) buckets['0-20']++;
      else if (a <= 40) buckets['21-40']++;
      else if (a <= 60) buckets['41-60']++;
      else buckets['61+']++;
    });
    return Object.entries(buckets).map(([name, count]) => ({ name, count }));
  }, [patients]);



  // const genderPie = useMemo(() => {
  //   const map: Record<string, number> = {};
  //   patients.forEach((p) => {
  //     const g = p.gender || 'unknown';
  //     map[g] = (map[g] || 0) + 1;
  //   });
  //   return Object.entries(map).map(([name, value]) => ({ name, value }));
  // }, [patients]);

  const COLORS = ['#4f46e5', '#f97316', '#10b981', '#ef4444'];

  /**
  * Custom Tooltip component for a clean, card-like appearance.
  * This is characteristic of the shadcn/ui chart examples.
  */
  const CustomTooltip = ({ active, payload, label } : any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const count = new Intl.NumberFormat().format(data.count);

      return (
        <div className="rounded-lg border bg-white/95 dark:bg-gray-800/95 p-2 shadow-lg backdrop-blur-sm">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{`Age Group: ${label}`}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {`${payload[0].name}: `}
            <span className="font-semibold text-blue-600 dark:text-blue-400">{count}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  /**
  * Custom Legend component for shadcn spacing and typography.
  */
  // const CustomLegend = (props: { payload: any; }) => {
  //     const { payload } = props;
  //     return (
  //         <ul className="flex justify-center space-x-41mt-4 text-sm text-gray-600 dark:text-gray-400">
  //             {payload.map((entry: { color: any; value: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }, index: any) => (
  //                 <li key={`item-${index}`} className="flex items-center space-x-3">
  //                     <span
  //                         className="w-2 h-2 rounded-full"
  //                         style={{ backgroundColor: entry.color }}
  //                     ></span>
  //                 </li>
  //             ))}
  //         </ul>
  //     );
  // };

  return (
    <div className="p-2 sm:p-3 my-1 h-max">

      <h3 className="font-sm mb-2">Query: {data.original_query}</h3>
      <p className="text-sm mb-4 text-gray-600">
        Total Patients: {data.processed_results.total_patients} | Execution Time: {data.execution_time}ms
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 px-1 md:p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
        {/* Patient Table */}
        {/* Responsive Patient Table/Card List (Span 2 columns on desktop) */}
        <div className="lg:col-span-2 bg-transparent dark:bg-gray-800 rounded-xl p-1 transition-all duration-300">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-50">Patient Details</h2>

            {/* --- 1. DESKTOP TABLE VIEW (Hidden on small screens) --- */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 border-b">
                        <tr>
                            <th scope="col" className="px-4 py-3 font-semibold">Name</th>
                            <th scope="col" className="px-4 py-3 font-semibold">Age</th>
                            <th scope="col" className="px-4 py-3 font-semibold">Gender</th>
                            <th scope="col" className="px-4 py-3 font-semibold">Conditions</th>
                        </tr>
                    </thead>
                    <tbody>
                    {patients.map((p) => (
                        <tr key={p.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                            <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap dark:text-white">{p.name}</td>
                            <td className="px-4 py-2">{p.age}</td>
                            <td className="px-4 py-2 capitalize">{p.gender}</td>
                            <td className="px-4 py-2">{p.conditions.join(', ')}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* --- 2. MOBILE CARD VIEW (Hidden on large screens) --- */}
            <div className="lg:hidden space-y-4">
                {patients.map((p) => (
                    <div key={p.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 shadow-md">
                        <div className="font-bold text-lg mb-2 text-green-600 dark:text-green-400">{p.name}</div>
                        
                        <div className="grid grid-cols-2 gap-y-1 text-sm">
                            <div className="font-medium text-gray-600 dark:text-gray-400">Age:</div>
                            <div className="text-gray-900 dark:text-gray-100">{p.age}</div>

                            <div className="font-medium text-gray-600 dark:text-gray-400">Gender:</div>
                            <div className="text-gray-900 dark:text-gray-100 capitalize">{p.gender}</div>

                            <div className="col-span-2 mt-2 font-medium text-gray-600 dark:text-gray-400">Conditions:</div>
                            <div className="col-span-2 text-gray-800 dark:text-gray-200">
                                {p.conditions.map((condition, index) => (
                                    <span key={index} className="text-wrap inline-flex bg-gray-100 dark:bg-gray-700 text-xs px-1 py-0.5 rounded-sm mr-2 mb-1">
                                        {condition}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

        </div>
        {/* Charts */}
        <div className="space-y-4">
          <div className="h-[350px]">         
            {/* <h4 className="font-bold text-base mb-2 text-blue-700">{data.fhir_query.filters.conditions} 'Patients' (Age {data.fhir_query.filters.age_filters})</h4> */}
            <div className="grid grid-cols-3 gap-2 text-xs font-mono mb-3">
                <div className="text-gray-600 font-medium">Total Count:</div>
                <div className="col-span-2 font-bold text-red-600">{data.processed_results.total_patients}</div>
            </div>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={ageBuckets} margin={{ top: 10, right: 0, left: -20, bottom: 5 }}>
              
              {/* X-Axis (Age Group Names) */}
              <XAxis 
                dataKey="name" 
                stroke="#64748b" // slate-500 for dark mode compatibility
                tickLine={false}
                axisLine={false}
                className="text-xs sm:text-sm"
              />
              
              {/* Y-Axis (Count) */}
              <YAxis 
                stroke="#64748b" // slate-500
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value / 1}`}
                className="text-xs sm:text-sm"
              />
              
              {/* Custom Tooltip */}
              <Tooltip content={<CustomTooltip />} />
              
              {/* Legend (using a custom styled legend) */}
              {/* <Legend content={<CustomLegend />} /> */}

              {/* Bar Definition */}
              <Bar 
                dataKey="count" 
                name="Patients" 
                // Customizing bar colors based on data
                fill="#3b82f6" // Default blue
                radius={[4, 4, 0, 0]} // Rounded top corners
              >
                {/* Dynamically assign color to each bar for visual interest */}
                {ageBuckets.map((_entry, index) => (
                    <Bar key={`bar-${index}`} dataKey="count" fill={COLORS[index]} name="Patients" />
                ))}
              </Bar>

            </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
