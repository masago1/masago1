"use client";

import { useState } from "react";

export default function RestaurantPage() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [guests, setGuests] = useState("2");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Transformă YYYY-MM-DD în ZZ/LL/AAAA pentru afișare
  function formatDateRomanian(value) {
    if (!value) return "";
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }

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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      setMessage("Lipsesc setările Supabase.");
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

      const result = await response.text();

      if (!response.ok) {
        console.error("Supabase error:", result);
        setMessage(`Eroare Supabase: ${result}`);
        return;
      }

      setMessage("✅ Rezervarea a fost trimisă cu succes!");

      // Golim formularul după rezervare
      setDate("");
      setTime("");
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

  const inputStyle = {
    width: "100%",
    padding: "15px",
    borderRadius: "10px",
    border: "1px solid #ddd",
    fontSize: "16px",
    boxSizing: "border-box",
    background: "white",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "8px",
    fontWeight: "bold",
  };

  const fieldStyle = {
    marginBottom: "15px",
  };

  return (
    <main
      style={{
        fontFamily: "Arial, sans-serif",
        background: "#f7f7f7",
        minHeight: "100vh",
        padding: "40px 6%",
        color: "#222",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "auto",
          background: "white",
          padding: "35px",
          borderRadius: "20px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
        }}
      >
        <a
          href="/"
          style={{
            textDecoration: "none",
            color: "#555",
          }}
        >
          ← Înapoi la restaurante
        </a>

        <h1 style={{ fontSize: "32px", marginBottom: "10px" }}>
          Casa Bunicii
        </h1>

        <p>📍 Timișoara</p>
        <p>⭐ 9.2 • Bucătărie românească</p>

        <div
          style={{
            background: "#fff0ec",
            padding: "20px",
            borderRadius: "15px",
            marginTop: "20px",
            marginBottom: "30px",
          }}
        >
          <h2
            style={{
              color: "#ff5a3c",
              marginTop: "0",
            }}
          >
            -30% reducere
          </h2>

          <p>Reducerea se aplică la nota de plată.</p>
        </div>

        <h2>Rezervă o masă</h2>

        {/* DATA */}
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
                fontSize: "14px",
                color: "#666",
              }}
            >
              Data selectată:{" "}
              <strong>{formatDateRomanian(date)}</strong>
            </div>
          )}
        </div>

        {/* ORA */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Ora</label>

          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            style={inputStyle}
          >
            <option value="">Alege ora</option>
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

        {/* PERSOANE */}
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

        {/* NUME */}
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

        {/* TELEFON */}
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

        {/* BUTON */}
        <button
          onClick={handleReservation}
          disabled={loading}
          style={{
            width: "100%",
            background: loading ? "#aaa" : "#ff5a3c",
            color: "white",
            border: "none",
            borderRadius: "10px",
            padding: "16px",
            fontSize: "17px",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Se trimite..." : "Rezervă masa"}
        </button>

        {message && (
          <p
            style={{
              textAlign: "center",
              fontWeight: "bold",
              marginTop: "20px",
              wordBreak: "break-word",
            }}
          >
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
