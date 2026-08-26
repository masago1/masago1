"use client";

import { useState } from "react";

export default function RestaurantPage() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:00");
  const [guests, setGuests] = useState("2");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReservation() {
    setMessage("");

    if (!date) {
      setMessage("Alege data rezervării.");
      return;
    }

    if (!time) {
      setMessage("Alege ora rezervării.");
      return;
    }

    if (!name.trim()) {
      setMessage("Introdu numele.");
      return;
    }

    if (!phone.trim()) {
      setMessage("Introdu numărul de telefon.");
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

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/reservations`,
        {
          method: "POST",
          headers: {
            apikey: supabaseKey,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            restaurant_name: "Casa Bunicii",
            reservation_date: date,
            reservation_time: time,
            guests: Number(guests),
            customer_name: name.trim(),
            customer_phone: phone.trim(),
            status: "pending",
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Supabase error:", errorText);
        setMessage(`Eroare Supabase: ${errorText}`);
        return;
      }

      setMessage("✅ Rezervarea a fost trimisă cu succes!");

      setDate("");
      setTime("19:00");
      setGuests("2");
      setName("");
      setPhone("");
    } catch (error) {
      console.error(error);
      setMessage(`Eroare: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  function formatDateRomanian(value) {
    if (!value) return "";
    return value.split("-").reverse().join("/");
  }

  const fieldStyle = {
    marginBottom: "18px",
  };

  const labelStyle = {
    display: "block",
    fontWeight: "800",
    marginBottom: "8px",
    color: "#172033",
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "15px 16px",
    border: "1px solid #dfe3e8",
    borderRadius: "12px",
    fontSize: "16px",
    background: "white",
    color: "#172033",
    outline: "none",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#FAFAF8",
        fontFamily: "Arial, sans-serif",
        color: "#172033",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          background: "white",
          borderBottom: "1px solid #ececec",
          padding: "18px 6%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 20,
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
          ← Înapoi la restaurante
        </a>
      </header>

      {/* HERO */}
      <section
        style={{
          background:
            "linear-gradient(135deg, #172033 0%, #202C43 100%)",
          color: "white",
          padding: "55px 6%",
        }}
      >
        <div
          style={{
            maxWidth: "1180px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "35px",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-block",
                background: "rgba(255,90,60,0.16)",
                color: "#FF8A73",
                border: "1px solid rgba(255,90,60,0.35)",
                borderRadius: "999px",
                padding: "8px 12px",
                fontSize: "14px",
                fontWeight: "800",
                marginBottom: "18px",
              }}
            >
              Românesc • Timișoara
            </div>

            <h1
              style={{
                fontSize: "clamp(44px, 6vw, 66px)",
                margin: 0,
                letterSpacing: "-2px",
              }}
            >
              Casa Bunicii
            </h1>

            <p
              style={{
                fontSize: "18px",
                color: "#cbd2dd",
                lineHeight: 1.6,
                maxWidth: "600px",
              }}
            >
              Bucătărie românească și preparate tradiționale,
              cu oferte disponibile în anumite intervale.
            </p>

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                marginTop: "22px",
              }}
            >
              <span
                style={{
                  background: "white",
                  color: "#172033",
                  padding: "10px 13px",
                  borderRadius: "10px",
                  fontWeight: "800",
                }}
              >
                ⭐ 9.2
              </span>

              <span
                style={{
                  background: "#FF5A3C",
                  color: "white",
                  padding: "10px 13px",
                  borderRadius: "10px",
                  fontWeight: "900",
                }}
              >
                -30% reducere
              </span>
            </div>
          </div>

          <div
            style={{
              height: "320px",
              borderRadius: "22px",
              background:
                "linear-gradient(135deg, #2b3448, #151c2b)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "110px",
              border: "1px solid #334057",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}
          >
            🍲
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
          padding: "55px 6% 80px",
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "30px",
          alignItems: "start",
        }}
      >
        {/* LEFT */}
        <div>
          <div
            style={{
              background: "white",
              border: "1px solid #ebedf0",
              borderRadius: "20px",
              padding: "28px",
              boxShadow: "0 10px 30px rgba(23,32,51,0.05)",
              marginBottom: "22px",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                fontSize: "26px",
              }}
            >
              Despre Casa Bunicii
            </h2>

            <p
              style={{
                color: "#667085",
                lineHeight: 1.7,
              }}
            >
              Casa Bunicii este listat în Masago pentru rezervări
              cu reducere în intervalele disponibile.
            </p>

            <div
              style={{
                display: "grid",
                gap: "14px",
                marginTop: "22px",
              }}
            >
              <div>
                <strong>📍 Locație</strong>
                <div style={{ color: "#667085", marginTop: "4px" }}>
                  Timișoara
                </div>
              </div>

              <div>
                <strong>🍽️ Tip</strong>
                <div style={{ color: "#667085", marginTop: "4px" }}>
                  Bucătărie românească
                </div>
              </div>

              <div>
                <strong>⭐ Evaluare</strong>
                <div style={{ color: "#667085", marginTop: "4px" }}>
                  9.2
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              background: "#FFF0EC",
              border: "1px solid #FFD8CF",
              borderRadius: "20px",
              padding: "28px",
            }}
          >
            <div
              style={{
                color: "#FF5A3C",
                fontWeight: "900",
                fontSize: "34px",
                marginBottom: "8px",
              }}
            >
              -30%
            </div>

            <h3
              style={{
                margin: "0 0 10px",
                fontSize: "22px",
              }}
            >
              Oferta Masago
            </h3>

            <p
              style={{
                margin: 0,
                color: "#5f6777",
                lineHeight: 1.6,
              }}
            >
              Reducerea se aplică la nota de plată conform
              condițiilor restaurantului și intervalului rezervat.
            </p>
          </div>
        </div>

        {/* BOOKING CARD */}
        <div
          style={{
            background: "white",
            border: "1px solid #ebedf0",
            borderRadius: "22px",
            padding: "30px",
            boxShadow: "0 18px 45px rgba(23,32,51,0.08)",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#FF5A3C",
              fontWeight: "900",
              fontSize: "13px",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Rezervare
          </p>

          <h2
            style={{
              fontSize: "30px",
              margin: "7px 0 8px",
            }}
          >
            Rezervă o masă
          </h2>

          <p
            style={{
              color: "#737c8d",
              marginTop: 0,
              marginBottom: "28px",
            }}
          >
            Completează detaliile și trimitem rezervarea către
            restaurant.
          </p>

          <div style={fieldStyle}>
            <label style={labelStyle}>Data rezervării</label>

            <input
              type="date"
              value={date}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setDate(e.target.value)}
              style={inputStyle}
            />

            {date && (
              <div
                style={{
                  marginTop: "7px",
                  color: "#7a8393",
                  fontSize: "14px",
                }}
              >
                Data selectată:{" "}
                <strong>{formatDateRomanian(date)}</strong>
              </div>
            )}
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Ora</label>

            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              style={inputStyle}
            >
              <option value="18:00">18:00</option>
              <option value="18:30">18:30</option>
              <option value="19:00">19:00</option>
              <option value="19:30">19:30</option>
              <option value="20:00">20:00</option>
              <option value="20:30">20:30</option>
              <option value="21:00">21:00</option>
              <option value="21:30">21:30</option>
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Număr de persoane</label>

            <select
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              style={inputStyle}
            >
              <option value="1">1 persoană</option>
              <option value="2">2 persoane</option>
              <option value="3">3 persoane</option>
              <option value="4">4 persoane</option>
              <option value="5">5 persoane</option>
              <option value="6">6 persoane</option>
              <option value="7">7 persoane</option>
              <option value="8">8 persoane</option>
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Nume</label>

            <input
              type="text"
              placeholder="Numele tău"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Număr de telefon</label>

            <input
              type="tel"
              placeholder="07xxxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={inputStyle}
            />
          </div>

          <button
            onClick={handleReservation}
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "5px",
              border: "none",
              borderRadius: "12px",
              padding: "16px",
              background: loading ? "#aeb4bf" : "#FF5A3C",
              color: "white",
              fontSize: "17px",
              fontWeight: "900",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading
                ? "none"
                : "0 10px 24px rgba(255,90,60,0.22)",
            }}
          >
            {loading ? "Se trimite..." : "Rezervă masa"}
          </button>

          {message && (
            <div
              style={{
                marginTop: "20px",
                padding: "14px",
                borderRadius: "11px",
                background: message.includes("✅")
                  ? "#EAF7EF"
                  : "#FFF0EC",
                color: message.includes("✅")
                  ? "#177245"
                  : "#A33A29",
                fontWeight: "800",
                textAlign: "center",
                lineHeight: 1.5,
                wordBreak: "break-word",
              }}
            >
              {message}
            </div>
          )}

          <p
            style={{
              color: "#98A0AE",
              fontSize: "12px",
              textAlign: "center",
              marginTop: "18px",
              marginBottom: 0,
              lineHeight: 1.5,
            }}
          >
            Trimiterea rezervării nu înseamnă confirmare automată.
            Restaurantul poate confirma sau respinge solicitarea.
          </p>
        </div>
      </section>

      <footer
        style={{
          borderTop: "1px solid #ececec",
          padding: "30px 6%",
          textAlign: "center",
          color: "#7A8393",
        }}
      >
        <strong style={{ color: "#172033" }}>
          Masago.
        </strong>{" "}
        © 2026
      </footer>
    </main>
  );
}
