"use client";

import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadReservations();
  }, []);

  async function loadReservations() {
    try {
      const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL;

      const supabaseKey =
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(
        `${supabaseUrl}/rest/v1/reservations?select=*&order=created_at.desc`,
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

  function formatDate(date) {
    if (!date) return "";

    const [year, month, day] = date.split("-");

    return `${day}/${month}/${year}`;
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
            marginBottom: "30px",
          }}
        >
          <div>
            <h1 style={{ marginBottom: "5px" }}>
              Dashboard restaurant
            </h1>

            <p style={{ color: "#777", margin: 0 }}>
              Casa Bunicii
            </p>
          </div>

          <a
            href="/"
            style={{
              textDecoration: "none",
              color: "#555",
            }}
          >
            ← Înapoi la aplicație
          </a>
        </div>

        {loading && (
          <p>Se încarcă rezervările...</p>
        )}

        {message && (
          <p
            style={{
              background: "#ffecec",
              padding: "15px",
              borderRadius: "10px",
            }}
          >
            {message}
          </p>
        )}

        {!loading &&
          reservations.length === 0 && (
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
          {reservations.map((reservation) => (
            <div
              key={reservation.id}
              style={{
                background: "white",
                padding: "22px",
                borderRadius: "15px",
                boxShadow:
                  "0 4px 15px rgba(0,0,0,0.06)",
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "15px",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#888",
                  }}
                >
                  Client
                </div>

                <strong>
                  {reservation.customer_name}
                </strong>
              </div>

              <div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#888",
                  }}
                >
                  Telefon
                </div>

                {reservation.customer_phone}
              </div>

              <div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#888",
                  }}
                >
                  Data
                </div>

                {formatDate(
                  reservation.reservation_date
                )}
              </div>

              <div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#888",
                  }}
                >
                  Ora
                </div>

                {reservation.reservation_time}
              </div>

              <div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#888",
                  }}
                >
                  Persoane
                </div>

                {reservation.guests}
              </div>

              <div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#888",
                  }}
                >
                  Status
                </div>

                <strong>
                  {reservation.status || "pending"}
                </strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
