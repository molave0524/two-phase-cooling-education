'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import styles from './RevenueChart.module.css'

interface RevenueData {
  date: string
  revenue: number
  orders: number
}

interface RevenueChartProps {
  data: RevenueData[]
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString()}`
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className={styles.container}>
      <ResponsiveContainer width='100%' height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
          <XAxis
            dataKey='date'
            tickFormatter={formatDate}
            stroke='#6b7280'
            style={{ fontSize: '12px' }}
          />
          <YAxis
            yAxisId='left'
            tickFormatter={formatCurrency}
            stroke='#6b7280'
            style={{ fontSize: '12px' }}
          />
          <YAxis
            yAxisId='right'
            orientation='right'
            stroke='#6b7280'
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === 'revenue') return [formatCurrency(value), 'Revenue']
              return [value, 'Orders']
            }}
            labelFormatter={formatDate}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px 12px',
            }}
          />
          <Legend />
          <Line
            yAxisId='left'
            type='monotone'
            dataKey='revenue'
            stroke='#10b981'
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
            name='Revenue'
          />
          <Line
            yAxisId='right'
            type='monotone'
            dataKey='orders'
            stroke='#3b82f6'
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
            name='Orders'
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
