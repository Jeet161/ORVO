"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, ShoppingBag, Star, Package, Clock, Store, ChevronRight } from "lucide-react";
import Link from "next/link";

interface StatItem {
  label: string;
  value: string;
  code: string;
}

interface RecentOrder {
  id: string;
  items: string;
  amount: string;
  status: string;
  createdAt: string;
}

interface SellerOverviewProps {
  shopName: string;
  stats: StatItem[];
  recentOrders: RecentOrder[];
}

export function SellerOverview({ shopName, stats, recentOrders }: SellerOverviewProps) {
  // Web Audio D5 chord synthesis to simulate the enajori "new order sound check" on page mount
  useEffect(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
      gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      // ignore browser auto-play policy blocks
    }
  }, []);

  const getIcon = (code: string) => {
    switch (code) {
      case "revenue":
        return TrendingUp;
      case "items":
        return Package;
      case "orders":
        return ShoppingBag;
      case "rating":
        return Star;
      default:
        return Store;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        {stats.map((stat, i) => {
          const Icon = getIcon(stat.code);
          return (
            <motion.div
              key={stat.label}
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
                background: "rgba(49, 105, 78, 0.1)",
                color: "var(--orvo-primary)"
              }}>
                <Icon size={20} />
              </div>
              <div>
                <p style={{ fontSize: "11px", color: "var(--orvo-text-muted)", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>
                  {stat.label}
                </p>
                <p style={{ fontSize: "24px", fontWeight: 800, margin: "4px 0 0 0" }}>
                  {stat.value}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content Grid (Recent Orders & Performance Sidebars) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "28px" }} className="lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="glass lg:col-span-2" style={{ padding: "24px", borderRadius: "16px" }}>
          <h3 className="font-display" style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Clock size={20} style={{ color: "var(--orvo-primary)" }} /> Recent Orders
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {recentOrders.length === 0 ? (
              <p style={{ color: "var(--orvo-text-muted)", fontStyle: "italic", textAlign: "center", padding: "20px" }}>
                No recent orders recorded.
              </p>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)"
                }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>Order #{order.id.substring(0, 8).toUpperCase()}</h4>
                    <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "var(--orvo-text-muted)" }}>
                      {order.items} • {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: 0, fontWeight: 700, color: "var(--orvo-primary)" }}>{order.amount}</p>
                    <span className="badge badge-success" style={{ fontSize: "10px" }}>{order.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar Info & Performance */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Quick tips card */}
          <div className="glass" style={{ padding: "24px", borderRadius: "16px", background: "rgba(99, 130, 255, 0.03)" }}>
            <h4 className="font-display" style={{ fontSize: "16px", fontWeight: 700, color: "var(--orvo-primary)", marginBottom: "8px" }}>
              Seller Story Tip
            </h4>
            <p style={{ fontSize: "12px", color: "var(--orvo-text-muted)", lineHeight: 1.6 }}>
              High-quality product stories increase conversion by <span style={{ fontWeight: 700, fontStyle: "italic", color: "var(--orvo-text)" }}>45%</span>. Make sure to share the heritage behind each premium item.
            </p>
            <button style={{
              background: "none",
              border: "none",
              color: "var(--orvo-primary)",
              fontWeight: 700,
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "1px",
              cursor: "pointer",
              marginTop: "16px",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}>
              Learn More <ChevronRight size={12} />
            </button>
          </div>

          {/* Performance sliders */}
          <div className="glass" style={{ padding: "24px", borderRadius: "16px" }}>
            <h4 className="font-display" style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>
              Shop Performance
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[
                { label: "Profile Completion", value: 85 },
                { label: "Response Rate", value: 98 },
                { label: "Delivery Speed", value: 92 },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    <span style={{ color: "var(--orvo-text-muted)" }}>{item.label}</span>
                    <span style={{ color: "var(--orvo-primary)" }}>{item.value}%</span>
                  </div>
                  <div style={{ height: "4px", background: "rgba(49, 105, 78, 0.1)", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ height: "100%", background: "var(--orvo-primary)", width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
