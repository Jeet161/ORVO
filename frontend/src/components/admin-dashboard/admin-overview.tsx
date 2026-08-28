"use client";

import { motion } from "framer-motion";
import { Users, ShoppingBag, Package, Store, TrendingUp, DollarSign } from "lucide-react";

interface Stats {
  totalUsers: number;
  totalSellers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

interface RecentOrder {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  userName: string | null;
}

interface AdminOverviewProps {
  stats: Stats;
  recentOrders: RecentOrder[];
  pendingProducts: number;
  pendingSellers: number;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "rgba(245, 158, 11, 0.15) text-warning border-warning",
  CONFIRMED: "rgba(59, 130, 246, 0.15) text-info border-info",
  SHIPPED: "rgba(124, 58, 237, 0.15) text-primary border-primary",
  DELIVERED: "rgba(34, 197, 94, 0.15) text-success border-success",
  CANCELLED: "rgba(239, 68, 68, 0.15) text-danger border-danger",
};

export function AdminOverview({ stats, recentOrders, pendingProducts, pendingSellers }: AdminOverviewProps) {
  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "var(--orvo-primary-light)",
      bg: "rgba(88, 101, 242, 0.1)",
    },
    {
      label: "Active Sellers",
      value: stats.totalSellers,
      icon: Store,
      color: "var(--orvo-accent-light)",
      bg: "rgba(0, 212, 170, 0.1)",
    },
    {
      label: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      color: "#a855f7",
      bg: "rgba(168, 85, 247, 0.1)",
    },
    {
      label: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: "#22c55e",
      bg: "rgba(34, 197, 94, 0.1)",
    },
    {
      label: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString("en-IN")}`,
      icon: DollarSign,
      color: "#eab308",
      bg: "rgba(234, 179, 8, 0.1)",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Alert Badges */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        {pendingProducts > 0 && (
          <span className="badge badge-warning" style={{ padding: "8px 14px", borderRadius: "20px" }}>
            ⚠️ {pendingProducts} products awaiting approval
          </span>
        )}
        {pendingSellers > 0 && (
          <span className="badge badge-warning" style={{ padding: "8px 14px", borderRadius: "20px" }}>
            ⏳ {pendingSellers} sellers awaiting verification
          </span>
        )}
        {pendingProducts === 0 && pendingSellers === 0 && (
          <span className="badge badge-success" style={{ padding: "8px 14px", borderRadius: "20px" }}>
            ✨ All clear — no pending approvals
          </span>
        )}
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass"
              style={{ padding: "20px", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: card.bg,
                color: card.color
              }}>
                <Icon size={20} />
              </div>
              <div>
                <p style={{ fontSize: "11px", color: "var(--orvo-text-muted)", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>
                  {card.label}
                </p>
                <p style={{ fontSize: "24px", fontWeight: 800, margin: "4px 0 0 0" }}>
                  {card.value}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Orders Table */}
      <div className="glass" style={{ padding: "24px", borderRadius: "16px" }}>
        <h3 className="font-display" style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <TrendingUp size={20} style={{ color: "var(--orvo-primary-light)" }} /> Recent Orders
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--orvo-border)", textAlign: "left" }}>
                <th style={{ padding: "12px 8px", color: "var(--orvo-text-muted)", fontWeight: 600 }}>Order ID</th>
                <th style={{ padding: "12px 8px", color: "var(--orvo-text-muted)", fontWeight: 600 }}>Customer</th>
                <th style={{ padding: "12px 8px", color: "var(--orvo-text-muted)", fontWeight: 600 }}>Amount</th>
                <th style={{ padding: "12px 8px", color: "var(--orvo-text-muted)", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "12px 8px", color: "var(--orvo-text-muted)", fontWeight: 600 }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "24px", color: "var(--orvo-text-muted)", fontStyle: "italic" }}>
                    No recent orders.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "12px 8px", fontFamily: "monospace" }}>#{order.id.slice(-8).toUpperCase()}</td>
                    <td style={{ padding: "12px 8px" }}>{order.userName || "Guest"}</td>
                    <td style={{ padding: "12px 8px", fontWeight: 700 }}>₹{order.totalAmount.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "12px 8px" }}>
                      <span className={`badge ${order.status === "DELIVERED" ? "badge-success" : "badge-warning"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 8px", color: "var(--orvo-text-muted)" }}>
                      {new Date(order.createdAt).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
