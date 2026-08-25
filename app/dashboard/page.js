"use client";

import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [message, setMessage] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const accessToken = localStorage.getItem("masago_access_token");
    const email = localStorage.getItem("masago_user_email");

    if (!accessToken) {
      window.location.href = "/login";
      return;
    }

    setUserEmail(email || "");
    setAuthChecking(false);

    loadReservations();
  }

  async function loadReservations() {
    try {
      const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL;

      const supabaseKey =
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(
        `${supabaseUrl}/rest/v1/reservations?select=*&order=id.desc`,
        {
          headers: {
            apikey: supabaseKey,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data);
        setMessage("Nu am putut încărca rezervările.");
        return;
      }

      setReservations(data);
    } catch (error) {
      console.error(error);
      setMessage("A apărut o eroare.");
    } finally {
      setLoading(false);
    }
  }

  async function updateReservation(id, newStatus) {
    setUpdatingId(id);
    setMessage("");

    try {
      const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL;

      const supabaseKey =
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(
        `${supabaseUrl}/rest/v1/reservations?id=eq.${id}`,
        {
          method: "PATCH",
          headers: {
            apikey: supabaseKey,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(errorText);
        setMessage("Nu am putut actualiza rezervarea.");
        return;
      }

      setReservations((currentReservations) =>
        currentReservations.map((reservation) =>
          reservation.id === id
            ? { ...reservation, status: newStatus }
            : reservation
        )
      );
    } catch (error) {
      console.error(error);
      setMessage("A apărut o eroare la actualizare.");
    } finally {
      setUpdatingId(null);
    }
  }

  function handleLogout() {
    localStorage.removeItem("masago_access_token");
    localStorage.removeItem("masago_refresh_token");
    localStorage.removeItem("masago_user_email");

    window.location.href = "/login";
  }

  function formatDate(date) {
    if (!date) return "";

    const [year, month, day] = date.split("-");

    return `${day}/${month}/${year}`;
  }

  function getStatusLabel(status) {
    if (status === "accepted") return "Confirmată";
    if (status === "rejected") return "Respinsă";
    return "În așteptare";
  }

  function getStatusStyle(status) {
    if (status === "accepted") {
      return {
        background: "#e8f7ee",
        color: "#147a3d",
      };
    }

    if (status === "rejected") {
      return {
        background: "#fdecec",
        color: "#b42318",
      };
    }

    return {
      background: "#fff4dd",
      color: "#9a6700",
    };
  }

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
        }}
      >
        Se verifică autentificarea...
      </main>
    );
  }

  return (
    <main
      style={{
        fontFamily: "Arial, sans-serif",
        background: "#f6f7f9",
        minHeight: "100vh",
        padding: "40px 6%",
        color: "#222",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "auto",
        }}
      >
        <div
          style={{
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

          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
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

            <button
              onClick={handleLogout}
              style={{
                border: "none",
                background: "#222",
                color: "white",
                borderRadius: "10px",
                padding: "11px 16px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Deconectare
            </button>
          </div>
        </div>

        {loading && <p>Se încarcă rezervările...</p>}

        {message && (
          <p
            style={{
              background: "#ffecec",
              padding: "15px",
              borderRadius: "10px",
              marginBottom: "20px",
            }}
          >
            {message}
          </p>
        )}

        {!loading && reservations.length === 0 && (
          <div
            style={{
              background: "white",
              padding: "30px",
              borderRadius: "15px",
            }}
          >
            Nu există rezervări momentan.
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

            return (
              <div
                key={reservation.id}
                style={{
                  background: "white",
                  padding: "22px",
                  borderRadius: "15px",
                  boxShadow:
                    "0 4px 15px rgba(0,0,0,0.06)",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(130px, 1fr))",
                    gap: "18px",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "13px", color: "#888" }}>
                      Client
                    </div>
                    <strong>
                      {reservation.customer_name}
                    </strong>
                  </div>

                  <div>
                    <div style={{ fontSize: "13px", color: "#888" }}>
                      Telefon
                    </div>
                    {reservation.customer_phone}
                  </div>

                  <div>
                    <div style={{ fontSize: "13px", color: "#888" }}>
                      Data
                    </div>
                    {formatDate(
                      reservation.reservation_date
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: "13px", color: "#888" }}>
                      Ora
                    </div>
                    {reservation.reservation_time}
                  </div>

                  <div>
                    <div style={{ fontSize: "13px", color: "#888" }}>
                      Persoane
                    </div>
                    {reservation.guests}
                  </div>

                  <div>
                    <div style={{ fontSize: "13px", color: "#888" }}>
                      Status
                    </div>

                    <span
                      style={{
                        display: "inline-block",
                        marginTop: "4px",
                        padding: "7px 10px",
                        borderRadius: "999px",
                        fontSize: "13px",
                        fontWeight: "bold",
                        ...statusStyle,
                      }}
                    >
                      {getStatusLabel(
                        reservation.status
                      )}
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
                    disabled={
                      updatingId === reservation.id
                    }
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
                    disabled={
                      updatingId === reservation.id
                    }
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
      </div>
    </main>
  );
}
