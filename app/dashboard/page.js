"use client";

import { useEffect, useState } from "react";
import { useEffect, useMemo, useState } from "react";

export default function DashboardPage() {
  const [reservations, setReservations] = useState([]);
  const [restaurantName, setRestaurantName] = useState("Restaurant");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [message, setMessage] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    checkAuth();
@@ -24,19 +25,64 @@ export default function DashboardPage() {
    }

    setUserEmail(email || "");
    setAuthChecking(false);

    loadReservations(accessToken);
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      setMessage("Conexiunea cu Supabase nu este configurată.");
      setAuthChecking(false);
      setLoading(false);
      return;
    }

    try {
      await Promise.all([
        loadRestaurant(accessToken, supabaseUrl, supabaseKey),
        loadReservations(accessToken, supabaseUrl, supabaseKey),
      ]);
    } finally {
      setAuthChecking(false);
    }
  }

  async function loadReservations(accessToken) {
  async function loadRestaurant(accessToken, supabaseUrl, supabaseKey) {
    try {
      const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL;
      const response = await fetch(
        `${supabaseUrl}/rest/v1/restaurants?select=name&limit=1`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 401) {
        handleLogout();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        console.error(data);
        return;
      }

      const supabaseKey =
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if (data?.[0]?.name) {
        setRestaurantName(data[0].name);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function loadReservations(accessToken, supabaseUrl, supabaseKey) {
    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/reservations?select=*&order=id.desc`,
        {
@@ -47,13 +93,13 @@ export default function DashboardPage() {
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        handleLogout();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        console.error(data);
        setMessage("Nu am putut încărca rezervările.");
@@ -63,7 +109,7 @@ export default function DashboardPage() {
      setReservations(data);
    } catch (error) {
      console.error(error);
      setMessage("A apărut o eroare.");
      setMessage("A apărut o eroare la încărcarea rezervărilor.");
    } finally {
      setLoading(false);
    }
@@ -73,21 +119,21 @@ export default function DashboardPage() {
    setUpdatingId(id);
    setMessage("");

    try {
      const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

      const supabaseKey =
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

      const accessToken =
        localStorage.getItem("masago_access_token");
    const accessToken =
      localStorage.getItem("masago_access_token");

      if (!accessToken) {
        window.location.href = "/login";
        return;
      }
    if (!accessToken) {
      window.location.href = "/login";
      return;
    }

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/reservations?id=eq.${id}`,
        {
@@ -116,8 +162,8 @@ export default function DashboardPage() {
        return;
      }

      setReservations((currentReservations) =>
        currentReservations.map((reservation) =>
      setReservations((current) =>
        current.map((reservation) =>
          reservation.id === id
            ? { ...reservation, status: newStatus }
            : reservation
@@ -141,11 +187,20 @@ export default function DashboardPage() {

  function formatDate(date) {
    if (!date) return "";

    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  }

  function getTodayISO() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function getStatusLabel(status) {
    if (status === "accepted") return "Confirmată";
    if (status === "rejected") return "Respinsă";
@@ -155,34 +210,57 @@ export default function DashboardPage() {
  function getStatusStyle(status) {
    if (status === "accepted") {
      return {
        background: "#e8f7ee",
        color: "#147a3d",
        background: "#E9F8EF",
        color: "#177245",
      };
    }

    if (status === "rejected") {
      return {
        background: "#fdecec",
        color: "#b42318",
        background: "#FDECEC",
        color: "#B42318",
      };
    }

    return {
      background: "#fff4dd",
      color: "#9a6700",
      background: "#FFF4DD",
      color: "#946200",
    };
  }

  const stats = useMemo(() => {
    const today = getTodayISO();

    return {
      today: reservations.filter(
        (item) => item.reservation_date === today
      ).length,

      pending: reservations.filter(
        (item) => item.status === "pending"
      ).length,

      accepted: reservations.filter(
        (item) => item.status === "accepted"
      ).length,

      rejected: reservations.filter(
        (item) => item.status === "rejected"
      ).length,
    };
  }, [reservations]);

  if (authChecking) {
    return (
      <main
        style={{
          fontFamily: "Arial, sans-serif",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f6f7f9",
          background: "#FAFAF8",
          fontFamily: "Arial, sans-serif",
          color: "#172033",
        }}
      >
        Se verifică autentificarea...
@@ -193,257 +271,527 @@ export default function DashboardPage() {
  return (
    <main
      style={{
        fontFamily: "Arial, sans-serif",
        background: "#f6f7f9",
        minHeight: "100vh",
        padding: "40px 6%",
        color: "#222",
        background: "#F6F7F9",
        fontFamily: "Arial, sans-serif",
        color: "#172033",
      }}
    >
      <div
      {/* TOP BAR */}
      <header
        style={{
          maxWidth: "1100px",
          margin: "auto",
          background: "#172033",
          color: "white",
          padding: "18px 5%",
        }}
      >
        <div
          style={{
            maxWidth: "1250px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            marginBottom: "30px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 style={{ marginBottom: "5px" }}>
              Dashboard restaurant
            </h1>

            <p style={{ color: "#777", margin: 0 }}>
              Casa Bunicii
            </p>

            {userEmail && (
              <p
                style={{
                  color: "#999",
                  marginTop: "5px",
                  marginBottom: 0,
                  fontSize: "13px",
                }}
              >
                {userEmail}
              </p>
            )}
          </div>
          <a
            href="/"
            style={{
              color: "white",
              textDecoration: "none",
              fontWeight: "900",
              fontSize: "28px",
              letterSpacing: "-1px",
            }}
          >
            Masago<span style={{ color: "#FF5A3C" }}>.</span>
          </a>

          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <a
              href="/"
              style={{
                textDecoration: "none",
                color: "#555",
                padding: "10px 14px",
              }}
            >
              ← Înapoi la aplicație
            </a>
            {userEmail && (
              <span
                style={{
                  color: "#BCC5D3",
                  fontSize: "14px",
                }}
              >
                {userEmail}
              </span>
            )}

            <button
              onClick={handleLogout}
              style={{
                border: "none",
                background: "#222",
                border: "1px solid #3A465D",
                background: "#202C43",
                color: "white",
                borderRadius: "10px",
                padding: "11px 16px",
                fontWeight: "bold",
                padding: "10px 15px",
                fontWeight: "800",
                cursor: "pointer",
              }}
            >
              Deconectare
            </button>
          </div>
        </div>
      </header>

        {loading && <p>Se încarcă rezervările...</p>}
      <div
        style={{
          maxWidth: "1250px",
          margin: "0 auto",
          padding: "42px 5% 70px",
        }}
      >
        {/* INTRO */}
        <section
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "end",
            gap: "25px",
            flexWrap: "wrap",
            marginBottom: "30px",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                color: "#FF5A3C",
                textTransform: "uppercase",
                letterSpacing: "1px",
                fontSize: "13px",
                fontWeight: "900",
              }}
            >
              Dashboard restaurant
            </p>

        {message && (
          <p
            <h1
              style={{
                margin: "8px 0 8px",
                fontSize: "42px",
                letterSpacing: "-1.5px",
              }}
            >
              Bun venit, {restaurantName}
            </h1>

            <p
              style={{
                margin: 0,
                color: "#737C8D",
                fontSize: "17px",
              }}
            >
              Gestionează rezervările și confirmă solicitările clienților.
            </p>
          </div>

          <a
            href="/"
            style={{
              background: "#ffecec",
              padding: "15px",
              textDecoration: "none",
              color: "#172033",
              background: "white",
              border: "1px solid #E2E5E9",
              padding: "12px 16px",
              borderRadius: "10px",
              marginBottom: "20px",
              fontWeight: "800",
            }}
          >
            {message}
          </p>
        )}
            ← Vezi aplicația
          </a>
        </section>

        {/* STATS */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(190px, 1fr))",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          {[
            {
              label: "Rezervări azi",
              value: stats.today,
              icon: "📅",
            },
            {
              label: "În așteptare",
              value: stats.pending,
              icon: "⏳",
            },
            {
              label: "Confirmate",
              value: stats.accepted,
              icon: "✅",
            },
            {
              label: "Respinse",
              value: stats.rejected,
              icon: "❌",
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "white",
                border: "1px solid #E7E9ED",
                borderRadius: "18px",
                padding: "22px",
                boxShadow: "0 8px 25px rgba(23,32,51,0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    color: "#737C8D",
                    fontWeight: "700",
                    fontSize: "14px",
                  }}
                >
                  {item.label}
                </span>

                <span style={{ fontSize: "21px" }}>
                  {item.icon}
                </span>
              </div>

        {!loading && reservations.length === 0 && (
              <div
                style={{
                  marginTop: "12px",
                  fontSize: "36px",
                  fontWeight: "900",
                  letterSpacing: "-1px",
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </section>

        {/* RESERVATIONS */}
        <section>
          <div
            style={{
              background: "white",
              padding: "30px",
              borderRadius: "15px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "20px",
              marginBottom: "18px",
            }}
          >
            Nu există rezervări momentan.
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "28px",
                }}
              >
                Rezervări
              </h2>

              <p
                style={{
                  margin: "6px 0 0",
                  color: "#818997",
                }}
              >
                Cele mai noi rezervări apar primele.
              </p>
            </div>

            <div
              style={{
                background: "#172033",
                color: "white",
                borderRadius: "999px",
                padding: "9px 13px",
                fontWeight: "800",
                fontSize: "13px",
              }}
            >
              {reservations.length} total
            </div>
          </div>
        )}

        <div
          style={{
            display: "grid",
            gap: "15px",
          }}
        >
          {reservations.map((reservation) => {
            const statusStyle = getStatusStyle(
              reservation.status
            );
          {message && (
            <div
              style={{
                background: "#FFF0EC",
                border: "1px solid #FFD8CF",
                color: "#A33A29",
                padding: "15px",
                borderRadius: "12px",
                marginBottom: "18px",
                fontWeight: "700",
              }}
            >
              {message}
            </div>
          )}

          {loading && (
            <div
              style={{
                background: "white",
                borderRadius: "18px",
                border: "1px solid #E7E9ED",
                padding: "30px",
              }}
            >
              Se încarcă rezervările...
            </div>
          )}

            return (
          {!loading && reservations.length === 0 && (
            <div
              style={{
                background: "white",
                borderRadius: "18px",
                border: "1px solid #E7E9ED",
                padding: "45px 30px",
                textAlign: "center",
              }}
            >
              <div
                key={reservation.id}
                style={{
                  background: "white",
                  padding: "22px",
                  borderRadius: "15px",
                  boxShadow:
                    "0 4px 15px rgba(0,0,0,0.06)",
                  fontSize: "42px",
                  marginBottom: "12px",
                }}
              >
                📭
              </div>

              <h3
                style={{
                  margin: "0 0 8px",
                }}
              >
                <div
                Nu există rezervări momentan
              </h3>

              <p
                style={{
                  margin: 0,
                  color: "#818997",
                }}
              >
                Rezervările noi vor apărea aici.
              </p>
            </div>
          )}

          <div
            style={{
              display: "grid",
              gap: "16px",
            }}
          >
            {reservations.map((reservation) => {
              const statusStyle = getStatusStyle(
                reservation.status
              );

              return (
                <article
                  key={reservation.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(130px, 1fr))",
                    gap: "18px",
                    alignItems: "center",
                    background: "white",
                    border: "1px solid #E7E9ED",
                    borderRadius: "18px",
                    padding: "22px",
                    boxShadow:
                      "0 8px 25px rgba(23,32,51,0.045)",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "13px", color: "#888" }}>
                      Client
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(135px, 1fr))",
                      gap: "18px",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={smallLabel}>
                        Client
                      </div>

                      <strong
                        style={{
                          fontSize: "17px",
                        }}
                      >
                        {reservation.customer_name}
                      </strong>
                    </div>
                    <strong>{reservation.customer_name}</strong>
                  </div>

                  <div>
                    <div style={{ fontSize: "13px", color: "#888" }}>
                      Telefon
                    <div>
                      <div style={smallLabel}>
                        Telefon
                      </div>

                      <span>
                        {reservation.customer_phone}
                      </span>
                    </div>
                    {reservation.customer_phone}
                  </div>

                  <div>
                    <div style={{ fontSize: "13px", color: "#888" }}>
                      Data
                    <div>
                      <div style={smallLabel}>
                        Data
                      </div>

                      <strong>
                        {formatDate(
                          reservation.reservation_date
                        )}
                      </strong>
                    </div>
                    {formatDate(reservation.reservation_date)}
                  </div>

                  <div>
                    <div style={{ fontSize: "13px", color: "#888" }}>
                      Ora
                    <div>
                      <div style={smallLabel}>
                        Ora
                      </div>

                      <strong>
                        {reservation.reservation_time}
                      </strong>
                    </div>
                    {reservation.reservation_time}
                  </div>

                  <div>
                    <div style={{ fontSize: "13px", color: "#888" }}>
                      Persoane
                    <div>
                      <div style={smallLabel}>
                        Persoane
                      </div>

                      <strong>
                        {reservation.guests}
                      </strong>
                    </div>
                    {reservation.guests}
                  </div>

                  <div>
                    <div style={{ fontSize: "13px", color: "#888" }}>
                      Status
                    <div>
                      <div style={smallLabel}>
                        Status
                      </div>

                      <span
                        style={{
                          display: "inline-block",
                          marginTop: "2px",
                          padding: "8px 11px",
                          borderRadius: "999px",
                          fontSize: "13px",
                          fontWeight: "900",
                          ...statusStyle,
                        }}
                      >
                        {getStatusLabel(
                          reservation.status
                        )}
                      </span>
                    </div>
                  </div>

                    <span
                  {reservation.status === "pending" && (
                    <div
                      style={{
                        display: "inline-block",
                        marginTop: "4px",
                        padding: "7px 10px",
                        borderRadius: "999px",
                        fontSize: "13px",
                        fontWeight: "bold",
                        ...statusStyle,
                        marginTop: "20px",
                        paddingTop: "18px",
                        borderTop: "1px solid #EEF0F2",
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                      }}
                    >
                      {getStatusLabel(reservation.status)}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginTop: "20px",
                  }}
                >
                  <button
                    onClick={() =>
                      updateReservation(
                        reservation.id,
                        "accepted"
                      )
                    }
                    disabled={updatingId === reservation.id}
                    style={{
                      flex: 1,
                      border: "none",
                      padding: "12px",
                      borderRadius: "10px",
                      background: "#18794e",
                      color: "white",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    ✅ Acceptă
                  </button>

                  <button
                    onClick={() =>
                      updateReservation(
                        reservation.id,
                        "rejected"
                      )
                    }
                    disabled={updatingId === reservation.id}
                    style={{
                      flex: 1,
                      border: "none",
                      padding: "12px",
                      borderRadius: "10px",
                      background: "#c9362b",
                      color: "white",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    ❌ Respinge
                  </button>
                </div>
              </div>
            );
          })}
        </div>
                      <button
                        onClick={() =>
                          updateReservation(
                            reservation.id,
                            "accepted"
                          )
                        }
                        disabled={
                          updatingId === reservation.id
                        }
                        style={{
                          flex: "1 1 180px",
                          border: "none",
                          borderRadius: "10px",
                          padding: "12px 15px",
                          background: "#16865C",
                          color: "white",
                          fontWeight: "900",
                          cursor: "pointer",
                        }}
                      >
                        ✅ Acceptă rezervarea
                      </button>

                      <button
                        onClick={() =>
                          updateReservation(
                            reservation.id,
                            "rejected"
                          )
                        }
                        disabled={
                          updatingId === reservation.id
                        }
                        style={{
                          flex: "1 1 180px",
                          border: "1px solid #E1E4E8",
                          borderRadius: "10px",
                          padding: "12px 15px",
                          background: "white",
                          color: "#B42318",
                          fontWeight: "900",
                          cursor: "pointer",
                        }}
                      >
                        Respinge
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

const smallLabel = {
  fontSize: "12px",
  color: "#8A92A0",
  marginBottom: "5px",
  fontWeight: "700",
  textTransform: "uppercase",
  letterSpacing: "0.4px",
};
