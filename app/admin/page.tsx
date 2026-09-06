"use client"
export const runtime = 'edge'

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchAllOrders, fetchProducts, fetchAllUsers } from "@/lib/d1-client"
import { ShoppingCart, Users, Package, TrendingUp } from "lucide-react"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    orders: 0,
    products: 0,
    users: 0,
    revenue: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [orders, products, users] = await Promise.all([
          fetchAllOrders(),
          fetchProducts(),
          fetchAllUsers()
        ])

        const revenue = orders
          .filter((order: any) => order.status === "paid" || order.status === "completed")
          .reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0)

        setStats({
          orders: orders.length,
          products: products.length,
          users: users.length,
          revenue
        })
      } catch (error) {
        console.error("Error loading stats:", error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
           {loading ? "..." : value}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Revenue" 
          value={`₹${stats.revenue.toLocaleString('en-IN')}`} 
          icon={TrendingUp} 
          color="text-green-500" 
        />
        <StatCard 
          title="Orders" 
          value={stats.orders} 
          icon={ShoppingCart} 
          color="text-blue-500" 
        />
        <StatCard 
          title="Products" 
          value={stats.products} 
          icon={Package} 
          color="text-orange-500" 
        />
        <StatCard 
          title="Active Users" 
          value={stats.users} 
          icon={Users} 
          color="text-purple-500" 
        />
      </div>

      {/* Recent Activity Section Placeholder */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
             <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Chart Placeholder
             </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
               <p className="text-sm text-muted-foreground">Activity feed coming soon...</p>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}