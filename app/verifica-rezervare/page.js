"use client";

import { useEffect, useState } from "react";

export default function VerificaRezervarePage() {
  const [code, setCode] = useState("");
  const [reservation, setReservation] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedCode =
      localStorage.getItem("masago_last_reservation_code");

    if (savedCode) {
      setCode(savedCode);
      checkReservationByCode(savedCode);
    }
  }, []);

  function formatDate(date) {
    if (!date) return "";

    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  }

  function getStatusData(status) {
    if (status === "accepted") {
      return {
        title: "Rezervare confirmată",
        text: "Restaurantul a confirmat rezervarea ta.",
        icon: "✓",
        background: "#E9F8EF",
        color: "#16865C",
      };
    }

    if (status === "rejected") {
      return {
        title: "Rezervare respinsă",
        text: "Restaurantul nu a putut confirma această rezervare.",
        icon: "✕",
        background: "#FDECEC",
        color: "#B42318",
      };
    }

    return {
      title: "În așteptare",
      text: "Restaurantul nu a răspuns încă solicitării tale.",
      icon: "⏳",
      background: "#FFF4DD",
      color: "#8A6500",
    };
  }

  async function checkReservationByCode(reservationCode) {
    const cleanCode =
      reservationCode.trim().toUpperCase();

    if (!cleanCode) {
      setMessage("Introdu codul rezervării.");
      return;
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      setMessage("Conexiunea cu Supabase nu este configurată.");
      return;
    }

    setLoading(true);
    setMessage("");
    setReservation(null);

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/rpc/get_reservation_by_code`,
        {
          method: "POST",

          headers: {
            apikey: supabaseKey,
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            p_code: cleanCode,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data);
        setMessage("Nu am putut verifica rezervarea.");
        return;
      }

      if (!data || data.length === 0) {
        setMessage(
          "Nu am găsit nicio rezervare cu acest cod."
        );
        return;
      }

      setReservation(data[0]);
    } catch (error) {
      console.error(error);
      setMessage("A apărut o eroare la verificare.");
    } finally {
      setLoading(false);
    }
  }

  async function checkReservation(e) {
    e.preventDefault();
    await checkReservationByCode(code);
  }

  const statusData = reservation
    ? getStatusData(reservation.status)
    : null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#FAFAF8",
        fontFamily: "Arial, sans-serif",
        color: "#172033",
      }}
    >
      <header
        style={{
          background: "white",
          borderBottom: "1px solid #ececec",
          padding: "18px 6%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <a
          href="/"
          style={{
            textDecoration: "none",
            color: "#172033",
            fontSize: "29px",
            fontWeight: "900",
            letterSpacing: "-1px",
          }}
        >
          Masago<span style={{ color: "#FF5A3C" }}>.</span>
        </a>

        <a
          href="/"
          style={{
            textDecoration: "none",
            color: "#485267",
            fontWeight: "700",
          }}
        >
          ← Înapoi
        </a>
      </header>

      <section
        style={{
          padding: "75px 6%",
        }}
      >
        <div
          style={{
            maxWidth: "650px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: "30px",
            }}
          >
            <p
              style={{
                color: "#FF5A3C",
                fontWeight: "900",
                textTransform: "uppercase",
                letterSpacing: "1px",
                fontSize: "13px",
              }}
            >
              Rezervarea mea
            </p>

            <h1
              style={{
                fontSize: "42px",
                margin: "8px 0",
              }}
            >
              Statusul rezervării
            </h1>

            <p
              style={{
                color: "#737C8D",
                lineHeight: 1.6,
              }}
            >
              Ultima ta rezervare este încărcată automat.
            </p>
          </div>

          <div
            style={{
              background: "white",
              border: "1px solid #E7E9ED",
              borderRadius: "22px",
              padding: "30px",
            }}
          >
            <form onSubmit={checkReservation}>
              <label
                style={{
                  display: "block",
                  fontWeight: "800",
                  marginBottom: "8px",
                }}
              >
                Cod rezervare
              </label>

              <input
                type="text"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.toUpperCase())
                }
                placeholder="MASAGO-ABC12345"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid #DDE1E6",
                  fontSize: "17px",
                  fontWeight: "700",
                  letterSpacing: "1px",
                }}
              />

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  marginTop: "14px",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "none",
                  background: loading
                    ? "#aaa"
                    : "#FF5A3C",
                  color: "white",
                  fontWeight: "900",
                }}
              >
                {loading
                  ? "Se verifică..."
                  : "Actualizează statusul"}
              </button>
            </form>

            {message && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "14px",
                  borderRadius: "11px",
                  background: "#FFF0EC",
                  color: "#A33A29",
                  fontWeight: "800",
                  textAlign: "center",
                }}
              >
                {message}
              </div>
            )}

            {reservation && statusData && (
              <div
                style={{
                  marginTop: "28px",
                }}
              >
                <div
                  style={{
                    background: statusData.background,
                    color: statusData.color,
                    borderRadius: "16px",
                    padding: "22px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "34px",
                    }}
                  >
                    {statusData.icon}
                  </div>

                  <h2>
                    {statusData.title}
                  </h2>

                  <p>
                    {statusData.text}
                  </p>
                </div>

                <div
                  style={{
                    marginTop: "20px",
                    border: "1px solid #E7E9ED",
                    borderRadius: "16px",
                    overflow: "hidden",
                  }}
                >
                  <div style={rowStyle}>
                    <span style={rowLabel}>
                      Restaurant
                    </span>
                    <strong>
                      {reservation.restaurant_name}
                    </strong>
                  </div>

                  <div style={rowStyle}>
                    <span style={rowLabel}>
                      Data
                    </span>
                    <strong>
                      {formatDate(
                        reservation.reservation_date
                      )}
                    </strong>
                  </div>

                  <div style={rowStyle}>
                    <span style={rowLabel}>
                      Ora
                    </span>
                    <strong>
                      {reservation.reservation_time}
                    </strong>
                  </div>

                  <div style={rowStyle}>
                    <span style={rowLabel}>
                      Persoane
                    </span>
                    <strong>
                      {reservation.guests}
                    </strong>
                  </div>

                  <div
                    style={{
                      ...rowStyle,
                      borderBottom: "none",
                    }}
                  >
                    <span style={rowLabel}>
                      Cod
                    </span>
                    <strong>
                      {reservation.reservation_code}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

const rowStyle = {
  padding: "15px 17px",
  display: "flex",
  justifyContent: "space-between",
  gap: "20px",
  borderBottom: "1px solid #EEF0F2",
};

const rowLabel = {
  color: "#7A8393",
  fontWeight: "700",
};
