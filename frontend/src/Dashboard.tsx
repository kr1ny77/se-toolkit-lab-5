import { useEffect, useState } from 'react'
import { Bar, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
)

interface ScoreBucket {
  bucket: string
  count: number
}

interface TimelineEntry {
  date: string
  submissions: number
}

interface PassRateEntry {
  task: string
  avg_score: number
  attempts: number
}

export default function Dashboard() {
  const [labId, setLabId] = useState('lab-04')
  const [scores, setScores] = useState<ScoreBucket[]>([])
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [passRates, setPassRates] = useState<PassRateEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const apiKey = localStorage.getItem('api_key')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const headers = {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }

        const [scoresRes, timelineRes, passRatesRes] = await Promise.all([
          fetch(`/analytics/scores?lab=${labId}`, { headers }),
          fetch(`/analytics/timeline?lab=${labId}`, { headers }),
          fetch(`/analytics/pass-rates?lab=${labId}`, { headers })
        ])

        if (!scoresRes.ok || !timelineRes.ok || !passRatesRes.ok) {
          throw new Error('Failed to fetch data')
        }

        setScores(await scoresRes.json())
        setTimeline(await timelineRes.json())
        setPassRates(await passRatesRes.json())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [labId, apiKey])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  const barChartData = {
    labels: scores.map(s => s.bucket),
    datasets: [{
      label: 'Score Distribution',
      data: scores.map(s => s.count),
      backgroundColor: 'rgba(54, 162, 235, 0.5)'
    }]
  }

  const lineChartData = {
    labels: timeline.map(t => t.date),
    datasets: [{
      label: 'Submissions',
      data: timeline.map(t => t.submissions),
      borderColor: 'rgba(75, 192, 192, 1)',
      tension: 0.1
    }]
  }

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      
      <select value={labId} onChange={(e) => setLabId(e.target.value)}>
        <option value="lab-01">Lab 01</option>
        <option value="lab-02">Lab 02</option>
        <option value="lab-03">Lab 03</option>
        <option value="lab-04">Lab 04</option>
      </select>

      <div className="charts">
        <div>
          <h3>Score Distribution</h3>
          <Bar data={barChartData} />
        </div>
        <div>
          <h3>Submissions Timeline</h3>
          <Line data={lineChartData} />
        </div>
        <div>
          <h3>Pass Rates</h3>
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Avg Score</th>
                <th>Attempts</th>
              </tr>
            </thead>
            <tbody>
              {passRates.map((p, i) => (
                <tr key={i}>
                  <td>{p.task}</td>
                  <td>{p.avg_score}</td>
                  <td>{p.attempts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}